import sha1 from "sha1";
import Zip from "jszip";
import type { Database, SqlJsStatic, BindParams } from "sql.js";

export interface ExporterCard {
  fields: string[];
  tags: string[];
}

export interface ExporterOptions {
  template: string;
  sql: SqlJsStatic;
  fields?: string[];
  cardCount?: number;
  cards: ExporterCard[];
}

interface MediaItem {
  filename: string;
  data: Buffer;
}

interface CardOptions {
  tags?: string | string[];
}

interface AnkiModel {
  name: string;
  did: number;
  id: number;
}

interface AnkiDeck {
  name: string;
  id: number;
}

function getLastKey(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj);
  return keys[keys.length - 1];
}

export default class AnkiExporter {
  private db: Database;
  private deckName: string;
  private zip: Zip;
  private media: MediaItem[];
  private topDeckId: number;
  private topModelId: number;
  private separator: string;
  private cardCount: number;
  private nextId: number;

  constructor(deckName: string, { template, sql, fields = ["Front", "Back"], cardCount = 1, cards }: ExporterOptions) {
    this.db = new sql.Database();
    this.db.run(template);

    const now = Date.now();

    this.deckName = deckName;
    this.zip = new Zip();
    this.media = [];
    this.topDeckId = now;
    this.topModelId = now + 1;
    this.separator = "\u001F";
    this.cardCount = cardCount;
    this.nextId = now + 2;

    const decks = this.getInitialRowValue<AnkiDeck>("col", "decks");
    const oldDeckKey = getLastKey(decks);
    const deck = decks[oldDeckKey];
    deck.name = this.deckName;
    deck.id = this.topDeckId;
    delete decks[oldDeckKey];
    decks[this.topDeckId] = deck;
    this.update("update col set decks=:decks where id=1", { ":decks": JSON.stringify(decks) });

    const models = this.getInitialRowValue<AnkiModel>("col", "models");
    const oldModelKey = getLastKey(models);
    const model = models[oldModelKey];
    model.name = this.deckName;
    model.did = this.topDeckId;
    model.id = this.topModelId;
    delete models[oldModelKey];
    models[this.topModelId] = model;
    this.update("update col set models=:models where id=1", { ":models": JSON.stringify(models) });

    cards.forEach((card) => this.addCard(card.fields, { tags: card.tags }));
  }

  async save(options?: Zip.JSZipGeneratorOptions): Promise<Buffer> {
    const { zip, db, media } = this;
    const binaryArray = db.export();
    const mediaObj = media.reduce<Record<number, string>>((prev, curr, idx) => {
      prev[idx] = curr.filename;
      return prev;
    }, {});

    zip.file("collection.anki2", Buffer.from(binaryArray));
    zip.file("media", JSON.stringify(mediaObj));
    media.forEach((item, i) => zip.file(String(i), item.data));

    return zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      ...options,
    }) as Promise<Buffer>;
  }

  addMedia(filename: string, data: Buffer): void {
    this.media.push({ filename, data });
  }

  addCard(fieldValues: string[], { tags }: CardOptions = {}): void {
    const { topDeckId, topModelId, separator, cardCount } = this;
    const flds = fieldValues.join(separator);
    const noteGuid = this.getNoteGuid(topDeckId, flds);
    const noteId = this.nextId++;

    let strTags = "";
    if (typeof tags === "string") {
      strTags = tags;
    } else if (Array.isArray(tags)) {
      strTags = this.tagsToStr(tags);
    }

    this.update(
      "insert or replace into notes values(:id,:guid,:mid,:mod,:usn,:tags,:flds,:sfld,:csum,:flags,:data)",
      {
        ":id": noteId,
        ":guid": noteGuid,
        ":mid": topModelId,
        ":mod": noteId,
        ":usn": -1,
        ":tags": strTags,
        ":flds": flds,
        ":sfld": fieldValues[0],
        ":csum": this.checksum(flds),
        ":flags": 0,
        ":data": "",
      }
    );

    for (let ord = 0; ord < cardCount; ord++) {
      const cardId = this.nextId++;
      this.update(
        "insert or replace into cards values(:id,:nid,:did,:ord,:mod,:usn,:type,:queue,:due,:ivl,:factor,:reps,:lapses,:left,:odue,:odid,:flags,:data)",
        {
          ":id": cardId,
          ":nid": noteId,
          ":did": topDeckId,
          ":ord": ord,
          ":mod": cardId,
          ":usn": -1,
          ":type": 0,
          ":queue": 0,
          ":due": 179 + ord,
          ":ivl": 0,
          ":factor": 0,
          ":reps": 0,
          ":lapses": 0,
          ":left": 0,
          ":odue": 0,
          ":odid": 0,
          ":flags": 0,
          ":data": "",
        }
      );
    }
  }

  private update(query: string, params: BindParams): void {
    this.db.run(query, params);
  }

  private getInitialRowValue<T>(table: string, column: string): Record<string, T> {
    const query = `select ${column} from ${table}`;
    const result = this.db.exec(query);
    return JSON.parse(result[0].values[0][0] as string) as Record<string, T>;
  }

  private checksum(str: string): number {
    return parseInt(sha1(str).substr(0, 8), 16);
  }

  private getNoteGuid(deckId: number, flds: string): string {
    return sha1(`${deckId}${flds}`).substr(0, 10);
  }

  private tagsToStr(tags: string[]): string {
    return ` ${tags.join(" ")} `;
  }
}

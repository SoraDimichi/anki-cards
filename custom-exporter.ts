import sha1 from "sha1";
import Zip from "jszip";
import type { Database, SqlJsStatic, BindParams } from "sql.js";

interface TemplateOptions {
  questionFormat?: string;
  answerFormat?: string;
  reverseQuestionFormat?: string;
  reverseAnswerFormat?: string;
  css?: string;
  fields?: string[];
}

interface ExporterOptions {
  template: string;
  sql: SqlJsStatic;
  fields?: string[];
  cardCount?: number;
}

interface MediaItem {
  filename: string;
  data: Buffer;
}

interface CardOptions {
  tags?: string | string[];
}

interface AnkiField {
  name: string;
  media: unknown[];
  sticky: boolean;
  rtl: boolean;
  ord: number;
  font: string;
  size: number;
}

interface AnkiTemplate {
  name: string;
  qfmt: string;
  did: number | null;
  bafmt: string;
  afmt: string;
  ord: number;
  bqfmt: string;
}

interface AnkiModel {
  veArs: unknown[];
  name: string;
  tags: string[];
  did: number;
  usn: number;
  req: [number, string, number[]][];
  flds: AnkiField[];
  sortf: number;
  latexPre: string;
  tmpls: AnkiTemplate[];
  latexPost: string;
  type: number;
  id: number;
  css: string;
  mod: number;
}

interface AnkiDeck {
  desc: string;
  name: string;
  extendRev: number;
  usn: number;
  collapsed: boolean;
  newToday: [number, number];
  timeToday: [number, number];
  dyn: number;
  extendNew: number;
  conf: number;
  revToday: [number, number];
  lrnToday: [number, number];
  id: number;
  mod: number;
}

export function createTemplate({
  questionFormat = "{{Front}}",
  answerFormat = '{{FrontSide}}\n\n<hr id="answer">\n\n{{Back}}',
  reverseQuestionFormat,
  reverseAnswerFormat,
  css = ".card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\nbackground-color: white;\n}\n",
  fields = ["Front", "Back"],
}: TemplateOptions = {}): string {
  const hasReverse = reverseQuestionFormat && reverseAnswerFormat;
  const conf = {
    nextPos: 1,
    estTimes: true,
    activeDecks: [1],
    sortType: "noteFld",
    timeLim: 0,
    sortBackwards: false,
    addToCur: true,
    curDeck: 1,
    newBury: true,
    newSpread: 0,
    dueCounts: true,
    curModel: "1435645724216",
    collapseTime: 1200,
  };

  const flds = fields.map((name, ord) => ({
    name,
    media: [],
    sticky: false,
    rtl: false,
    ord,
    font: "Arial",
    size: 20,
  }));

  const tmpls: AnkiTemplate[] = [
    {
      name: "Card 1",
      qfmt: questionFormat,
      did: null,
      bafmt: "",
      afmt: answerFormat,
      ord: 0,
      bqfmt: "",
    },
  ];

  if (hasReverse) {
    tmpls.push({
      name: "Card 2",
      qfmt: reverseQuestionFormat,
      did: null,
      bafmt: "",
      afmt: reverseAnswerFormat,
      ord: 1,
      bqfmt: "",
    });
  }

  const req: [number, string, number[]][] = hasReverse
    ? [[0, "all", [0]], [1, "all", [1]]]
    : [[0, "all", [0]]];

  const models = {
    1388596687391: {
      veArs: [],
      name: "Basic-f15d2",
      tags: ["Tag"],
      did: 1435588830424,
      usn: -1,
      req,
      flds,
      sortf: 0,
      latexPre:
        "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
      tmpls,
      latexPost: "\\end{document}",
      type: 0,
      id: 1388596687391,
      css,
      mod: 1435645658,
    },
  };

  const decks = {
    1: {
      desc: "",
      name: "Default",
      extendRev: 50,
      usn: 0,
      collapsed: false,
      newToday: [0, 0],
      timeToday: [0, 0],
      dyn: 0,
      extendNew: 10,
      conf: 1,
      revToday: [0, 0],
      lrnToday: [0, 0],
      id: 1,
      mod: 1435645724,
    },
    1435588830424: {
      desc: "",
      name: "Template",
      extendRev: 50,
      usn: -1,
      collapsed: false,
      newToday: [545, 0],
      timeToday: [545, 0],
      dyn: 0,
      extendNew: 10,
      conf: 1,
      revToday: [545, 0],
      lrnToday: [545, 0],
      id: 1435588830424,
      mod: 1435588830,
    },
  };

  const dconf = {
    1: {
      name: "Default",
      replayq: true,
      lapse: { leechFails: 8, minInt: 1, delays: [10], leechAction: 0, mult: 0 },
      rev: { perDay: 100, fuzz: 0.05, ivlFct: 1, maxIvl: 36500, ease4: 1.3, bury: true, minSpace: 1 },
      timer: 0,
      maxTaken: 60,
      usn: 0,
      new: { perDay: 20, delays: [1, 10], separate: true, ints: [1, 4, 7], initialFactor: 2500, bury: true, order: 1 },
      mod: 0,
      id: 1,
      autoplay: true,
    },
  };

  return `
    PRAGMA foreign_keys=OFF;
    BEGIN TRANSACTION;
    CREATE TABLE col (
        id              integer primary key,
        crt             integer not null,
        mod             integer not null,
        scm             integer not null,
        ver             integer not null,
        dty             integer not null,
        usn             integer not null,
        ls              integer not null,
        conf            text not null,
        models          text not null,
        decks           text not null,
        dconf           text not null,
        tags            text not null
    );
    INSERT INTO "col" VALUES(
      1,
      1388548800,
      1435645724219,
      1435645724215,
      11,
      0,
      0,
      0,
      '${JSON.stringify(conf)}',
      '${JSON.stringify(models)}',
      '${JSON.stringify(decks)}',
      '${JSON.stringify(dconf)}',
      '{}'
    );
    CREATE TABLE notes (
        id              integer primary key,
        guid            text not null,
        mid             integer not null,
        mod             integer not null,
        usn             integer not null,
        tags            text not null,
        flds            text not null,
        sfld            integer not null,
        csum            integer not null,
        flags           integer not null,
        data            text not null
    );
    CREATE TABLE cards (
        id              integer primary key,
        nid             integer not null,
        did             integer not null,
        ord             integer not null,
        mod             integer not null,
        usn             integer not null,
        type            integer not null,
        queue           integer not null,
        due             integer not null,
        ivl             integer not null,
        factor          integer not null,
        reps            integer not null,
        lapses          integer not null,
        left            integer not null,
        odue            integer not null,
        odid            integer not null,
        flags           integer not null,
        data            text not null
    );
    CREATE TABLE revlog (
        id              integer primary key,
        cid             integer not null,
        usn             integer not null,
        ease            integer not null,
        ivl             integer not null,
        lastIvl         integer not null,
        factor          integer not null,
        time            integer not null,
        type            integer not null
    );
    CREATE TABLE graves (
        usn             integer not null,
        oid             integer not null,
        type            integer not null
    );
    ANALYZE sqlite_master;
    INSERT INTO "sqlite_stat1" VALUES('col',NULL,'1');
    CREATE INDEX ix_notes_usn on notes (usn);
    CREATE INDEX ix_cards_usn on cards (usn);
    CREATE INDEX ix_revlog_usn on revlog (usn);
    CREATE INDEX ix_cards_nid on cards (nid);
    CREATE INDEX ix_cards_sched on cards (did, queue, due);
    CREATE INDEX ix_revlog_cid on revlog (cid);
    CREATE INDEX ix_notes_csum on notes (csum);
    COMMIT;
  `;
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
  private fields: string[];
  private cardCount: number;
  private nextId: number;

  constructor(deckName: string, { template, sql, fields = ["Front", "Back"], cardCount = 1 }: ExporterOptions) {
    this.db = new sql.Database();
    this.db.run(template);

    const now = Date.now();

    this.deckName = deckName;
    this.zip = new Zip();
    this.media = [];
    this.topDeckId = now;
    this.topModelId = now + 1;
    this.separator = "\u001F";
    this.fields = fields;
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

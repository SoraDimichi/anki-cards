import initSqlJs from "sql.js";
import AnkiExporter, { createTemplate } from "./custom-exporter.ts";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { basename, join } from "node:path";

interface Card {
  front: string;
  back: string;
  tags?: string[];
  example?: string;
  exampleTranslation?: string;
}

interface DeckTemplate {
  questionFormat?: string;
  answerFormat?: string;
  css?: string;
}

interface Deck {
  name: string;
  tts?: string;
  cards: Card[];
  template?: DeckTemplate;
}

const sql = await initSqlJs();

const deckFile = process.argv[2];
if (!deckFile) {
  console.error("Usage: npm run generate <deck.json>");
  process.exit(1);
}

const deckPath = join("decks", deckFile);
const raw = await readFile(deckPath, "utf-8");
const deck: Deck = JSON.parse(raw);

const defaultCss = `.card { font-family: arial; font-size: 20px; text-align: center; background-color: #121212; color: #e0e0e0; }
.front { color: #ef5350; font-weight: bold; }
.back { color: #e0e0e0; }
.example { margin-top: 1em; padding: 0.8em; background-color: #383838; border-radius: 8px; font-style: italic; color: #ababab; }
.example-translation { margin-top: 0.5em; font-size: 0.85em; color: #888; font-style: normal; }`;

const ttsLang = deck.tts ?? null;
const fields = ["Front", "Back", "Example", "ExampleTranslation"];

const buildQuestionFormat = (): string => {
  const tts = ttsLang ? `{{tts ${ttsLang}:Front}}` : "";
  return `${tts}<div class="front">{{Front}}</div>`;
};

const buildAnswerFormat = (): string => {
  const ttsFront = ttsLang ? `{{tts ${ttsLang}:Front}}` : "";
  const ttsExample = ttsLang ? `{{tts ${ttsLang}:Example}}` : "";

  return `${ttsFront}<div class="front">{{Front}}</div>
<hr id="answer">
<div class="back">{{Back}}</div>
{{#Example}}
${ttsExample}<div class="example">{{Example}}{{#ExampleTranslation}}<div class="example-translation">{{ExampleTranslation}}</div>{{/ExampleTranslation}}</div>
{{/Example}}`;
};

const css = deck.template?.css ?? defaultCss;

const template = createTemplate({
  questionFormat: deck.template?.questionFormat ?? buildQuestionFormat(),
  answerFormat: deck.template?.answerFormat ?? buildAnswerFormat(),
  css,
  fields,
});

const apkg = new AnkiExporter(deck.name, { template, sql, fields });

deck.cards
  .map((card) => ({
    fields: [
      card.front,
      card.back,
      card.example ?? "",
      card.exampleTranslation ?? "",
    ],
    tags: card.tags ?? [],
  }))
  .forEach((card) => apkg.addCard(card.fields, { tags: card.tags }));

await mkdir("dist", { recursive: true });
const zip = await apkg.save();
const outputName = basename(deckFile, ".json") + ".apkg";
const outputPath = join("dist", outputName);
await writeFile(outputPath, zip, "binary");

console.log(`Generated: ${outputPath}`);

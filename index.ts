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
.front, .example-text, .example-translation { margin-top: 0.5em; }
.example, #hint-btn { margin-top: 1em; }
.front-container { margin-bottom: 0.5em; }
.front { color: #ef5350; font-weight: bold; }
.example { padding: 0.8em; background-color: #383838; border-radius: 8px; font-style: italic; color: #ababab; }
.example-translation { font-size: 0.85em; color: #888; font-style: normal; }
#hint-btn { cursor: pointer; color: #aaa; user-select: none; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "DejaVu Sans Mono", "Liberation Mono", "Courier New", monospace; letter-spacing: 1px; }
#hint-btn:hover { color: #ccc; }`;

const ttsLang = deck.tts ?? null;
const fields = ["Front", "Back", "Example", "ExampleTranslation"];

const buildHintScript = (answerField: string): string => `
<div id="hint-btn" onclick="revealNext()">💡</div>
<script>
var answer = "{{${answerField}}}";
var revealed = 0;
function revealNext() {
  if (revealed < answer.length) {
    revealed++;
    document.getElementById("hint-btn").textContent = answer.slice(0, revealed) + "_".repeat(answer.length - revealed);
  }
}
</script>`;

const buildQuestionFormat = (): string => {
  const tts = ttsLang ? `{{tts ${ttsLang}:Front}}` : "";
  return `<div class="front-container">${tts}<div class="front">{{Front}}</div></div>${buildHintScript("Back")}`;
};

const buildAnswerFormat = (): string => {
  const ttsFront = ttsLang ? `{{tts ${ttsLang}:Front}}` : "";
  const ttsExample = ttsLang ? `{{tts ${ttsLang}:Example}}` : "";

  return `<div class="front-container">${ttsFront}<div class="front">{{Front}}</div></div>
<hr id="answer">
<div class="back">{{Back}}</div>
{{#Example}}
<div class="example">${ttsExample}<div class="example-text">{{Example}}</div>{{#ExampleTranslation}}<div class="example-translation">{{ExampleTranslation}}</div>{{/ExampleTranslation}}</div>
{{/Example}}`;
};

const buildReverseQuestionFormat = (): string => {
  return `<div class="back">{{Back}}</div>${buildHintScript("Front")}`;
};

const buildReverseAnswerFormat = (): string => {
  const ttsFront = ttsLang ? `{{tts ${ttsLang}:Front}}` : "";
  const ttsExample = ttsLang ? `{{tts ${ttsLang}:Example}}` : "";

  return `<div class="back">{{Back}}</div>
<hr id="answer">
<div class="front-container">${ttsFront}<div class="front">{{Front}}</div></div>
{{#Example}}
<div class="example">${ttsExample}<div class="example-text">{{Example}}</div>{{#ExampleTranslation}}<div class="example-translation">{{ExampleTranslation}}</div>{{/ExampleTranslation}}</div>
{{/Example}}`;
};

const css = deck.template?.css ?? defaultCss;

const template = createTemplate({
  questionFormat: deck.template?.questionFormat ?? buildQuestionFormat(),
  answerFormat: deck.template?.answerFormat ?? buildAnswerFormat(),
  reverseQuestionFormat: buildReverseQuestionFormat(),
  reverseAnswerFormat: buildReverseAnswerFormat(),
  css,
  fields,
});

const apkg = new AnkiExporter(deck.name, { template, sql, fields, cardCount: 2 });

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

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
.example-translation { margin-top: 0.5em; font-size: 0.85em; color: #888; font-style: normal; }
#hint-btn { cursor: pointer; color: #666; margin-top: 1em; user-select: none; font-family: monospace; letter-spacing: 0.1em; }
#hint-btn:hover { color: #888; }`;

const ttsLang = deck.tts ?? null;
const fields = ["Front", "Back", "Example", "ExampleTranslation"];

const buildHintScript = (answerField: string): string => `
<div id="hint-btn" onclick="revealNext()">💡 Hint</div>
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
  return `${tts}<div class="front">{{Front}}</div>${buildHintScript("Back")}`;
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

const buildReverseQuestionFormat = (): string => {
  return `<div class="back">{{Back}}</div>${buildHintScript("Front")}`;
};

const buildReverseAnswerFormat = (): string => {
  const ttsFront = ttsLang ? `{{tts ${ttsLang}:Front}}` : "";
  const ttsExample = ttsLang ? `{{tts ${ttsLang}:Example}}` : "";

  return `<div class="back">{{Back}}</div>
<hr id="answer">
${ttsFront}<div class="front">{{Front}}</div>
{{#Example}}
${ttsExample}<div class="example">{{Example}}{{#ExampleTranslation}}<div class="example-translation">{{ExampleTranslation}}</div>{{/ExampleTranslation}}</div>
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

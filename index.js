import pkg from "anki-apkg-export";
const AnkiExport = pkg.default;
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { basename, join } from "node:path";

const deckFile = process.argv[2];
if (!deckFile) {
  console.error("Usage: npm run generate <deck.json>");
  process.exit(1);
}

const deckPath = join("decks", deckFile);
const raw = await readFile(deckPath, "utf-8");
const deck = JSON.parse(raw);

const defaultCss = `.card { font-family: arial; font-size: 20px; text-align: center; background-color: #121212; color: #e0e0e0; }
.front { color: #ef5350; font-weight: bold; }
.back { color: #b0b0b0; }
.example { margin-top: 1em; padding: 0.8em; background-color: #424242; border-radius: 8px; font-style: italic; color: #e0e0e0; }
.example-translation { margin-top: 0.5em; font-size: 0.85em; color: #888; font-style: normal; }`;

const template = {
  questionFormat: '<div class="front">{{Front}}</div>',
  answerFormat: '<div class="front">{{Front}}</div><hr id="answer"><div class="back">{{Back}}</div>',
  ...deck.template,
  css: deck.template?.css ?? defaultCss,
};

const apkg = new AnkiExport(deck.name, template);

const buildBack = (card) => {
  if (!card.example) return card.back;
  const translation = card.exampleTranslation
    ? `<div class="example-translation">${card.exampleTranslation}</div>`
    : "";
  return `${card.back}<div class="example">${card.example}${translation}</div>`;
};

deck.cards
  .map((card) => ({ front: card.front, back: buildBack(card), tags: card.tags ?? [] }))
  .forEach((card) => apkg.addCard(card.front, card.back, { tags: card.tags }));

await mkdir("dist", { recursive: true });
const zip = await apkg.save();
const outputName = basename(deckFile, ".json") + ".apkg";
const outputPath = join("dist", outputName);
await writeFile(outputPath, zip, "binary");

console.log(`Generated: ${outputPath}`);

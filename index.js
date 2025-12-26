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

const apkg = new AnkiExport(deck.name);

for (const card of deck.cards) {
  apkg.addCard(card.front, card.back, { tags: card.tags ?? [] });
}

await mkdir("dist", { recursive: true });
const zip = await apkg.save();
const outputName = basename(deckFile, ".json") + ".apkg";
const outputPath = join("dist", outputName);
await writeFile(outputPath, zip, "binary");

console.log(`Generated: ${outputPath}`);

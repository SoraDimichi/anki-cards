import { writeFile, mkdir } from "node:fs/promises";
import { basename, join } from "node:path";
import { prepareDeck } from "./deck/index.ts";
import { createExporter } from "./exporter/index.ts";

const deckFile = process.argv[2];
if (!deckFile) {
  console.error("Usage: npm run generate <deck.json>");
  process.exit(1);
}

const prepared = await prepareDeck(deckFile);
const apkg = await createExporter(prepared);

await mkdir("dist", { recursive: true });
const zip = await apkg.save();
const outputName = basename(deckFile, ".json") + ".apkg";
const outputPath = join("dist", outputName);
await writeFile(outputPath, zip, "binary");

console.log(`Generated: ${outputPath}`);

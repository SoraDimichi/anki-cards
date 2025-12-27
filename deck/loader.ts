import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface Card {
  front: string;
  back: string;
  tags?: string[];
  example?: string;
  exampleTranslation?: string;
}

export interface DeckTemplate {
  questionFormat?: string;
  answerFormat?: string;
  css?: string;
}

export interface Deck {
  name: string;
  tts?: string;
  cards: Card[];
  template?: DeckTemplate;
}

export async function loadDeck(filename: string): Promise<Deck> {
  const deckPath = join("decks", filename);
  const raw = await readFile(deckPath, "utf-8");
  return JSON.parse(raw) as Deck;
}

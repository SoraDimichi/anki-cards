import { loadDeck } from "./loader.ts";
import { buildDeck, type DeckTemplates } from "./builder.ts";

export type { DeckTemplates };

export interface PreparedCard {
  fields: string[];
  tags: string[];
}

export interface PreparedDeck {
  deckName: string;
  templates: DeckTemplates;
  cards: PreparedCard[];
}

export async function prepareDeck(filename: string): Promise<PreparedDeck> {
  const deck = await loadDeck(filename);
  const templates = await buildDeck(deck);

  const cards = deck.cards.map((card) => ({
    fields: [
      card.front,
      card.back,
      card.example ?? "",
      card.exampleTranslation ?? "",
    ],
    tags: card.tags ?? [],
  }));

  return { deckName: deck.name, templates, cards };
}

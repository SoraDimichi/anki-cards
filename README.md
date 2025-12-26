# Anki Cards Generator

Generate Anki decks (.apkg) from JSON files.

## Setup

```bash
npm install
```

## Usage

```bash
npm run generate -- <deck.json>
```

Example:

```bash
npm run generate -- vocabulary.json
```

This reads `decks/vocabulary.json` and outputs `dist/vocabulary.apkg`.

## Deck Format

Create JSON files in the `decks/` directory:

```json
{
  "name": "Deck Name",
  "cards": [
    { "front": "Question", "back": "Answer" },
    { "front": "Another question", "back": "Another answer", "tags": ["tag1", "tag2"] }
  ]
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Deck name shown in Anki |
| `cards` | Yes | Array of cards |
| `cards[].front` | Yes | Front side of the card |
| `cards[].back` | Yes | Back side of the card |
| `cards[].tags` | No | Array of tags |

## Output

Generated `.apkg` files are saved to `dist/` and can be imported directly into Anki.

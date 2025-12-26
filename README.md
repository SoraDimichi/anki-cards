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
| `cards[].example` | No | Example sentence using the word |
| `cards[].exampleTranslation` | No | Translation of the example sentence |

## Example with Context

Use `example` and `exampleTranslation` fields to show words in context:

```json
{
  "name": "Vocabulary",
  "cards": [
    {
      "front": "ephemeral",
      "back": "lasting for a very short time",
      "example": "The ephemeral beauty of cherry blossoms reminds us to appreciate the moment.",
      "exampleTranslation": "La belleza efímera de los cerezos en flor nos recuerda apreciar el momento."
    }
  ]
}
```

## Output

Generated `.apkg` files are saved to `dist/` and can be imported directly into Anki.

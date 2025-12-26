# Anki Cards Generator

<img width="650" height="243" alt="image" src="https://github.com/user-attachments/assets/eeeacac3-2301-4b0f-9dc3-5db6b46af4f3" />

Generate Anki decks (.apkg) from JSON files with support for examples and text-to-speech.

Based on [anki-apkg-export](https://github.com/repeat-space/anki-apkg-export).

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
    {
      "front": "Another question",
      "back": "Another answer",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

| Field                        | Required | Description                                               |
| ---------------------------- | -------- | --------------------------------------------------------- |
| `name`                       | Yes      | Deck name shown in Anki                                   |
| `tts`                        | No       | Language code for text-to-speech (e.g., `es_ES`, `en_US`) |
| `cards`                      | Yes      | Array of cards                                            |
| `cards[].front`              | Yes      | Front side of the card                                    |
| `cards[].back`               | Yes      | Back side of the card                                     |
| `cards[].tags`               | No       | Array of tags                                             |
| `cards[].example`            | No       | Example sentence                                          |
| `cards[].exampleTranslation` | No       | Translation of the example                                |

## Full Example

```json
{
  "name": "Vocabulary",
  "tts": "en_US",
  "cards": [
    {
      "front": "Ephemeral",
      "back": "Efímero",
      "example": "The ephemeral beauty of cherry blossoms reminds us to appreciate the moment.",
      "exampleTranslation": "La belleza efímera de los cerezos en flor nos recuerda apreciar el momento."
      "tags": ["adjective", "advanced"],
    }
  ]
}
```

`tts`, `tags`, `example`, and `exampleTranslation` are optional.

## Text-to-Speech (TTS)

Add the `tts` field to enable automatic pronunciation. Anki reads the front and example aloud. See [language codes](https://en.wikipedia.org/wiki/IETF_language_tag).

**Requirements:** Anki 2.1.50+, AnkiMobile 2.0.84+, or AnkiDroid 2.17+

## Card Modes

Each card generates two study directions:

| Mode     | Question | Answer | Description                    |
| -------- | -------- | ------ | ------------------------------ |
| Regular  | Front    | Back   | See the word, recall meaning   |
| Reversed | Back     | Front  | See the meaning, recall word   |

### Hint Button

Reversed cards include a 💡 hint button. Click it to reveal the answer one letter at a time:

```
💡 → E________ → Ep_______ → Eph______ → ... → Ephemeral
```

### Studying Reversed Cards Only

To study only reversed cards, create a filtered deck:

1. Tools → Create Filtered Deck
2. Search: `"deck:Your Deck" card:2`

## Output

Generated `.apkg` files are saved to `dist/` and can be imported directly into Anki.

## References

- [Anki Manual - Field Replacements](https://docs.ankiweb.net/templates/fields.html)
- [Anki Manual - Conditional Replacement](https://docs.ankiweb.net/templates/generation.html)
- [AnkiMobile TTS](https://docs.ankimobile.net/tts.html)
- [anki-apkg-export](https://github.com/repeat-space/anki-apkg-export)

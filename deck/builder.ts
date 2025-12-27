import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Deck } from "./loader.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function loadFile(name: string): Promise<string> {
  const path = join(__dirname, name);
  return readFile(path, "utf-8");
}

async function loadTemplate(name: string): Promise<string> {
  return loadFile(join("templates", name));
}

export interface DeckTemplates {
  questionFormat: string;
  answerFormat: string;
  reverseQuestionFormat: string;
  reverseAnswerFormat: string;
  css: string;
  fields: string[];
}

export async function buildDeck(deck: Deck): Promise<DeckTemplates> {
  const ttsLang = deck.tts ?? null;
  const ttsFront = ttsLang ? `{{tts ${ttsLang}:Front}}` : "";
  const ttsExample = ttsLang ? `{{tts ${ttsLang}:Example}}` : "";

  const [css, question, answer, questionReverse, answerReverse, hintScript] = await Promise.all([
    loadTemplate("styles.css"),
    loadTemplate("question.html"),
    loadTemplate("answer.html"),
    loadTemplate("question-reverse.html"),
    loadTemplate("answer-reverse.html"),
    loadFile("hint-script.ts"),
  ]);

  const replacePlaceholders = (template: string): string =>
    template
      .replace(/\{\{TTS_FRONT\}\}/g, ttsFront)
      .replace(/\{\{TTS_EXAMPLE\}\}/g, ttsExample)
      .replace(/\{\{HINT_SCRIPT\}\}/g, hintScript.trim());

  return {
    questionFormat: deck.template?.questionFormat ?? replacePlaceholders(question).trim(),
    answerFormat: deck.template?.answerFormat ?? replacePlaceholders(answer).trim(),
    reverseQuestionFormat: replacePlaceholders(questionReverse).trim(),
    reverseAnswerFormat: replacePlaceholders(answerReverse).trim(),
    css: deck.template?.css ?? css,
    fields: ["Front", "Back", "Example", "ExampleTranslation"],
  };
}

import initSqlJs from "sql.js";
import AnkiExporter from "./exporter.ts";
import { createTemplate } from "./template.ts";

interface Card {
  fields: string[];
  tags: string[];
}

interface Templates {
  questionFormat: string;
  answerFormat: string;
  reverseQuestionFormat: string;
  reverseAnswerFormat: string;
  css: string;
  fields: string[];
}

interface CreateExporterOptions {
  deckName: string;
  templates: Templates;
  cards: Card[];
}

export async function createExporter({
  deckName,
  templates,
  cards,
}: CreateExporterOptions): Promise<AnkiExporter> {
  const sql = await initSqlJs();

  const template = createTemplate({
    questionFormat: templates.questionFormat,
    answerFormat: templates.answerFormat,
    reverseQuestionFormat: templates.reverseQuestionFormat,
    reverseAnswerFormat: templates.reverseAnswerFormat,
    css: templates.css,
    fields: templates.fields,
  });

  return new AnkiExporter(deckName, {
    template,
    sql,
    fields: templates.fields,
    cardCount: 2,
    cards,
  });
}

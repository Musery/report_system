import docx from "docx";
const { TextRun } = docx;

const id = "code";

export const code = {
  id,
  toDocx(mdast) {
    if (mdast.type === id)
      return {
        style: "Code Text",
        children: [new TextRun({ text: mdast.value })],
      };
  },
};

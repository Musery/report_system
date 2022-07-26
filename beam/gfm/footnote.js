import docx from "docx";
const { Paragraph } = docx;

const id = "footnote";

export const footnote = [
  {
    id: `${id}Definition`,
    toDocx(mdast, traverseChildren) {
      if (mdast.type === `${id}Definition`) {
        return {
          footnote: true,
          label: Number(mdast.label),
          children: traverseChildren(mdast).map((option) => {
            option.style = "Footnote";
            return new Paragraph(option);
          }),
        };
      }
    },
  },
  {
    id: `${id}Reference`,
    toDocx(mdast) {
      if (mdast.type === `${id}Reference`)
        return {
          footnote: true,
          label: Number(mdast.label),
        };
    },
  },
];

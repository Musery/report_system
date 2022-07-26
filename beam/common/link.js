import docx from "docx";
const { TextRun } = docx;
const id = "link";

export const link = {
  id,
  toDocx(mdast, traverseChildren) {
    if (mdast.type === id)
      return {
        link: true,
        url: mdast.url,
        children: traverseChildren(mdast).map((run) => {
          run.style = "Hyperlink";
          return new TextRun(run);
        }),
      };
  },
};

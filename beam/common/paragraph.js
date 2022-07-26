import docx from "docx";
const { TextRun, ExternalHyperlink, FootnoteReferenceRun, Run } = docx;

const id = "paragraph";

export const paragraph = {
  id,
  toDocx(mdast, traverseChildren) {
    if (mdast.type === id)
      return {
        style: "Normal Indent",
        children: traverseChildren(mdast).map((run) => {
          if (run.link) {
            return new ExternalHyperlink({
              link: run.url,
              children: run.children,
            });
          } else if (run.footnote) {
            return new FootnoteReferenceRun(run.label);
          } else {
            return new TextRun(run);
          }
        }),
      };
  },
};

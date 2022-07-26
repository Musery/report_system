import docx from "docx";
const { TextRun, ExternalHyperlink, FootnoteReferenceRun, Run } = docx;

const id = "heading";

const styles = ["heading 1", "heading 2", "heading 3"];

export const heading = {
  id,
  toDocx(mdast, traverseChildren) {
    if (mdast.type === id) {
      return {
        style: styles[(mdast.depth - 1) >> 1],
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
    }
  },
};

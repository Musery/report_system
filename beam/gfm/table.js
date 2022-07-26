import docx from "docx";
const {
  Paragraph,
  WidthType,
  TableCell,
  TableRow,
  TextRun,
  FootnoteReferenceRun,
  ExternalHyperlink,
} = docx;

const id = "table";

export const table = {
  id,
  toDocx(mdast, traverseChildren) {
    if (mdast.type === id) {
      const align = mdast.align;
      const rows = [];
      for (let i = 0; i < mdast.children.length; i++) {
        const cells = [];
        for (let j = 0; j < mdast.children[i].children.length; j++) {
          cells.push(
            new TableCell({
              children: [
                new Paragraph({
                  children: traverseChildren(mdast.children[i].children[j]).map(
                    (run) => {
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
                    }
                  ),
                  alignment: align[j],
                }),
              ],
            })
          );
        }
        rows.push(
          new TableRow({
            children: cells,
          })
        );
      }
      return {
        table: true,
        style: "table-def",
        width: {
          size: 9070,
          type: WidthType.DXA,
        },
        rows: rows,
      };
    }
  },
};

import docx from "docx";
const { Paragraph, Table } = docx;

const id = "root";

export const root = {
  id,
  toDocx(mdast, traverseChildren) {
    if (mdast.type === id) {
      // 优化掉root的处理流程
      const paragraph = [];
      const footnotes = {};
      let index = 0;
      while (index < mdast.children.length) {
        for (let result of traverseChildren(mdast, index)) {
          if (result.footnote) {
            // 脚注 表格只会进行单个返回
            footnotes[result.label] = { children: result.children };
          } else if (result.table) {
            paragraph.push(new Table(result));
          } else {
            paragraph.push(new Paragraph(result));
          }
        }
        index++;
      }
      return { paragraph, footnotes };
    }
  },
};

const id = "blockquote";

export const blockquote = {
  id,
  toDocx(mdast, traverseChildren) {
    if (mdast.type === id) return traverse1(mdast, traverseChildren);
  },
};

const styles = ["Block Text"];

// 样式上暂时不支持多级区块
function traverse1(mdast, traverseChildren, deep = 1) {
  const children = [];
  let index = 0;
  for (let child of mdast.children) {
    if (child.type === id) {
      const result = traverse1(child, traverseChildren, deep + 1);
      children.push(...result);
    } else if (child.type === "paragraph") {
      const result = traverseChildren(mdast, index);
      for (let options of result) {
        options.style = styles[deep < styles.length ? deep : styles.length - 1];
        children.push(options);
      }
    }
    index++;
  }
  return children;
}

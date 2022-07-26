const id = "list";

export const list = {
  id,
  toDocx(mdast, traverseChildren) {
    if (mdast.type === id) return traverse1(mdast, traverseChildren);
  },
};
function traverse1(mdast, traverseChildren, deep = 1) {
  const children = [];
  for (let item of mdast.children) {
    for (let child of item.children) {
      let index = 0;
      if (child.type === id) {
        const result = traverse1(child, traverseChildren, deep + 1);
        children.push(...result);
      } else if (child.type === "paragraph") {
        const result = traverseChildren(item, index);
        children.push(
          mdast.ordered
            ? {
                numbering: {
                  reference: "c-numbering",
                  level: deep,
                },
                children: result[0].children,
              }
            : {
                bullet: {
                  level: deep,
                },
                children: result[0].children,
              }
        );
      }
      index++;
    }
  }
  return children;
}

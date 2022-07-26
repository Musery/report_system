const id = "emphasis";

export const emphasis = {
  id,
  toDocx(mdast, traverseChildren) {
    if (mdast.type === id)
      return traverseChildren(mdast).map((child) => {
        child.italics = true;
        return child;
      });
  },
};

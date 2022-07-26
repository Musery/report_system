const id = "strong";

export const strong = {
  id,
  toDocx(mdast, traverseChildren) {
    if (mdast.type === id)
      return traverseChildren(mdast).map((child) => {
        child.bold = true;
        return child;
      });
  },
};

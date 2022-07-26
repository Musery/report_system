const id = "delete";

export const _delete = {
  id,
  toDocx(mdast, traverseChildren) {
    if (mdast.type === id)
      return traverseChildren(mdast).map((child) => {
        child.strike = true;
        return child;
      });
  },
};

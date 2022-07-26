const id = "break";

export const _break = {
  id,
  toDocx(mdast) {
    if (mdast.type === id) return { break: 1 };
  },
};

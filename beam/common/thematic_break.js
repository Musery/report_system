const id = "thematicBreak";

export const thematicBreak = {
  id,
  toDocx(mdast) {
    if (mdast.type === id) return { thematicBreak: true };
  },
};

const id = "text";

export const text = {
  id,
  toDocx(mdast) {
    if (mdast.type === id) return { text: mdast.value };
  },
};

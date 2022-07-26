const id = "inlineCode";

export const inlineCode = {
  id,
  toDocx(mdast) {
    if (mdast.type === id)
      return {
        text: mdast.value,
        highlight: "yellow",
      };
  },
};

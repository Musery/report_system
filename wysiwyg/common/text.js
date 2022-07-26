import { u } from "unist-builder";
const id = "text";

export const text = {
  id,
  node: {
    group: "inline",
  },
  toMdast(prose) {
    if (prose.type.name === id) return u(id, prose.textContent);
  },
  // 从MDAST解析
  toProse(mdast, schema) {
    if (mdast.type === id) return schema.text(mdast.value);
  },
};

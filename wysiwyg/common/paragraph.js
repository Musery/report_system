import { u } from "unist-builder";

const id = "paragraph";

export const paragraph = {
  id,
  node: {
    content: "inline*",
    group: "block",
    parseDOM: [{ tag: "p" }],
    toDOM() {
      return ["p", { class: "paragraph" }, 0];
    },
  },
  toMdast(prose, traverseChildren) {
    if (prose.type.name === id) return u(id, traverseChildren(prose));
  },
  // 从MDAST解析
  toProse(mdast, schema, traverseChildren) {
    if (mdast.type === id) return schema.node(id, {}, traverseChildren(mdast));
  },
};

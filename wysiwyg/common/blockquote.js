import { wrappingInputRule } from "../util/inputrules.js";
import { u } from "unist-builder";

const id = "blockquote";

export const blockquote = {
  id,
  inputrules: [wrappingInputRule(/^\s*>\s$/, id)],
  // prosemirror 渲染方式
  node: {
    content: "block+",
    group: "block",
    defining: true,
    parseDOM: [{ tag: "blockquote" }],
    toDOM() {
      return ["blockquote", { class: "blockquote" }, 0];
    },
  },
  // 解析到MDAST
  toMdast(prose, traverseChildren) {
    if (prose.type.name === id) return u(id, traverseChildren(prose));
  },
  // 从MDAST解析
  toProse(mdast, schema, traverseChildren) {
    if (mdast.type === id) return schema.node(id, {}, traverseChildren(mdast));
  },
};

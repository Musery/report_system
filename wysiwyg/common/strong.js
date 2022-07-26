import { u } from "unist-builder";
import { toggleMark, isMark } from "../util/command.js";
import { markInputRule } from "../util/inputrules.js";

const id = "strong";

export const strong = {
  id,
  // markdown 语法匹配
  inputrules: [
    markInputRule(/(?:__)([^_]+)(?:__)$/, id),
    markInputRule(/(?:\*\*)([^*]+)(?:\*\*)$/, id),
  ],
  key: {
    "Mod-b": toggleMark(id),
  },
  // 功能键
  button: [
    {
      type: "button",
      icon: "icon-bold",
      label: "bold",
      command: (view) => toggleMark(id),
      active: (view) => isMark(view.state, id),
    },
  ],
  mark: {
    parseDOM: [
      { tag: "b" },
      { tag: "strong" },
      { style: "font-style", getAttrs: (value) => value === "bold" },
    ],
    toDOM() {
      return ["strong", 0];
    },
  },
  toMdast(prose, child) {
    if (prose.type.name === id) return u(id, [child]);
  },
  // 从MDAST解析
  toProse(mdast, schema, traverseChildren) {
    if (mdast.type === id)
      return traverseChildren(mdast).map((child) => {
        return child.mark(schema.mark(id).addToSet(child.marks));
      });
  },
};

import { toggleMark, isMark } from "../util/command.js";
import { markInputRule } from "../util/inputrules.js";
import { u } from "unist-builder";

const id = "emphasis";

export const emphasis = {
  id,
  // markdown 语法匹配
  inputrules: [
    markInputRule(/(?:^|[^_])(_([^_]+)_)$/, id),
    markInputRule(/(?:^|[^*])(\*([^*]+)\*)$/, id),
  ],
  key: {
    "Mod-i": toggleMark(id),
  },
  // 功能键
  button: [
    {
      type: "button",
      icon: "icon-italic",
      label: "italic",
      command: (view) => toggleMark(id),
      active: (view) => isMark(view.state, id),
    },
  ],
  mark: {
    parseDOM: [
      { tag: "i" },
      { tag: "em" },
      { style: "font-style", getAttrs: (value) => value === "italic" },
    ],
    toDOM() {
      return ["em", 0];
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

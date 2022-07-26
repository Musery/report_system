import { toggleMark, isMark } from "../util/command.js";
import { markInputRule } from "../util/inputrules.js";
import { u } from "unist-builder";

const id = "delete";

export const _delete = {
  id,
  // markdown 语法匹配
  inputrules: [
    markInputRule(/(?:~~)([^~]+)(?:~~)$/, id),
    markInputRule(/(?:^|[^~])(~([^~]+)~)$/, id),
  ],
  // 快捷键
  key: {
    "Mod-x": toggleMark(id),
  },
  // 功能键
  button: [
    {
      type: "button",
      icon: "icon-strikethrough",
      label: "delete",
      command: () => toggleMark(id),
      active: (view) => isMark(view.state, id),
    },
  ],
  mark: {
    parseDOM: [{ tag: "del" }],
    toDOM() {
      return ["del", { class: "strike-through" }, 0];
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

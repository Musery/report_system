import { u } from "unist-builder";

import { toggleMark } from "../util/command.js";
import { markInputRule } from "../util/inputrules.js";

const id = "inlineCode";

export const inlineCode = {
  id,
  // markdown 语法匹配
  inputrules: [markInputRule(/(?:^|[^`])(`([^`]+)`)$/, id)],
  // 快捷键
  key: {
    "Mod-e": toggleMark(id),
  },
  mark: {
    parseDOM: [{ tag: "code" }],
    toDOM() {
      return ["code", { class: "code-inline" }, 0];
    },
  },
  toMdast(prose, child) {
    if (prose.type.name === id) return u(id, child.value);
  },
  // 从MDAST解析
  toProse(mdast, schema) {
    if (mdast.type === id) {
      return [schema.text(mdast.value).mark([schema.mark(id)])];
    }
  },
};

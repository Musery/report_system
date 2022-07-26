import { u } from "unist-builder";
import { InputRule } from "prosemirror-inputrules";

const id = "thematicBreak";

export const thematicBreak = {
  id,
  inputrules: [
    new InputRule(/^(?:---|___\s|\*\*\*\s)$/, (state, match, start, end) => {
      const { tr } = state;
      if (match[0]) {
        tr.replaceWith(start - 1, end, state.schema.nodes[id].create());
      }
      return tr;
    }),
  ],
  node: {
    group: "block",
    parseDOM: [{ tag: "hr" }],
    toDOM() {
      return ["hr", { class: "hr" }];
    },
  },
  toMdast(prose) {
    if (prose.type.name === id) return u(id);
  },
  // 从MDAST解析
  toProse(mdast, schema) {
    if (mdast.type === id) return schema.node(id);
  },
};

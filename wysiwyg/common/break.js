import { u } from "unist-builder";

const id = "break";

export const _break = {
  id,
  key: {
    "Shift-Enter": (state, dispatch, view) => {
      dispatch?.(
        state.tr
          .setMeta("break", true)
          .replaceSelectionWith(state.schema.nodes[id].create())
          .scrollIntoView()
      );
      return true;
    },
  },
  node: {
    inline: true,
    group: "inline",
    selectable: false,
    // 这里将原生br忽略. 只会识别带break样式标记编辑器的br
    parseDOM: [{ tag: "br.break" }, { tag: "br", ignore: true }],
    toDOM() {
      return ["br", { class: "break" }];
    },
  },
  // 解析到MDAST
  toMdast(prose) {
    if (prose.type.name === id) return u(id);
  },
  // 从MDAST解析
  toProse(mdast, schema) {
    if (mdast.type === id) return schema.node(id);
  },
};

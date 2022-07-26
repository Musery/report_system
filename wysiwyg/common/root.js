import { history, undo, redo } from "prosemirror-history";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { baseKeymap } from "prosemirror-commands";
import { u } from "unist-builder";

const mac =
  typeof navigator != "undefined" ? /Mac/.test(navigator.userAgent) : false;
const id = "root";

export const root = {
  id,
  top: true,
  key: mac
    ? {
        "Mod-z": undo,
        "Shift-Mod-z": redo,
        ...baseKeymap,
      }
    : {
        "Mod-z": undo,
        "Mod-y": redo,
        ...baseKeymap,
      },
  button: [
    {
      type: "button",
      icon: "icon-undo",
      label: "undo",
      command: () => undo,
      display: (view) => {
        return undo(view.state);
      },
    },
    {
      type: "button",
      icon: "icon-redo",
      label: "redo",
      command: () => redo,
      display: (view) => {
        return redo(view.state);
      },
    },
  ],
  plugins: [history(), dropCursor(), gapCursor()],
  node: {
    content: "block+",
  },
  toMdast(prose, traverseChildren) {
    if (prose.type.name === id) return u(id, traverseChildren(prose));
  },
  // 从MDAST解析
  toProse(mdast, schema, traverseChildren) {
    if (mdast.type === id) {
      const children = traverseChildren(mdast);
      if (children.length === 0) {
        // 保持至少1行内容
        children.push(schema.node("paragraph"));
      }
      return schema.node(id, {}, children);
    }
  },
};

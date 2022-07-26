import { u } from "unist-builder";

import { InputRule } from "prosemirror-inputrules";
import { toggleMark, isMark } from "../util/command.js";

const id = "link";

export const link = {
  id,
  // markdown 语法匹配
  inputrules: [
    new InputRule(
      /\[(?<text>.*?)]\((?<href>.*?)(?=“|\))"?(?<title>[^"]+)?"?\)/,
      (state, match, start, end) => {
        const [okay, text = "", href, title] = match;
        const { tr, schema } = state;
        if (okay) {
          const content = text || "link";
          tr.replaceWith(start, end, schema.text(content)).addMark(
            start,
            content.length + start,
            schema.marks[id].create({ title, href })
          );
        }
        return tr;
      }
    ),
  ],
  // 功能键
  button: [
    {
      type: "button",
      icon: "icon-link",
      label: "link",
      command: (view) => toggleMark(id, { href: "" }),
      active: (view) => isMark(view.state, id),
    },
  ],
  plugins: [],
  mark: {
    attrs: {
      href: { default: "" },
      title: { default: null },
    },
    inclusive: false,
    parseDOM: [
      {
        tag: "a[href]",
        getAttrs: (dom) => {
          if (!(dom instanceof HTMLElement)) {
            throw expectDomTypeError(dom);
          }
          return {
            href: dom.getAttribute("href"),
            title: dom.getAttribute("title"),
          };
        },
      },
    ],
    toDOM(mark) {
      let { href, title } = mark.attrs;
      return ["a", { href, title }, 0];
    },
  },
  toMdast(prose, child) {
    if (prose.type.name === id)
      return u(id, { url: prose.attrs.href }, [child]);
  },
  // 从MDAST解析
  toProse(mdast, schema, traverseChildren) {
    if (mdast.type === id)
      return traverseChildren(mdast).map((child) => {
        return child.mark(
          schema.mark(id, { href: mdast.url }).addToSet(child.marks)
        );
      });
  },
};

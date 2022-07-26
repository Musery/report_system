import { u } from "unist-builder";
import { wrappingInputRule } from "../util/inputrules.js";

const id = "list";

export const list = {
  id,
  inputrules: [
    wrappingInputRule(/^\s*([-+*])\s$/, id),
    wrappingInputRule(
      /^(\d+)\.\s$/,
      id,
      (match) => ({ start: Number(match[1]), ordered: true }),
      (match, node) =>
        node.childCount + node.attrs["start"] === Number(match[1])
    ),
  ],
  node: {
    group: "block",
    content: "listItem+",
    attrs: { start: { default: 1 }, ordered: { default: false } },
    parseDOM: [
      {
        tag: "ol",
        getAttrs: (dom) => {
          if (!(dom instanceof HTMLElement)) {
            throw expectDomTypeError(dom);
          }
          return {
            start: dom.hasAttribute("start")
              ? Number(dom.getAttribute("start"))
              : 1,
            ordered: true,
          };
        },
      },
      { tag: "ul" },
    ],
    toDOM(node) {
      return node.attrs.ordered
        ? ["ol", { class: "ordered-list", start: node.attrs.start }, 0]
        : ["ul", { class: "bullet-list" }, 0];
    },
  },
  toMdast(prose, traverseChildren) {
    if (prose.type.name === id)
      if (prose.attrs.ordered) {
        return u(
          id,
          { ordered: true, start: prose.attrs.order },
          traverseChildren(prose)
        );
      } else {
        return u(id, {}, traverseChildren(prose));
      }
  },
  // 从MDAST解析
  toProse(mdast, schema, traverseChildren) {
    if (mdast.type === id)
      return schema.node(
        id,
        { ordered: mdast.ordered, start: mdast.start },
        traverseChildren(mdast)
      );
  },
};

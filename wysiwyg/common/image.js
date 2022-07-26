import { InputRule } from "prosemirror-inputrules";
import { u } from "unist-builder";

const id = "image";

export const image = {
  id,
  // markdown 语法匹配
  inputrules: [
    new InputRule(
      /!\[(?<alt>.*?)]\((?<src>.*?)\s*(?="|\))"?(?<title>[^"]+)?"?\)/,
      (state, match, start, end) => {
        const [okay, alt, src = "", title] = match;
        const { tr } = state;
        if (okay) {
          tr.replaceWith(
            start,
            end,
            state.schema.nodes[id].create({ src, alt, title })
          );
        }

        return tr;
      }
    ),
  ],
  node: {
    inline: true,
    attrs: {
      src: {},
      alt: { default: null },
      title: { default: null },
    },
    group: "inline",
    draggable: true,
    parseDOM: [
      {
        tag: "img[src]",
        getAttrs: (dom) => {
          if (!(dom instanceof HTMLElement)) {
            throw expectDomTypeError(dom);
          }
          return {
            src: dom.getAttribute("src") || "",
            alt: dom.getAttribute("alt"),
            title: dom.getAttribute("title") || dom.getAttribute("alt"),
            width: dom.getAttribute("width"),
          };
        },
      },
    ],
    toDOM(node) {
      let { src, alt, title } = node.attrs;
      return ["img", { src, alt, title }];
    },
  },
  toMdast(prose) {
    if (prose.type.name === id)
      return u(id, {
        url: prose.attrs.src,
        alt: prose.attrs.alt,
        title: prose.attrs.title,
      });
  },
  // 从MDAST解析
  toProse(mdast, schema) {
    if (mdast.type === id)
      return schema.node(id, {
        src: mdast.url,
        alt: mdast.alt,
        title: mdast.title,
      });
  },
};

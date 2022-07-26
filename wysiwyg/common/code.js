import { textblockTypeInputRule } from "../util/inputrules.js";
import { Fragment } from "prosemirror-model";
import { u } from "unist-builder";

const id = "code";

export const code = {
  id,
  inputrules: [
    textblockTypeInputRule(
      /^(```|~~~)(?<language>[a-z]*)?[\s\n]$/,
      id,
      (match) => {
        const [ok1, ok2, language] = match;
        if (!ok1 && !ok2) return;
        return { language };
      }
    ),
  ],
  node: {
    content: "text*",
    marks: "",
    group: "block",
    code: true,
    attrs: {
      language: {
        default: "",
      },
    },
    defining: true,
    parseDOM: [
      {
        tag: "div.code",
        preserveWhitespace: "full",
        getAttrs: (dom) => {
          if (!(dom instanceof HTMLElement)) {
            throw expectDomTypeError(dom);
          }
          return { language: dom.querySelector("pre")?.dataset["language"] };
        },
        getContent: (dom, schema) => {
          if (!(dom instanceof HTMLElement)) {
            throw expectDomTypeError(dom);
          }
          const textNode = schema.text(
            dom.querySelector("pre")?.textContent ?? ""
          );
          return Fragment.from(textNode);
        },
      },
      {
        tag: "pre",
        preserveWhitespace: "full",
        getAttrs: (dom) => {
          if (!(dom instanceof HTMLElement)) {
            throw expectDomTypeError(dom);
          }
          return { language: dom.dataset["language"] };
        },
      },
    ],
    toDOM(node) {
      return [
        "div",
        {
          class: "code",
        },
        [
          "pre",
          {
            "data-language": node.attrs["language"],
          },
          ["code", { spellCheck: "false" }, 0],
        ],
      ];
    },
  },
  // 解析到MDAST
  toMdast(prose) {
    if (prose.type.name === id)
      return u(id, { lang: prose.attrs.language }, prose.textContent);
  },
  // 从MDAST解析
  toProse(mdast, schema) {
    if (mdast.type === id)
      return mdast.value
        ? schema.node(id, { lang: mdast.lang }, schema.text(mdast.value))
        : schema.node(id, { lang: mdast.lang });
  },
};

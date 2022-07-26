import { u } from "unist-builder";
import { InputRule } from "prosemirror-inputrules";
import { wrappingInputRule } from "../util/inputrules.js";
import { buildElement } from "../util/element.js";

const id = "footnote";

export const footnote = [
  {
    id: `${id}Definition`,
    inputrules: [
      wrappingInputRule(
        /(?:\[\^)([^:]+)(?::)$/,
        `${id}Definition`,
        (match) => {
          const label = match[1] ?? id;
          return {
            label,
          };
        },
        () => false
      ),
    ],
    node: {
      group: "block",
      content: "block+",
      defining: true,
      attrs: {
        label: {
          default: "",
        },
      },
      parseDOM: [
        {
          tag: `div[data-type="${id}Definition"]`,
          getAttrs: (dom) => {
            if (!(dom instanceof HTMLElement)) {
              throw expectDomTypeError(dom);
            }
            return {
              label: dom.dataset["label"],
            };
          },
          contentElement: "dd",
        },
      ],
      toDOM(node) {
        const label = node.attrs["label"];
        const dt = buildElement("dt", [], { innerText: `[${label}]:` });

        const a = buildElement("a", [], {
          href: `#${getFootnoteRefId(label)}`,
          contentEditable: "false",
          innerText: "↩",
        });
        return [
          "div",
          {
            class: "footnote-definition",
            "data-label": label,
            "data-type": `${id}Definition`,
            id: getFootnoteDefId(label),
          },
          ["div", { class: "footnote-definition_content" }, dt, ["dd", 0]],
          ["div", { class: "footnote-definition_anchor" }, a],
        ];
      },
    },
    toMdast(prose, traverseChildren) {
      if (prose.type.name === `${id}Definition`)
        return u(
          `${id}Definition`,
          {
            identifier: prose.attrs.label,
            label: prose.attrs.label,
          },
          traverseChildren(prose)
        );
    },
    // 从MDAST解析
    toProse(mdast, schema, traverseChildren) {
      if (mdast.type === `${id}Definition`)
        return schema.node(
          `${id}Definition`,
          { label: mdast.label },
          traverseChildren(mdast)
        );
    },
  },
  {
    id: `${id}Reference`,
    inputrules: [
      new InputRule(/(?:\[\^)([^\]]+)(?:\])$/, (state, match, start, end) => {
        const $start = state.doc.resolve(start);
        const index = $start.index();
        const $end = state.doc.resolve(end);
        if (
          !$start.parent.canReplaceWith(
            index,
            $end.index(),
            state.schema.nodes[`${id}Reference`]
          )
        ) {
          return null;
        }
        const label = match[1];
        return state.tr.replaceRangeWith(
          start,
          end,
          state.schema.nodes[`${id}Reference`].create({
            label,
          })
        );
      }),
    ],
    node: {
      group: "inline",
      inline: true,
      atom: true,
      attrs: {
        label: {
          default: "",
        },
      },
      parseDOM: [
        {
          tag: `sup[data-type="${id}Reference"]`,
          getAttrs: (dom) => {
            if (!(dom instanceof HTMLElement)) {
              throw expectDomTypeError(dom);
            }
            return {
              label: dom.dataset["label"],
            };
          },
        },
      ],
      toDOM(node) {
        const label = node.attrs["label"];
        const a = buildElement("a", [], {
          href: `#${getFootnoteDefId(label)}`,
          innerText: `[${label}]`,
        });
        a.onclick = () => {
          window.location.href = href;
        };
        return [
          "sup",
          {
            "data-label": label,
            "data-type": `${id}Reference`,
            id: getFootnoteRefId(label),
          },
          a,
        ];
      },
    },
    toMdast(prose) {
      if (prose.type.name === `${id}Reference`)
        return u(`${id}Reference`, {
          identifier: prose.attrs.label,
          label: prose.attrs.label,
        });
    },
    // 从MDAST解析
    toProse(mdast, schema) {
      if (mdast.type === `${id}Reference`)
        return schema.node(`${id}Reference`, { label: mdast.label });
    },
  },
];

const getFootnoteRefId = (label) => `footnote-ref-${label}`;
const getFootnoteDefId = (label) => `footnote-def-${label}`;

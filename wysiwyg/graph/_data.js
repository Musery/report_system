import { u } from "unist-builder";
import { InputRule } from "prosemirror-inputrules";
import { Plugin } from "prosemirror-state";
import { buildElement, buildAiSQLEditor } from "../util/element.js";

const id = "_data";

export const _data = {
  id,
  // markdown 语法匹配
  plugins: [buildDataView()],
  inputrules: [
    new InputRule(
      /!\[_data]\((?<aisql>.*?)\s*(?="|\))"?(?<title>[^"]+)?"?\)/,
      (state, match, start, end) => {
        const [okay, aisql = "", title] = match;
        const { tr } = state;
        if (okay) {
          tr.replaceWith(
            start,
            end,
            state.schema.nodes[id].create({ aisql, type: id, title })
          );
        }

        return tr;
      }
    ),
  ],
  button: [
    {
      type: "button",
      icon: "icon-icon_huabanfuben",
      label: "_data",
      command: (view) => (state, dispatch, view) => {
        const { tr } = state;
        const node = state.schema.nodes[id].create({ aisql: "" });
        dispatch(tr.replaceSelectionWith(node));
        return true;
      },
    },
  ],
  node: {
    inline: true,
    draggable: true,
    attrs: {
      aisql: { default: "" },
      type: { default: id },
      title: { default: null },
    },
    group: "inline",
    toDOM(node) {
      return ["code"];
    },
  },
  toMdast(prose) {
    if (prose.type.name === id)
      return u("image", {
        url: prose.attrs.aisql,
        alt: prose.attrs.type,
        title: prose.attrs.title,
      });
  },
  // 从MDAST解析
  toProse(mdast, schema) {
    if (mdast.type === "image" && mdast.alt === id)
      return schema.node(id, {
        aisql: mdast.url,
        type: mdast.alt,
        title: mdast.title,
      });
  },
};

export function buildDataView() {
  return new Plugin({
    props: {
      nodeViews: {
        _data: (node, view, getPos) => {
          const dom = buildElement("code", ["code-inline"]);
          const editor = buildAiSQLEditor(
            "_data",
            node.attrs.aisql,
            view,
            (aisql) => {
              if (aisql !== node.attrs.aisql) {
                // 更新节点
                const { tr, schema } = view.state;
                view.dispatch(
                  tr.setNodeMarkup(getPos(), schema.nodes[id], {
                    aisql,
                    type: node.attrs.type,
                    title: node.attrs.title,
                  })
                );
              }
            }
          );

          const render = () => {
            dom.innerText = "LOADING...";

            view.state.schema.wsclient.send_cb(
              {
                command: "AISQL_DATA",
                data: { aisql: node.attrs.aisql },
              },
              ({ status, data, message }) => {
                try {
                  if (status === 200) {
                    dom.innerText = data;
                    return;
                  }
                } catch (err) {}
                dom.innerText = "error";
              }
            );
          };

          render();
          return {
            dom,
            update: (n) => {
              if (n.hasMarkup(view.state.schema.nodes[id])) {
                node = n;
                render();
                return true;
              }
              return false;
            },
            selectNode: () => {
              dom.classList.add("ProseMirror-selectednode");
              editor.show();
            },
            deselectNode: () => {
              dom.classList.remove("ProseMirror-selectednode");
              editor.hidden();
            },
            stopEvent: (event) => false,
            ignoreMutation: () => true,
            destroy: () => {
              editor.remove();
              dom.remove();
            },
          };
        },
      },
    },
  });
}

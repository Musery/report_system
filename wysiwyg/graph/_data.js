import { u } from "unist-builder";
import { InputRule } from "prosemirror-inputrules";
import { Plugin } from "prosemirror-state";
import { format } from "sql-formatter";
import { Parser, util } from "@florajs/sql-parser";
import { buildElement, buildOuterEditor } from "../util/element.js";

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
            state.schema.nodes[id].create({ aisql, type: id })
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
        const node = state.schema.nodes[id].create({
          aisql: `SELECT COUNT(*) AS "eventCount" FROM "event"`,
        });
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
      });
  },
  // 从MDAST解析
  toProse(mdast, schema) {
    if (mdast.type === "image" && mdast.alt === id)
      return schema.node(id, {
        aisql: mdast.url,
        type: mdast.alt,
      });
  },
};

export function buildDataView() {
  return new Plugin({
    props: {
      nodeViews: {
        _data: (node, view, getPos) => {
          const dom = buildElement("code", ["code-inline"]);
          const editor = buildOuterEditor(
            "_data",
            format(node.attrs.aisql),
            view,
            (content) => {
              try {
                const aisql = util.astToSQL(new Parser().parse(content));
                if (aisql !== node.attrs.aisql) {
                  // 更新节点
                  const { tr, schema } = view.state;
                  view.dispatch(
                    tr.setNodeMarkup(getPos(), schema.nodes[id], {
                      aisql,
                      type: node.attrs.type,
                    })
                  );
                }
                return true;
              } catch (err) {
                console.log(err);
                return false;
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
              if (view.editable) {
                editor.show();
              }
            },
            deselectNode: () => {
              dom.classList.remove("ProseMirror-selectednode");
              if (view.editable) {
                editor.hidden();
              }
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

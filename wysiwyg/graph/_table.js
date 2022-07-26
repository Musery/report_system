import { u } from "unist-builder";
import { Plugin } from "prosemirror-state";
import { format } from "sql-formatter";
import { Parser, util } from "@florajs/sql-parser";
import { buildOuterEditor, buildElement } from "../util/element.js";

const id = "_table";

export const _table = {
  id,
  type: "code",
  plugins: [buildTableView()],
  node: {
    content: "text*",
    marks: "",
    group: "block",
    code: true,
    isolating: true,
    atom: true,
    defining: true,
    attrs: {},
    parseDOM: [],
    toDOM() {
      return ["div"];
    },
  },
  button: [
    {
      type: "button",
      icon: "icon-icon-muban",
      label: "_table",
      command: (view) => (state, dispatch, view) => {
        const { tr } = state;
        const node = state.schema.nodes[id].create(
          {},
          state.schema.text(
            `SELECT formatDateTime(toStartOfInterval("collectorReceiptTime", INTERVAL '1' HOUR), '%Y-%m-%d %H') AS "时间", count(1) AS "eventCount" FROM "event" GROUP BY "时间" ORDER BY "时间" ASC LIMIT 0,10`
          )
        );
        dispatch(tr.replaceSelectionWith(node));
        return true;
      },
    },
  ],
  // 解析到MDAST
  toMdast(prose) {
    if (prose.type.name === id)
      return u("code", { lang: "_table" }, prose.textContent);
  },
  // 从MDAST解析
  toProse(mdast, schema) {
    if (mdast.type === "code" && mdast.lang === id)
      return mdast.value
        ? schema.node(id, {}, schema.text(mdast.value))
        : schema.node(id);
  },
};
export function buildTableView() {
  return new Plugin({
    props: {
      nodeViews: {
        _table: (node, view, getPos) => {
          const dom = buildElement("div", ["tableWrapper"]);
          const loading = buildElement("div", ["loading", "hide"]);
          loading.appendChild(
            buildElement("img", [], { src: "./style/loading.gif" })
          );
          dom.appendChild(loading);
          const error = buildElement("div", ["loading", "hide"]);
          error.appendChild(
            buildElement("i", ["icon", "iconfont", "icon-chat-error"], {
              style: "font-size: 4em",
            })
          );
          dom.appendChild(error);
          const table = buildElement("table", ["hide"]);
          dom.appendChild(table);

          const editor = buildOuterEditor(
            "_table",
            format(node.textContent),
            view,
            (content) => {
              try {
                const aisql = util.astToSQL(new Parser().parse(content));
                if (aisql !== node.textContent) {
                  const { tr, schema } = view.state;
                  view.dispatch(
                    tr.replaceWith(
                      getPos() + 1,
                      getPos() + 1 + node.textContent.length,
                      [schema.text(aisql)]
                    )
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
            while (table.firstChild) {
              table.removeChild(table.firstChild);
            }
            table.classList.add("hide");
            error.classList.add("hide");
            loading.classList.remove("hide");
            view.state.schema.wsclient.send_cb(
              {
                command: "AISQL_TABLE",
                data: {
                  aisql: node.textContent,
                },
              },
              ({ status, data }) => {
                try {
                  const tbody = buildElement("tbody");
                  let th = true;
                  for (let columns of data) {
                    const tr = buildElement("tr");
                    for (let column of columns) {
                      const t = buildElement(th ? "th" : "td");
                      const p = buildElement("p", ["paragraph"], {
                        // todo 增加 en zh
                        innerText: column,
                      });
                      t.appendChild(p);
                      tr.appendChild(t);
                    }
                    tbody.appendChild(tr);
                    th = false;
                  }
                  table.appendChild(tbody);
                  loading.classList.add("hide");
                  table.classList.remove("hide");
                } catch (err) {
                  loading.classList.add("hide");
                  error.classList.remove("hide");
                }
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

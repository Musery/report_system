import { Plugin } from "prosemirror-state";
import { buildAiSQLEditor, buildElement } from "../util/element.js";
import { u } from "unist-builder";
import * as echarts from "echarts";

/** image type 变种 */
const id = "_echarts";

const supports = new Set(["_pie", "_line", "_bar", "_scatter", "_radar"]);

export const _echarts = {
  id,
  type: "image",
  plugins: [buildEchartsView()],
  node: {
    inline: true,
    attrs: {
      aisql: { default: "" },
      type: { default: "" },
      style: {
        default: `{"widthPER": 0.4, "height": 400}`,
      },
    },
    group: "inline",
    draggable: true,
    allowGapCursor: false,
    toDOM(node) {
      return ["img"];
    },
  },
  button: [
    {
      icon: "icon-com-bingzhuangtu-sur",
      label: "_pie",
      aisql: "",
    },
    {
      icon: "icon-icon-chart",
      label: "_line",
      aisql: "",
    },
    {
      icon: "icon-icon-chart2",
      label: "_bar",
      aisql: "",
    },
    {
      icon: "icon-com-scatterPlot-sur",
      label: "_scatter",
      aisql: "",
    },
    {
      icon: "icon-icon-chart-sur",
      label: "_radar",
      aisql: "",
    },
  ].map(({ icon, label, aisql }) => {
    return {
      type: "button",
      icon,
      label,
      command: (view) => (state, dispatch, view) => {
        const { tr } = state;
        const node = state.schema.nodes[id].create({ aisql });
        dispatch(tr.replaceSelectionWith(node));
        return true;
      },
    };
  }),
  // 解析到MDAST
  toMdast(prose) {
    if (prose.type.name === id)
      return u("image", {
        url: prose.attrs.aisql,
        alt: prose.attrs.type,
        title: prose.attrs.style,
      });
  },
  // 从MDAST解析
  toProse(mdast, schema) {
    if (mdast.type === "image" && supports.has(mdast.alt))
      return schema.node(id, {
        aisql: mdast.url,
        type: mdast.alt,
        style: mdast.title,
      });
  },
};

export function buildEchartsView() {
  return new Plugin({
    props: {
      nodeViews: {
        _echarts: (node, view, getPos) => {
          const style = JSON.parse(node.attrs.style);
          // 解析高宽度
          let width = document.body.clientWidth * (style.widthPER || 0.4);
          let height = style.height || 400;
          const dom = buildElement("div", ["echarts"], {
            style: `width:${width}px;height:${height}px`,
          });
          const loading = buildElement("div", ["loading", "hide"]);
          loading.appendChild(
            buildElement("img", [], { src: "./style/loading.gif" })
          );
          dom.appendChild(loading);
          const error = buildElement("div", ["loading", "hide"]);
          error.appendChild(
            buildElement("i", ["icon", "iconfont", "icon-chat-error"], {
              style: "font-size:4em",
            })
          );
          dom.appendChild(error);
          // 设置异动框
          const move = buildElement("i", ["hide", "iconfont", "icon-zhijiao"], {
            style:
              " bottom: 5px;right: 3px;position: absolute;cursor: nwse-resize;",
          });
          let startX = 0;
          let startY = 0;
          let draging = false;
          // 监听拖动
          move.addEventListener("mousedown", (event) => {
            draging = true;
            startX = event.screenX;
            startY = event.screenY;
          });
          move.addEventListener("mousemove", (event) => {
            if (draging) {
              width += event.screenX - startX;
              height += event.screenY - startY;
              dom.setAttribute("style", `width:${width}px;height:${height}px`);
              startX = event.screenX;
              startY = event.screenY;
            }
          });
          move.addEventListener("mouseup", (event) => {
            draging = false;
            startX = startY = 0;
            // 更新当前node节点style信息
            const { tr, schema } = view.state;
            view.dispatch(
              tr.setNodeMarkup(getPos(), schema.nodes[id], {
                aisql: node.attrs.aisql,
                type: node.attrs.type,
                style: `{"widthPER": ${
                  width / document.body.clientWidth
                }, "height": ${height}}`,
              })
            );
          });
          dom.appendChild(move);
          // echarts 初始化位置
          const graph = buildElement("div", ["loading", "hide"]);
          dom.appendChild(graph);

          const editor = buildAiSQLEditor(
            "_echarts",
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
                    style: node.attrs.style,
                  })
                );
              }
            }
          );

          const render = () => {
            error.classList.add("hide");
            graph.classList.add("hide");
            loading.classList.remove("hide");
            try {
              view.state.schema.wsclient.send_cb(
                {
                  command: "AISQL_CHART",
                  data: {
                    type: node.attrs.type,
                    aisql: node.attrs.aisql,
                  },
                },
                ({ data }) => {
                  // 在graph 重置之前 删除所有其他子节点
                  while (graph.firstchild) {
                    graph.remove(graph.firstchild);
                  }
                  echarts
                    .init(graph, null, { renderer: "svg" })
                    .setOption(data);
                  loading.classList.add("hide");
                  graph.classList.remove("hide");
                }
              );
            } catch (err) {
              loading.classList.add("hide");
              error.classList.remove("hide");
            }
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
              move.classList.remove("hide");
              editor.show();
            },
            deselectNode: () => {
              dom.classList.remove("ProseMirror-selectednode");
              move.classList.add("hide");
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

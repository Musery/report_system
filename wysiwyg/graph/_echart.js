import { Plugin } from "prosemirror-state";
import { buildOuterEditor, buildElement } from "../util/element.js";
import { Parser, util } from "@florajs/sql-parser";
import { u } from "unist-builder";
import { format } from "sql-formatter";
import * as echarts from "echarts";

/** image type 变种 */
const id = "_echarts";

const supports = new Set(["pie", "line", "bar", "scatter", "radar"]);

export const _echarts = {
  id,
  type: "image",
  plugins: [buildEchartsView()],
  node: {
    inline: true,
    attrs: {
      aisql: { default: "" },
      type: { default: "" },
      option: {
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
      label: "pie",
      aisql: `SELECT formatDateTime(toStartOfInterval("collectorReceiptTime", INTERVAL '1' HOUR), '%Y-%m-%d %H') AS "时间", count(1) AS "eventCount" FROM "event" GROUP BY "时间" ORDER BY "时间" ASC LIMIT 0,10`,
    },
    {
      icon: "icon-icon-chart",
      label: "line",
      aisql: `SELECT formatDateTime(toStartOfInterval("collectorReceiptTime", INTERVAL '1' HOUR), '%Y-%m-%d %H') AS "时间", count(1) AS "eventCount" FROM "event" GROUP BY "时间" ORDER BY "时间" ASC LIMIT 0,10`,
    },
    {
      icon: "icon-icon-chart2",
      label: "bar",
      aisql: `SELECT formatDateTime(toStartOfInterval("collectorReceiptTime", INTERVAL '1' HOUR), '%Y-%m-%d %H') AS "时间", count(1) AS "eventCount" FROM "event" GROUP BY "时间" ORDER BY "时间" ASC LIMIT 0,10`,
    },
    {
      icon: "icon-com-scatterPlot-sur",
      label: "scatter",
      aisql: `SELECT formatDateTime(toStartOfInterval("collectorReceiptTime", INTERVAL '1' HOUR), '%H') AS "时间", count(1) AS "eventCount" FROM "event" GROUP BY "时间" ORDER BY "时间" ASC LIMIT 0,10`,
    },
    {
      icon: "icon-icon-chart-sur",
      label: "radar",
      aisql: `SELECT formatDateTime(toStartOfInterval("collectorReceiptTime", INTERVAL '1' HOUR), '%Y-%m-%d %H') AS "时间", count(case when "eventType" = '0' THEN 1 END ) AS "未解析事件",count(case when "eventType" = '1' THEN 1 END ) AS "基本事件", count(case when "eventType" = '2' THEN 1 END ) AS "聚合事件",count(case when "eventType" = '3' THEN 1 END ) AS "关联事件" FROM "event"  GROUP BY "时间" ORDER BY "时间" ASC LIMIT 0,10`,
    },
  ].map(({ icon, label, aisql }) => {
    return {
      type: "button",
      icon,
      label,
      command: (view) => (state, dispatch, view) => {
        const { tr } = state;
        const node = state.schema.nodes[id].create({ type: label, aisql });
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
        title: prose.attrs.option,
      });
  },
  // 从MDAST解析
  toProse(mdast, schema) {
    if (mdast.type === "image" && supports.has(mdast.alt)) {
      if (mdast.title) {
        return schema.node(id, {
          aisql: mdast.url,
          type: mdast.alt,
          option: mdast.title,
        });
      } else {
        return schema.node(id, {
          aisql: mdast.url,
          type: mdast.alt,
        });
      }
    }
  },
};

export function buildEchartsView() {
  return new Plugin({
    props: {
      nodeViews: {
        _echarts: (node, view, getPos) => {
          const option = JSON.parse(node.attrs.option);
          // 解析高宽度
          let width = document.body.clientWidth * (option.widthPER || 0.4);
          let height = option.height || 400;
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
              " bottom: 5px;right: 3px;position: absolute;cursor: nwse-resize; z-index:100",
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
            // 更新当前node节点option信息
            const { tr, schema } = view.state;
            // 更新样式配置
            option.widthPER = width / document.body.clientWidth;
            option.height = height;
            view.dispatch(
              tr.setNodeMarkup(getPos(), schema.nodes[id], {
                aisql: node.attrs.aisql,
                type: node.attrs.type,
                option: JSON.stringify(option),
              })
            );
          });
          dom.appendChild(move);
          // echarts 初始化位置
          const graph = buildElement("div", ["loading", "hide"]);
          dom.appendChild(graph);

          const editor = buildOuterEditor(
            "_echarts",
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
                      option: node.attrs.option,
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

          const optionEditor = buildOuterEditor(
            "_echarts_option",
            JSON.stringify(option, null, 2),
            view,
            (content) => {
              // 去空格化
              try {
                const option = JSON.stringify(JSON.parse(content));
                if (option !== node.attrs.option) {
                  // 更新节点
                  const { tr, schema } = view.state;
                  view.dispatch(
                    tr.setNodeMarkup(getPos(), schema.nodes[id], {
                      aisql: node.attrs.aisql,
                      type: node.attrs.type,
                      option,
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
                    option,
                  },
                },
                ({ data }) => {
                  // 在graph 重置之前 删除所有其他子节点
                  while (graph.firstChild) {
                    graph.removeChild(graph.firstChild);
                  }
                  data.toolbox = {
                    show: view.editable,
                    feature: {
                      myEditOption: {
                        show: true,
                        icon: "path://M907.392 114.56a32.768 32.768 0 0 0-15.872-2.24H768.256a32 32 0 0 0 0 64h47.616L639.744 352.448 408.896 121.536A33.472 33.472 0 0 0 383.808 112a33.024 33.024 0 0 0-24.704 9.472l-253.696 253.76a33.152 33.152 0 0 0 46.848 46.848l231.232-231.296 231.168 231.168c6.848 6.912 16 9.92 25.088 9.536a33.024 33.024 0 0 0 25.088-9.536l199.424-199.424v49.728a32 32 0 0 0 64 0v-128a31.808 31.808 0 0 0-20.864-29.696zM128.256 656.256a32 32 0 0 0-32 32v192a32 32 0 1 0 64 0v-192a32 32 0 0 0-32-32z m256-224a32 32 0 0 0-32 32v416a32 32 0 0 0 64 0v-416a32 32 0 0 0-32-32z m519.872 187.648h-1.92c-32.128 0-58.24-27.648-58.24-61.632 0-11.264 5.056-23.488 5.056-23.616a28.8 28.8 0 0 0-8.896-33.728l-0.576-0.384-56-33.024-0.576-0.256a28.48 28.48 0 0 0-31.744 6.72c-6.848 7.488-28.416 26.88-45.888 26.88-17.472 0-39.232-19.776-46.08-27.392a28.672 28.672 0 0 0-21.056-9.216 25.472 25.472 0 0 0-10.624 2.24l-0.64 0.256-57.92 33.792-0.576 0.384a28.864 28.864 0 0 0-8.96 33.728c0 0.128 5.056 12.352 5.056 23.616 0 33.984-26.112 61.632-58.24 61.632h-1.92c-9.344-0.128-17.024 8.512-19.456 22.144-0.192 1.024-4.672 26.496-4.672 46.528s4.48 45.376 4.672 46.528c2.432 13.376 9.856 22.016 19.072 22.016h2.304c32.128 0 58.24 27.648 58.24 61.76 0 11.136-5.056 23.488-5.056 23.488a28.864 28.864 0 0 0 8.896 33.728l0.512 0.384 54.976 32.64 0.576 0.256a28.352 28.352 0 0 0 31.808-7.104c6.464-7.36 28.864-28.48 46.848-28.48s40.128 20.992 47.104 29.12a27.84 27.84 0 0 0 31.744 7.232l0.64-0.256 56.896-33.344 0.64-0.384a28.992 28.992 0 0 0 8.896-33.728s-5.056-12.352-5.056-23.488c0-34.112 26.112-61.76 58.24-61.76h1.92c9.344 0.256 17.024-8.512 19.456-22.016 0.192-1.152 4.672-26.496 4.672-46.528s-4.48-45.504-4.672-46.528c-2.432-13.76-10.112-22.336-19.456-22.208zM861.312 721.6c-36.16 1.984-65.088 33.984-65.088 73.024 0 12.992 4.736 25.472 5.76 28.032L758.848 848h-0.128c-0.64 0-1.216-0.128-1.344-0.384a121.088 121.088 0 0 0-16.064-15.104c-13.44-10.624-26.176-16-38.016-16-11.712 0-24.384 5.376-37.76 15.744-8.96 6.976-15.168 14.016-15.936 14.848a3.392 3.392 0 0 1-1.344 0.384h-0.128l-41.664-24.768c1.088-2.624 5.824-15.104 5.824-28.096 0-38.976-28.864-70.976-65.088-73.024a225.152 225.152 0 0 1-3.392-33.28c0-12.864 2.816-30.016 3.328-33.152 36.224-1.984 65.152-33.984 65.152-73.024 0-12.992-4.736-25.344-5.76-28.032l44.032-25.728h0.128c0.768 0 1.408 0.256 1.6 0.512 0.768 0.768 6.912 7.488 15.872 14.272 13.12 9.984 25.6 15.104 37.056 15.104 11.328 0 23.68-4.992 36.8-14.848 8.896-6.656 14.976-13.248 15.744-14.016a3.84 3.84 0 0 1 1.6-0.384h0.128l42.496 25.152c-1.024 2.496-5.76 14.976-5.76 28.032 0 38.976 28.864 70.976 65.088 73.024 0.576 3.136 3.392 20.224 3.392 33.152 0 12.992-2.816 30.272-3.392 33.216z m-157.056-97.728a63.808 63.808 0 0 0-63.232 64.384c0 35.648 28.288 64.384 63.232 64.384s63.232-28.736 63.232-64.384a63.808 63.808 0 0 0-63.232-64.384z",
                        onclick: function () {
                          if (optionEditor.isShow) {
                            optionEditor.hidden();
                          } else {
                            optionEditor.show();
                          }
                        },
                      },
                    },
                  };
                  echarts
                    .init(graph, null, {
                      renderer: "svg",
                      width,
                      height,
                    })
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
              if (view.editable) {
                move.classList.remove("hide");
                editor.show();
              }
            },
            deselectNode: () => {
              dom.classList.remove("ProseMirror-selectednode");
              if (view.editable) {
                move.classList.add("hide");
                editor.hidden();
              }
            },
            stopEvent: (event) => false,
            ignoreMutation: () => true,
            destroy: () => {
              optionEditor.remove();
              editor.remove();
              dom.remove();
            },
          };
        },
      },
    },
  });
}

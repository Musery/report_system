import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { inputRules } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";

import { nanoid } from "nanoid";
import { gfm } from "micromark-extension-gfm";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { toMarkdown } from "mdast-util-to-markdown";
import { gfmToMarkdown } from "mdast-util-gfm";

import toastr from "toastr";

import * as menu from "./util/menu.js";
import * as tooltip from "./util/tooltip.js";
import { i18next } from "./util/i18n";

export const build = () => {
  return {
    nodes: {},
    marks: {},
    plugins: [],
    toMdast: [],
    toProse: [],
    button: [[]],
    topNode: "doc",
    sup(supports) {
      this.button.push([]);
      for (let spec of supports) {
        if (spec.top) {
          this.topNode = spec.id;
        }
        if (spec.node) {
          this.nodes[spec.id] = spec.node;
          if (spec.button) {
            this.button[this.button.length - 1].push(...spec.button);
          }
        }
        if (spec.mark) {
          this.marks[spec.id] = spec.mark;
          if (spec.button) {
            this.button[0].push(...spec.button);
          }
        }
        if (spec.toMdast) {
          this.toMdast.unshift(spec.toMdast);
        }
        if (spec.toProse) {
          this.toProse.unshift(spec.toProse);
        }
        if (spec.inputrules) {
          this.plugins.unshift(inputRules({ rules: spec.inputrules }));
        }
        if (spec.plugins) {
          this.plugins.unshift(...spec.plugins);
        }
        if (spec.key) {
          this.plugins.push(keymap(spec.key));
        }
      }
      return this;
    },
    complete(options) {
      const {
        editable = true,
        place = "#editor",
        wss = "wss://localhost:4399",
        template = "default",
        time = 20000, // 自动保存时间
      } = options;
      const plugins = [...this.plugins];
      plugins.unshift(menu.build(editable, this.button));
      plugins.unshift(tooltip.build(this.button[0]));
      const schema = new Schema({
        nodes: this.nodes,
        marks: this.marks,
        topNode: this.topNode,
      });
      schema.parse2Mdast = (prose) => {
        // 子节点遍历
        const traverseChildren = (prose) => {
          const children = [];
          if (prose.content.childCount > 0) {
            prose.content.forEach((node) => {
              let result = traverse(node);
              if (result) {
                if (node.marks.length > 0) {
                  // 进行内联处理
                  node.marks.forEach((mark) => {
                    result = traverse(mark, result);
                  });
                }
                children.push(result);
              }
            });
          }
          return children;
        };
        // 全处理链遍历
        const traverse = (prose, child) => {
          for (let handler of this.toMdast) {
            const result = handler(prose, child ? child : traverseChildren);
            if (result) {
              return result;
            }
          }
          return;
        };
        return toMarkdown(traverse(prose), {
          extensions: [gfmToMarkdown()],
        });
      };
      schema.parse2Prose = (markdown) => {
        // 子节点遍历
        const traverseChildren = (mdast) => {
          const children = [];
          for (let child of mdast.children) {
            const result = traverse(child);
            if (result) {
              if (Array.isArray(result)) {
                children.push(...result);
              } else {
                children.push(result);
              }
            }
          }
          return children;
        };
        // 全处理链遍历
        const traverse = (mdast) => {
          for (let handler of this.toProse) {
            const result = handler(mdast, schema, traverseChildren);
            if (result) {
              return result;
            }
          }
          return;
        };
        return traverse(
          fromMarkdown(markdown, {
            extensions: [gfm()],
            mdastExtensions: [gfmFromMarkdown()],
          })
        );
      };
      schema.root = document.querySelector(place);
      initWebSocket(wss, 0, (ws, init) => {
        schema.wsclient = ws;
        // 第一次
        if (init === 1) {
          schema.wsclient.send_cb(
            { command: "GET_MDREPORT", data: { name: template } },
            ({ data }) => {
              const view = new EditorView(schema.root, {
                state: EditorState.create({
                  schema,
                  doc: schema.parse2Prose(data),
                  plugins,
                }),
                editable: () => editable,
              });
              if (editable) {
                // 设置自动保存程序
                setInterval(function () {
                  schema.wsclient.send_cb(
                    {
                      command: "POST_MDREPORT",
                      data: {
                        name: template,
                        content: schema.parse2Mdast(view.state.doc),
                      },
                    },
                    () => {
                      toastr.success(i18next.t("_timing_save_success"));
                    },
                    2000,
                    () => {
                      toastr.error(i18next.t("_timing_save_fail"));
                    }
                  );
                }, time);
              }
            }
          );
        } else {
          toastr.success(i18next.t("_ws_reconnection"));
        }
      });
    },
  };
};

/**
 *
 * @param {*} wss 连接地址
 * @param {*} init 连接成功次数
 * @param {*} succ 成功回调
 */
const initWebSocket = (wss, init, succ) => {
  const wsclient = new WebSocket(wss);
  wsclient.cbmap = new Map();
  // 发送且配合onmessage进行回调
  wsclient.send_cb = function (
    { command, data },
    callback,
    timeout,
    timeouthandler
  ) {
    const cbid = nanoid(10);
    const cbmap = this.cbmap;
    cbmap.set(cbid, callback);
    this.send(JSON.stringify({ command, cbid, data }));
    if (timeout) {
      // 设置超时处理
      setTimeout(function () {
        const callback = cbmap.get(cbid);
        if (callback) {
          // 超时处理( 删除回调方法执行超时处理程序)
          this.cbmap.delete(cbid);
          if (timeouthandler) {
            timeouthandler();
          }
        }
      }, timeout);
    }
  };
  wsclient.onmessage = function (event) {
    console.log("GET DATA WITHOUT CALLBACK: %s", event.data);
    const data = JSON.parse(event.data);
    if (data.cbid) {
      const callback = this.cbmap.get(data.cbid);
      if (callback) {
        // 成功回调 ( 删除并执行回调方法 )
        this.cbmap.delete(data.cbid);
        callback(data);
        return;
      }
    }
  };
  wsclient.onopen = function open() {
    if (succ) {
      succ(this, ++init);
    }
  };
  // 断开后进行自动重连
  wsclient.onclose = function (event) {
    toastr.error(i18next.t("_ws_close"));
    // 进行5秒一次重连
    setTimeout(function () {
      initWebSocket(wss, init, succ);
    }, 5000);
  };
};

import { i18next } from "./i18n.js";
import * as CodeMirror from "codemirror";
import { sql } from "@codemirror/lang-sql";
import { json } from "@codemirror/lang-json";
import * as CodeMirrorState from "@codemirror/state";
import toastr from "toastr";

export function buildElement(el, styles, attrs) {
  const ele = document.createElement(el);
  if (styles) {
    ele.classList.add(...styles);
  }
  if (attrs) {
    for (let attr in attrs) {
      if (attr === "innerText") {
        ele.innerText = attrs[attr];
      } else {
        ele.setAttribute(attr, attrs[attr]);
      }
    }
  }
  return ele;
}

export const buildTooltip = (config, view) => {
  const tooltip = buildElement("div", ["tooltip", "hide"]);
  config.map((b) => {
    const span = buildElement("i", ["icon", "iconfont", b.icon]);
    span.addEventListener("mousedown", (e) => {
      if (span.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        b.command(view)(view.state, view.dispatch, view);
      }
    });
    tooltip.appendChild(span);
    // 设置按钮引用
    b.$ = span;
  });
  view.dom.parentNode?.appendChild(tooltip);
  return tooltip;
};

// 创建外部边界框
export const buildOuterEditor = (title, content, view, callback) => {
  const sidenav = buildElement("div", ["sidenav"], { style: "width: 0px" });

  // header 标题栏 + x
  const header = buildElement("div", ["header"], {
    innerText: `${i18next.t("_edit")} ${i18next.t(title)}`,
  });
  header.appendChild(
    buildElement("i", ["icon", "iconfont", "icon-help"], {
      title: i18next.t(`${title}_help`),
    })
  );
  sidenav.appendChild(header);
  // 编辑区 codemirror
  const codemirror = new CodeMirror.EditorView({
    state: CodeMirrorState.EditorState.create({
      doc: content,
      extensions: [
        CodeMirror.basicSetup,
        new CodeMirrorState.Compartment().of(sql()),
        new CodeMirrorState.Compartment().of(json()),
      ],
    }),
    parent: sidenav,
  });
  view.state.schema.root.appendChild(sidenav);

  return {
    isShow: false,
    hidden: function () {
      // 进行sql/json自定格式化
      let succ = true;
      if (callback) {
        succ = callback(codemirror.state.sliceDoc());
      }
      if (succ) {
        sidenav.setAttribute("style", "width: 0px");
        if (view.state.schema.right) {
          view.state.schema.right.setAttribute("style", "margin-left: 255px");
        }
        if (view.state.schema.left) {
          view.state.schema.left.setAttribute("style", "width: 240px");
        }
        this.isShow = false;
      } else {
        toastr.error(i18next.t("_edit_error"));
      }
    },
    show: function () {
      sidenav.setAttribute(
        "style",
        `width: ${Math.min(document.body.clientWidth * 0.25, 500)}px`
      );
      if (view.state.schema.right) {
        view.state.schema.right.setAttribute("style", "margin-left: 35px");
      }
      if (view.state.schema.left) {
        view.state.schema.left.setAttribute("style", "width: 0px");
      }
      this.isShow = true;
    },
    remove: function () {
      sidenav.remove();
    },
  };
};

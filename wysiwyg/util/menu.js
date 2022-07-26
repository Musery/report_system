import { Plugin } from "prosemirror-state";
import { i18next } from "./i18n.js";
import { buildElement } from "./element.js";

export function build(editable, menuButtons) {
  // 对menuButtons进行拷贝防止公用导致的错误
  const config = [];
  menuButtons.map((buttons) => {
    config.push(
      buttons.map((button) => {
        return Object.assign({ ...button });
      })
    );
  });
  return new Plugin({
    view(view) {
      const right = buildElement("div", ["rjx-right"]);

      view.state.schema.root.insertBefore(right, view.dom);
      view.state.schema.root.removeChild(view.dom);
      view.dom.classList.add("editor");
      // 设置view的内容
      view.state.schema.right = right;
      if (editable) {
        // 需要menu
        const menu = buildElement("div", ["rjx-menu"]);
        config.map((buttons) => {
          for (let b of buttons.values()) {
            // 增加按钮
            const $button = buildElement("button", ["button", "rjx-button"], {
              type: "button",
              "aria-label": i18next.t(b.label),
              title: i18next.t(b.label),
            });
            $button.appendChild(
              buildElement("i", ["icon", "iconfont", b.icon])
            );

            $button.addEventListener("mousedown", (e) => {
              e.preventDefault();
              e.stopPropagation();
              b.command(view)(view.state, view.dispatch, view);
            });
            menu.appendChild($button);
            // 设置按钮引用
            b.$ = $button;
          }
          // 增加divider
          const $divider = buildElement("div", ["rjx-divider"]);
          menu.appendChild($divider);

          buttons.push({ type: "divider", $: $divider });
        });
        // 设置整体布局 menu
        right.appendChild(menu);
        // 设置 editor
        const container = buildElement("div", ["rjx-container"]);
        container.appendChild(view.dom);
        right.appendChild(container);

        updateMenu(view, config);
        return {
          update: (view, prevState) => {
            updateMenu(view, config);
          },
          destroy: () => {},
        };
      } else {
        const container = buildElement("div", ["rjx-container"]);
        container.appendChild(view.dom);
        right.appendChild(container);
        return {
          update: (view, prevState) => {},
          destroy: () => {},
        };
      }
    },
  });
}

const updateMenu = (view, defaultButtons) => {
  // 更新按钮显示情况
  defaultButtons.map((buttons) => {
    let divider = false;
    for (let button of buttons.values()) {
      if (button.active) {
        // 激活状态
        let active = button.active(view);
        if (active) {
          button.$.classList.add("active");
        } else {
          button.$.classList.remove("active");
        }
      }
      if (button.type === "divider") {
        if (divider) {
          button.$.classList.remove("disabled");
        } else {
          button.$.classList.add("disabled");
        }
      } else {
        if (button.display) {
          // 展示状态
          let display = button.display(view);
          if (display) {
            button.$.removeAttribute("disabled");
            divider = true;
          } else {
            button.$.setAttribute("disabled", "true");
          }
        } else {
          divider = true;
        }
      }
    }
  });
};

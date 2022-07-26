import { Plugin } from "prosemirror-state";
import { buildTooltip } from "./element.js";

export function build(buttons) {
  // 进行buttons拷贝 （防止共用按钮导致错误）
  const config = buttons.map((button) => {
    return Object.assign({ ...button });
  });
  let hideTooltip = false;
  return new Plugin({
    props: {
      handleKeyDown: () => {
        hideTooltip = true;
        return false;
      },
      handleClick: () => {
        hideTooltip = true;
        return false;
      },
      handleDOMEvents: {
        mousedown: () => {
          hideTooltip = false;
          return false;
        },
      },
    },
    view(view) {
      const tooltip = buildTooltip(config, view);
      const hide = () => {
        tooltip.classList.add("hide");
      };
      const unhide = () => {
        tooltip.classList.remove("hide");
      };
      return {
        update: (view, prevState) => {
          const state = view.state;
          if (
            prevState?.doc.eq(state.doc) &&
            prevState.selection.eq(state.selection)
          ) {
            return;
          }
          if (!state.selection.empty) {
            if (
              view.editable &&
              !(
                state.selection.$from.parent.type.code &&
                state.selection.$to.parent.type.code
              ) &&
              !hideTooltip
            ) {
              // 可编辑文本
              config.forEach((item) => {
                const active = item.active?.(view);
                if (active) {
                  item.$.classList.add("active");
                } else {
                  item.$.classList.remove("active");
                }
              });
              unhide(tooltip);
              calculateTextPosition(
                view,
                tooltip,
                (start, end, target, parent) => {
                  const $editor = tooltip.parentElement;
                  if (!$editor) {
                    throw new Error();
                  }
                  const selectionWidth = end.left - start.left;
                  let left =
                    start.left -
                    parent.left -
                    (target.width - selectionWidth) / 2;
                  let top =
                    start.top -
                    parent.top -
                    target.height -
                    14 +
                    $editor.scrollTop;

                  if (left < 0) left = 0;

                  if (start.top - parent.top < target.height) {
                    top = start.bottom - parent.top + 14 + $editor.scrollTop;
                  }
                  return [top, left];
                }
              );
              return;
            }
          }
          hide();
          return;
        },
        destroy: () => {
          tools.forEach((item) => {
            item.removeEventListener("mousedown", listener);
            item.remove();
          });
        },
      };
    },
  });
}

const calculateTextPosition = (view, target, handler) => {
  const state = view.state;
  const { from, to } = state.selection;
  const start = view.coordsAtPos(from);
  const end = view.coordsAtPos(to);

  const targetNodeRect = target.getBoundingClientRect();
  const parent = target.parentElement;
  if (!parent) {
    throw new Error();
  }
  const parentNodeRect = parent.getBoundingClientRect();

  const [top, left] = handler(start, end, targetNodeRect, parentNodeRect);

  target.style.top = top + "px";
  target.style.left = left + "px";
};

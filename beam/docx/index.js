import { gfm } from "micromark-extension-gfm";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";

export const build = () => {
  return {
    toDocx: [],
    sup(supports) {
      for (let spec of supports) {
        if (spec.toDocx) {
          this.toDocx.unshift(spec.toDocx);
        }
      }
      return this;
    },
    complete() {
      const toDocx = this.toDocx;
      return {
        parse2Docx(markdown) {
          const traverseChildren = (mdast, index = -1) => {
            const children = [];
            if (index > -1) {
              const result = traverse(mdast.children[index]);
              if (result) {
                if (Array.isArray(result)) {
                  children.push(...result);
                } else {
                  children.push(result);
                }
              }
            } else {
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
            }
            return children;
          };
          // 全处理链遍历
          const traverse = (mdast) => {
            for (let handler of toDocx) {
              const result = handler(mdast, traverseChildren);
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
        },
      };
    },
  };
};

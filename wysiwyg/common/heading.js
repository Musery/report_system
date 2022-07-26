import { nanoid } from "nanoid";
import { u } from "unist-builder";
import { Plugin } from "prosemirror-state";
import { setBlockType } from "../util/command.js";
import { textblockTypeInputRule } from "../util/inputrules.js";
import { buildElement } from "../util/element.js";

const id = "heading";

export const heading = {
  id,
  // markdown 语法匹配
  inputrules: [1, 2, 3].map((l) =>
    textblockTypeInputRule(
      new RegExp(`^(#{${l * 2 - 1},${l * 2}})\\s$`),
      id,
      () => ({
        level: l,
      })
    )
  ),
  // 快捷键
  key: {
    "Shift-Ctrl-1": setBlockType(id, { level: 1 }),
    "Shift-Ctrl-2": setBlockType(id, { level: 2 }),
    "Shift-Ctrl-3": setBlockType(id, { level: 3 }),
  },
  // 功能键
  button: [
    {
      type: "button",
      icon: "icon-looksone",
      label: "h1",
      command: (view) => setBlockType(id, { level: 1 }),
      active: (view) => ishead(view.state, 1),
    },
    {
      type: "button",
      icon: "icon-lookstwo",
      label: "h2",
      command: (view) => setBlockType(id, { level: 2 }),
      active: (view) => ishead(view.state, 2),
    },
    {
      type: "button",
      icon: "icon-looks3",
      label: "h3",
      command: (view) => setBlockType(id, { level: 3 }),
      active: (view) => ishead(view.state, 3),
    },
  ],
  plugins: [buildToc()],
  node: {
    attrs: { level: { default: 1 }, identify: { default: "" } },
    content: "inline*",
    group: "block",
    defining: true,
    parseDOM: [1, 2, 3].map((x) => ({
      tag: `h${x}`,
      getAttrs: () => {
        return { level: x, identify: nanoid(10) };
      },
    })),
    toDOM(node) {
      node.attrs.identify = nanoid(10);
      return [
        "h" + node.attrs.level,
        {
          class: "heading",
          level: node.attrs.level,
          id: node.attrs.identify,
        },
        0,
      ];
    },
  },
  toMdast(prose, traverseChildren) {
    if (prose.type.name === id) {
      return u(id, { depth: prose.attrs.level * 2 }, traverseChildren(prose));
    }
  },
  // 从MDAST解析
  toProse(mdast, schema, traverseChildren) {
    if (mdast.type === id)
      return schema.node(
        id,
        { level: (mdast.depth + 1) >> 1 },
        traverseChildren(mdast)
      );
  },
};
function buildToc() {
  return new Plugin({
    view(view) {
      const left = buildElement("div", ["rjx-left"]);
      view.state.schema.left = left;

      const doc = view.state.schema.root.firstChild;
      view.state.schema.root.insertBefore(left, doc);

      updateToc(left, view);
      return {
        update: (view, prevState) => {
          updateToc(left, view, prevState);
        },
        destroy: () => {},
      };
    },
  });
}
const updateToc = (toc, view, prevState) => {
  if (prevState?.doc.eq(view.state.doc)) {
    return;
  }
  const tree = buildElement("div", ["toc"]);
  if (toc.tree) {
    toc.replaceChild(tree, toc.tree);
  } else {
    toc.appendChild(tree);
  }
  toc.tree = tree;
  const ul = [tree];
  view.state.doc.content.forEach((node, index) => {
    if (node.type.name === id) {
      // 增加标题序号 todo
      createTOC(node.attrs.level, node, ul);
    }
  });
};

const createTOC = (level, node, ul) => {
  if (!ul[level - 1]) {
    createTOC(level - 1, "", ul);
  }
  const cul = createul(node);
  if (level === 1) {
    ul[0].appendChild(cul);
  } else {
    ul[level - 1].appendul(cul);
  }
  ul[level] = cul;
};

const createul = (node) => {
  const a = buildElement("a", ["toc-title"]);
  if (node.attrs) {
    a.href = `#${node.attrs.identify}`;
    a.innerText = node.textContent;
  } else {
    a.innerText = "";
  }

  const li = buildElement("li");
  li.appendChild(a);

  const ul = buildElement("ul");
  ul.appendChild(li);
  ul.appendul = (c) => {
    li.appendChild(c);
  };
  return ul;
};
const ishead = (state, level) => {
  const { $from } = state.selection;
  return (
    $from.parent.type.name === "heading" && $from.parent.attrs.level === level
  );
};

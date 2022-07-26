import {
  tableNodes,
  tableNodeTypes,
  columnResizing,
  tableEditing,
  CellSelection,
  addColumnAfter,
  addColumnBefore,
  deleteColumn,
  deleteRow,
  deleteTable,
  isInTable,
  selectedRect,
  setCellAttr,
  TableMap,
} from "prosemirror-tables";
import { u } from "unist-builder";
import { InputRule } from "prosemirror-inputrules";
import { Plugin, TextSelection, Selection } from "prosemirror-state";
import { DecorationSet, Decoration } from "prosemirror-view";

import { buildTooltip, buildElement } from "../util/element.js";

const id = "table";
export const table = () => {
  const values = [];
  const nodes = tableNodes({
    tableGroup: "block",
    cellContent: "paragraph",
    cellAttributes: {
      alignment: {
        default: "left",
        setDOMAttr(value, attrs) {
          attrs.style = `text-align: ${value || "left"}`;
        },
      },
    },
  });
  for (let o in nodes) {
    const node = {
      id: o,
      node: nodes[o],
    };
    if (o === id) {
      node.inputrules = [
        new InputRule(/^\|\|\s$/, (state, _match, start, end) => {
          const $start = state.doc.resolve(start);
          if (
            !$start
              .node(-1)
              .canReplaceWith(
                $start.index(-1),
                $start.indexAfter(-1),
                state.schema.nodes[id]
              )
          ) {
            return null;
          }

          const tableNode = createTable(state.schema);
          const tr = state.tr
            .replaceRangeWith(start, end, tableNode)
            .scrollIntoView();
          return tr.setSelection(TextSelection.create(tr.doc, start + 3));
        }),
      ];
      node.key = {
        "Mod-Enter": (state, dispatch, view) => {
          const { $head } = state.selection;
          for (let d = $head.depth; d > 0; d--)
            if ($head.node(d).type.name == id) {
              const pos = $head.after(d);
              const tr = state.tr.replaceWith(
                pos,
                pos,
                state.schema.nodes["paragraph"].createAndFill()
              );
              tr.setSelection(Selection.near(tr.doc.resolve(pos), 1));
              dispatch?.(tr.scrollIntoView());
              return true;
            }
          return false;
        },
      };
      node.button = [
        {
          type: "button",
          icon: "icon-table",
          label: "table",
          command: (view) => (state, dispatch, view) => {
            const { selection, tr } = state;
            const { from } = selection;
            const tableNode = createTable(state.schema);
            const _tr = tr.replaceSelectionWith(tableNode);
            const sel = Selection.findFrom(_tr.doc.resolve(from), 1, true);
            if (sel) {
              dispatch?.(_tr.setSelection(sel));
            }
            return true;
          },
        },
      ];
      node.toMdast = (prose, traverseChildren) => {
        if (prose.type.name === id) {
          const align = [];
          const rows = [];
          for (let i = 0; i < prose.childCount; i++) {
            const cells = [];
            for (let j = 0; j < prose.child(i).childCount; j++) {
              align.push(prose.child(i).child(j).attrs.alignment);
              if (prose.child(i).child(j).childCount > 0) {
                cells.push(
                  u(
                    "tableCell",
                    {},
                    traverseChildren(prose.child(i).child(j).content.child(0))
                  )
                );
              } else {
                cells.push(u("tableCell"));
              }
            }
            rows.push(u("tableRow", {}, cells));
          }
          return u(id, { align }, rows);
        }
      };
      // 从MDAST解析
      node.toProse = (mdast, schema, traverseChildren) => {
        if (mdast.type === id) {
          const align = mdast.align;
          const rows = [];
          for (let i = 0; i < mdast.children.length; i++) {
            const cells = [];
            for (let j = 0; j < mdast.children[i].children.length; j++) {
              cells.push(
                schema.node(
                  i == 0 ? "table_header" : "table_cell",
                  { alignment: align[j] },
                  schema.node(
                    "paragraph",
                    {},
                    traverseChildren(mdast.children[i].children[j])
                  )
                )
              );
            }
            rows.push(schema.node("table_row", {}, cells));
          }
          return schema.node(id, {}, rows);
        }
      };
      // 其他默认插件
      node.plugins = [buildTabletips(), columnResizing({}), tableEditing()];
    }
    values.push(node);
  }
  return values;
};

function buildTabletips() {
  return new Plugin({
    props: {
      decorations(state) {
        const decorations = [];
        const leftCells = getCellsInColumn(0)(state.selection);
        if (!leftCells) return null;
        const topCells = getCellsInRow(0)(state.selection);
        if (!topCells) return null;
        const [topLeft] = leftCells;
        decorations.push(createWidget(topLeft, "point"));
        leftCells.forEach((cell, i) => {
          decorations.push(createWidget(cell, "left", i));
        });
        topCells.forEach((cell, i) => {
          decorations.push(createWidget(cell, "top", i));
        });
        return DecorationSet.create(state.doc, decorations);
      },
    },
    view(view) {
      const tooltip = buildTooltip(defaultConfg, view);

      const hide = () => {
        tooltip.classList.add("hide");
      };

      return {
        update: (view, prevState) => {
          const state = view.state;

          if (
            prevState?.doc.eq(state.doc) &&
            prevState.selection.eq(state.selection)
          )
            return;

          const isCellSelection = state.selection instanceof CellSelection;

          if (!isCellSelection || !view.editable) {
            hide();
            return;
          }

          calculateItem(defaultConfg, view);
          if (defaultConfg.every(({ $ }) => $.classList.contains("hide"))) {
            hide();
            return;
          }
          tooltip.classList.remove("hide");
          calculatePosition(view, tooltip);
        },
        destroy: () => {
          tooltip.removeEventListener("mousedown", listener);
          tooltip.remove();
        },
      };
    },
  });
}

const defaultConfg = [
  {
    type: "button",
    icon: "icon-chevron-left",
    label: "chevron_left",
    command: () => addColumnBefore,
    disable: (view) => !getCellSelection(view).isColSelection(),
  },
  {
    type: "button",
    icon: "icon-chevron-right",
    label: "chevron_right",
    command: () => addColumnAfter,
    disable: (view) => !getCellSelection(view).isColSelection(),
  },
  {
    type: "button",
    icon: "icon-arrow-up",
    label: "expand_less",
    command: () => (state, dispatch) => {
      if (!isInTable(state)) return false;
      if (dispatch) {
        const rect = selectedRect(state);
        dispatch(addRowWithAlignment(state.tr, rect, rect.top));
      }
      return true;
    },
    disable: (view) =>
      !getCellSelection(view).isRowSelection() ||
      getCellSelection(view).$head.parent.type.name === "table_header",
  },
  {
    type: "button",
    icon: "icon-arrow-down",
    label: "expand_more",
    command: () => (state, dispatch) => {
      if (!isInTable(state)) return false;
      if (dispatch) {
        const rect = selectedRect(state);
        dispatch(addRowWithAlignment(state.tr, rect, rect.bottom));
      }
      return true;
    },
    disable: (view) => !getCellSelection(view).isRowSelection(),
  },

  {
    type: "button",
    icon: "icon-align-left",
    label: "format_align_left",
    command: () => setCellAttr("alignment", "left"),
    disable: (view) => !getCellSelection(view).isColSelection(),
  },
  {
    type: "button",
    icon: "icon-align-center",
    label: "format_align_center",
    command: () => setCellAttr("alignment", "center"),
    disable: (view) => !getCellSelection(view).isColSelection(),
  },
  {
    type: "button",
    icon: "icon-align-right",
    label: "format_align_right",
    command: () => setCellAttr("alignment", "right"),
    disable: (view) => !getCellSelection(view).isColSelection(),
  },
  {
    type: "button",
    icon: "icon-delete",
    label: "delete",
    command: (view) => {
      const selection = getCellSelection(view);
      const isCol = selection.isColSelection();
      const isRow = selection.isRowSelection();
      if (isCol && isRow) {
        return deleteTable;
      }

      if (isCol) {
        return deleteColumn;
      }

      return deleteRow;
    },
    disable: (view) => {
      const selection = getCellSelection(view);
      if (selection.isRowSelection()) {
        if (selection.isColSelection()) {
          return false;
        }
        return isFirstRowSelected(selection);
      }
      return false;
    },
  },
];

const createTable = (schema, rowsCount = 2, colsCount = 2) => {
  const {
    cell: tableCell,
    header_cell: tableHeader,
    row: tableRow,
    table,
  } = tableNodeTypes(schema);

  const cells = Array(colsCount)
    .fill(0)
    .map(() => tableCell.createAndFill(null));

  const headerCells = Array(colsCount)
    .fill(0)
    .map(() => tableHeader.createAndFill(null));

  const rows = Array(rowsCount)
    .fill(0)
    .map((_, i) => tableRow.create(null, i === 0 ? headerCells : cells));

  return table.create(null, rows);
};

const findTable = (selection) =>
  findParentNode((node) => node.type.spec["tableRole"] === "table")(selection);

const getCellsInColumn = (columnIndex) => (selection) => {
  const table = findTable(selection);
  if (!table) return undefined;
  const map = TableMap.get(table.node);
  if (columnIndex < 0 || columnIndex >= map.width) {
    return undefined;
  }

  return map
    .cellsInRect({
      left: columnIndex,
      right: columnIndex + 1,
      top: 0,
      bottom: map.height,
    })
    .map((pos) => {
      const node = table.node.nodeAt(pos);
      if (!node) throw new Error();
      const start = pos + table.start;
      return {
        pos: start,
        start: start + 1,
        node,
      };
    });
};

const getCellsInRow = (rowIndex) => (selection) => {
  const table = findTable(selection);
  if (!table) return undefined;
  const map = TableMap.get(table.node);
  if (rowIndex < 0 || rowIndex >= map.height) {
    return undefined;
  }
  return map
    .cellsInRect({
      left: 0,
      right: map.width,
      top: rowIndex,
      bottom: rowIndex + 1,
    })
    .map((pos) => {
      const node = table.node.nodeAt(pos);
      if (!node) throw new Error();
      const start = pos + table.start;
      return {
        pos: start,
        start: start + 1,
        node,
      };
    });
};

const createWidget = (cell, pos, index = 0) => {
  return Decoration.widget(cell.pos + 1, (view) => {
    const div = buildElement("div");
    switch (pos) {
      case "point":
        div.classList.add("rjx-cell-point");
        break;
      case "left":
        div.classList.add("rjx-cell-left");
        break;
      case "top":
        div.classList.add("rjx-cell-top");
        break;
    }
    div.addEventListener("mousedown", (e) => {
      if (!view) return;
      e.preventDefault();
      e.stopPropagation();
      switch (pos) {
        case "point": {
          view.dispatch(selectTable(view.state.tr));
          return;
        }
        case "left": {
          view.dispatch(selectLine("row")(index)(view.state.tr));
          return;
        }
        case "top": {
          view.dispatch(selectLine("col")(index)(view.state.tr));
          return;
        }
      }
    });
    return div;
  });
};

const selectTable = (tr) => {
  const cells = getCellsInTable(tr.selection);
  if (cells && cells[0]) {
    const $firstCell = tr.doc.resolve(cells[0].pos);
    const last = cells[cells.length - 1];
    if (last) {
      const $lastCell = tr.doc.resolve(last.pos);
      return cloneTr(tr.setSelection(new CellSelection($lastCell, $firstCell)));
    }
  }
  return tr;
};

const selectLine = (type) => (index) => (tr) => {
  const table = findTable(tr.selection);
  const isRowSelection = type === "row";
  if (table) {
    const map = TableMap.get(table.node);

    // Check if the index is valid
    if (index >= 0 && index < (isRowSelection ? map.height : map.width)) {
      const lastCell = map.positionAt(
        isRowSelection ? index : map.height - 1,
        isRowSelection ? map.width - 1 : index,
        table.node
      );
      const $lastCell = tr.doc.resolve(table.start + lastCell);

      const createCellSelection = isRowSelection
        ? CellSelection.rowSelection
        : CellSelection.colSelection;

      const firstCell = map.positionAt(
        isRowSelection ? index : 0,
        isRowSelection ? 0 : index,
        table.node
      );
      const $firstCell = tr.doc.resolve(table.start + firstCell);
      return cloneTr(
        tr.setSelection(createCellSelection($lastCell, $firstCell))
      );
    }
  }
  return tr;
};

function addRowWithAlignment(tr, { map, tableStart, table }, row) {
  const rowPos = Array(row)
    .fill(0)
    .reduce((acc, _, i) => {
      return acc + table.child(i).nodeSize;
    }, tableStart);

  const { cell: cellType, row: rowType } = tableNodeTypes(table.type.schema);

  const cells = Array(map.width)
    .fill(0)
    .map((_, col) => {
      const headerCol = table.nodeAt(map.map[col]);
      return cellType.createAndFill({
        alignment: headerCol?.attrs["alignment"],
      });
    });

  tr.insert(rowPos, rowType.create(null, cells));
  return tr;
}

const getCellSelection = (view) => view.state.selection;

const isFirstRowSelected = (selection) => {
  const map = TableMap.get(selection.$anchorCell.node(-1));
  const start = selection.$anchorCell.start(-1);
  const cells = map.cellsInRect({
    left: 0,
    right: map.width,
    top: 0,
    bottom: 1,
  });
  const selectedCells = map.cellsInRect(
    map.rectBetween(
      selection.$anchorCell.pos - start,
      selection.$headCell.pos - start
    )
  );

  for (let i = 0, count = cells.length; i < count; i++) {
    if (selectedCells.indexOf(cells[i]) === -1) {
      return false;
    }
  }
  return true;
};

const calculateItem = (actions, view) => {
  actions.forEach((item) => {
    const disable = item.disable?.(view);
    if (disable) {
      item.$.classList.add("hide");
      return;
    }
    item.$.classList.remove("hide");
  });
};

const calculatePosition = (view, dom) => {
  const selection = view.state.selection;
  const isCol = selection.isColSelection();
  const isRow = selection.isRowSelection();

  calculateNodePosition(view, dom, (selected, target, parent) => {
    const $editor = dom.parentElement;
    if (!$editor) {
      throw new Error();
    }
    let left = !isRow
      ? selected.left - parent.left + (selected.width - target.width) / 2
      : selected.left - parent.left - target.width / 2 - 8;
    const top =
      selected.top -
      parent.top -
      target.height -
      (isCol ? 14 : 0) -
      14 +
      $editor.scrollTop;

    if (left < 0) {
      left = 0;
    }
    return [top, left];
  });
};

const getCellsInTable = (selection) => {
  const table = findTable(selection);
  if (!table) {
    return;
  }
  const map = TableMap.get(table.node);
  const cells = map.cellsInRect({
    left: 0,
    right: map.width,
    top: 0,
    bottom: map.height,
  });
  return cells.map((nodePos) => {
    const node = table.node.nodeAt(nodePos);
    const pos = nodePos + table.start;
    return { pos, start: pos + 1, node };
  });
};

const cloneTr = (tr) => {
  return Object.assign(Object.create(tr), tr).setTime(Date.now());
};

const findParentNode = (predicate) => (selection) => {
  return findParentNodeClosestToPos(predicate)(selection.$from);
};

const findParentNodeClosestToPos = (predicate) => ($pos) => {
  for (let i = $pos.depth; i > 0; i--) {
    const node = $pos.node(i);
    if (predicate(node)) {
      return {
        pos: i > 0 ? $pos.before(i) : 0,
        start: $pos.start(i),
        depth: i,
        node,
      };
    }
  }
  return;
};

const calculateNodePosition = (view, target, handler) => {
  const state = view.state;
  const { from } = state.selection;

  const { node } = view.domAtPos(from);
  const element = node instanceof Text ? node.parentElement : node;
  if (!(element instanceof HTMLElement)) {
    throw new Error();
  }

  const selectedNodeRect = element.getBoundingClientRect();
  const targetNodeRect = target.getBoundingClientRect();
  const parentNodeRect = target.parentElement?.getBoundingClientRect();
  if (!parentNodeRect) {
    throw new Error();
  }

  const [top, left] = handler(selectedNodeRect, targetNodeRect, parentNodeRect);

  target.style.top = top + "px";
  target.style.left = left + "px";
};

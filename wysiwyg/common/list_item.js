import { u } from "unist-builder";

import { canSplit, ReplaceAroundStep } from "prosemirror-transform";
import { Fragment, Slice } from "prosemirror-model";
import { wrappingInputRule } from "../util/inputrules.js";

const id = "listItem";

export const listItem = {
  id,
  inputrules: [wrappingInputRule(/^\s*([-+*])\s$/, id)],
  key: {
    Enter: splitListItem(id),
    Tab: sinkListItem(id),
  },
  node: {
    group: "listItem",
    content: "block+",
    defining: true,
    parseDOM: [{ tag: "li" }],
    toDOM() {
      return ["li", { class: "list-item" }, 0];
    },
  },
  toMdast(prose, traverseChildren) {
    if (prose.type.name === id) return u(id, traverseChildren(prose));
  },
  // 从MDAST解析
  toProse(mdast, schema, traverseChildren) {
    if (mdast.type === id) return schema.node(id, {}, traverseChildren(mdast));
  },
};

//  重写
function splitListItem(itemId) {
  return function (state, dispatch) {
    const itemType = state.schema.nodes[itemId];
    if (!itemType) return null;
    var ref = state.selection;
    var $from = ref.$from;
    var $to = ref.$to;
    var node = ref.node;
    if ((node && node.isBlock) || $from.depth < 2 || !$from.sameParent($to)) {
      return false;
    }
    var grandParent = $from.node(-1);
    if (grandParent.type != itemType) {
      return false;
    }
    if (
      $from.parent.content.size == 0 &&
      $from.node(-1).childCount == $from.indexAfter(-1)
    ) {
      // In an empty block. If this is a nested list, the wrapping
      // list item should be split. Otherwise, bail out and let next
      // command handle lifting.
      if (
        $from.depth == 2 ||
        $from.node(-3).type != itemType ||
        $from.index(-2) != $from.node(-2).childCount - 1
      ) {
        return false;
      }
      if (dispatch) {
        var wrap = Fragment.empty;
        var depthBefore = $from.index(-1) ? 1 : $from.index(-2) ? 2 : 3;
        // Build a fragment containing empty versions of the structure
        // from the outer list item to the parent node of the cursor
        for (var d = $from.depth - depthBefore; d >= $from.depth - 3; d--) {
          wrap = Fragment.from($from.node(d).copy(wrap));
        }
        var depthAfter =
          $from.indexAfter(-1) < $from.node(-2).childCount
            ? 1
            : $from.indexAfter(-2) < $from.node(-3).childCount
            ? 2
            : 3;
        // Add a second list item with an empty default start node
        wrap = wrap.append(Fragment.from(itemType.createAndFill()));
        var start = $from.before($from.depth - (depthBefore - 1));
        var tr$1 = state.tr.replace(
          start,
          $from.after(-depthAfter),
          new Slice(wrap, 4 - depthBefore, 0)
        );
        var sel = -1;
        tr$1.doc.nodesBetween(
          start,
          tr$1.doc.content.size,
          function (node, pos) {
            if (sel > -1) {
              return false;
            }
            if (node.isTextblock && node.content.size == 0) {
              sel = pos + 1;
            }
          }
        );
        if (sel > -1) {
          tr$1.setSelection(
            state.selection.constructor.near(tr$1.doc.resolve(sel))
          );
        }
        dispatch(tr$1.scrollIntoView());
      }
      return true;
    }
    var nextType =
      $to.pos == $from.end() ? grandParent.contentMatchAt(0).defaultType : null;
    var tr = state.tr.delete($from.pos, $to.pos);
    var types = nextType && [null, { type: nextType }];
    if (!canSplit(tr.doc, $from.pos, 2, types)) {
      return false;
    }
    if (dispatch) {
      dispatch(tr.split($from.pos, 2, types).scrollIntoView());
    }
    return true;
  };
}
//  重写
function sinkListItem(itemId) {
  return function (state, dispatch) {
    const itemType = state.schema.nodes[itemId];
    if (!itemType) return null;
    let { $from, $to } = state.selection;
    let range = $from.blockRange(
      $to,
      (node) => node.childCount && node.firstChild.type == itemType
    );
    if (!range) return false;
    let startIndex = range.startIndex;
    if (startIndex == 0) return false;
    let parent = range.parent,
      nodeBefore = parent.child(startIndex - 1);
    if (nodeBefore.type != itemType) return false;

    if (dispatch) {
      let nestedBefore =
        nodeBefore.lastChild && nodeBefore.lastChild.type == parent.type;
      let inner = Fragment.from(nestedBefore ? itemType.create() : null);
      let slice = new Slice(
        Fragment.from(
          itemType.create(
            null,
            Fragment.from(
              parent.type.create({ ...parent.attrs, start: 1 }, inner)
            )
          )
        ),
        nestedBefore ? 3 : 1,
        0
      );
      let before = range.start,
        after = range.end;
      dispatch(
        state.tr
          .step(
            new ReplaceAroundStep(
              before - (nestedBefore ? 3 : 1),
              after,
              before,
              after,
              slice,
              1,
              true
            )
          )
          .scrollIntoView()
      );
    }
    return true;
  };
}

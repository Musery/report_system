import { InputRule } from "prosemirror-inputrules";
import { findWrapping } from "prosemirror-transform";

// 重写wrappingInputRule方法
export function wrappingInputRule(regexp, nodeId, getAttrs, joinPredicate) {
  return new InputRule(regexp, (state, match, start, end) => {
    const nodeType = state.schema.nodes[nodeId];
    if (!nodeType) return null;
    const attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
    const tr = state.tr.delete(start, end);
    const $start = tr.doc.resolve(start),
      range = $start.blockRange(),
      wrapping = range && findWrapping(range, nodeType, attrs);
    if (!wrapping) return null;
    tr.wrap(range, wrapping);
    const before = tr.doc.resolve(start - 1).nodeBefore;
    if (
      before &&
      before.type == nodeType &&
      canJoin(tr.doc, start - 1) &&
      (!joinPredicate || joinPredicate(match, before))
    )
      tr.join(start - 1);
    return tr;
  });
}

// 重写 textblockTypeInputRule方法
export function textblockTypeInputRule(regexp, nodeId, getAttrs) {
  return new InputRule(regexp, (state, match, start, end) => {
    const nodeType = state.schema.nodes[nodeId];
    if (!nodeType) return null;
    const $start = state.doc.resolve(start);
    const attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
    if (
      !$start
        .node(-1)
        .canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType)
    )
      return null;
    return state.tr
      .delete(start, end)
      .setBlockType(start, start, nodeType, attrs);
  });
}

//定义 markInputRule方法
export function markInputRule(regexp, markId) {
  const getMarksBetween = (start, end, state) => {
    let marks = [];
    state.doc.nodesBetween(start, end, (node, pos) => {
      marks = [
        ...marks,
        ...node.marks.map((mark) => ({
          start: pos,
          end: pos + node.nodeSize,
          mark,
        })),
      ];
    });
    return marks;
  };
  return new InputRule(regexp, (state, match, start, end) => {
    const markType = state.schema.marks[markId];
    if (!markType) return null;
    const { tr } = state;
    const matchLength = match.length;

    let markStart = start;
    let markEnd = end;

    if (match[matchLength - 1]) {
      const first = match[0];
      const last = match[matchLength - 1];
      const last1 = match[matchLength - 2];

      const matchStart = start + first.indexOf(last1);
      const matchEnd = matchStart + last1.length - 1;
      const textStart = matchStart + last1.lastIndexOf(last);
      const textEnd = textStart + last.length;

      const excludedMarks = getMarksBetween(start, end, state)
        .filter((item) => item.mark.type.excludes(markType))
        .filter((item) => item.end > matchStart);

      if (excludedMarks.length) {
        return null;
      }

      if (textEnd < matchEnd) {
        tr.delete(textEnd, matchEnd);
      }
      if (textStart > matchStart) {
        tr.delete(matchStart, textStart);
      }
      markStart = matchStart;
      markEnd = markStart + last.length;
    }
    tr.addMark(markStart, markEnd, markType.create());
    tr.removeStoredMark(markType);
    return tr;
  });
}

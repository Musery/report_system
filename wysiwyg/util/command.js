// 重写setBlockType 将command中的nodeType修改为nodeId即可
export function setBlockType(nodeId, attrs) {
  return function (state, dispatch) {
    const nodeType = state.schema.nodes[nodeId];
    if (!nodeType) return false;
    let { from, to } = state.selection;
    let applicable = false;
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (applicable) return false;
      if (!node.isTextblock || node.hasMarkup(nodeType, attrs)) return;
      if (node.type == nodeType) {
        applicable = true;
      } else {
        let $pos = state.doc.resolve(pos),
          index = $pos.index();
        applicable = $pos.parent.canReplaceWith(index, index + 1, nodeType);
      }
    });
    if (!applicable) return false;
    if (dispatch)
      dispatch(
        state.tr.setBlockType(from, to, nodeType, attrs).scrollIntoView()
      );
    return true;
  };
}

// 重写toggleMark 将command中的marktype修改为mark(id)即可
export function toggleMark(markId, attrs) {
  const markApplies = (doc, ranges, type) => {
    for (let i = 0; i < ranges.length; i++) {
      let { $from, $to } = ranges[i];
      let can = $from.depth == 0 ? doc.type.allowsMarkType(type) : false;
      doc.nodesBetween($from.pos, $to.pos, (node) => {
        if (can) return false;
        can = node.inlineContent && node.type.allowsMarkType(type);
      });
      if (can) return true;
    }
    return false;
  };
  return function (state, dispatch) {
    const markType = state.schema.marks[markId];
    if (!markType) return false;
    let { empty, $cursor, ranges } = state.selection;
    if ((empty && !$cursor) || !markApplies(state.doc, ranges, markType))
      return false;
    if (dispatch) {
      if ($cursor) {
        if (markType.isInSet(state.storedMarks || $cursor.marks()))
          dispatch(state.tr.removeStoredMark(markType));
        else dispatch(state.tr.addStoredMark(markType.create(attrs)));
      } else {
        let has = false,
          tr = state.tr;
        for (let i = 0; !has && i < ranges.length; i++) {
          let { $from, $to } = ranges[i];
          has = state.doc.rangeHasMark($from.pos, $to.pos, markType);
        }
        for (let i = 0; i < ranges.length; i++) {
          let { $from, $to } = ranges[i];
          if (has) {
            tr.removeMark($from.pos, $to.pos, markType);
          } else {
            let from = $from.pos,
              to = $to.pos,
              start = $from.nodeAfter,
              end = $to.nodeBefore;
            let spaceStart =
              start && start.isText ? /^\s*/.exec(start.text)[0].length : 0;
            let spaceEnd =
              end && end.isText ? /\s*$/.exec(end.text)[0].length : 0;
            if (from + spaceStart < to) {
              from += spaceStart;
              to -= spaceEnd;
            }
            tr.addMark(from, to, markType.create(attrs));
          }
        }
        dispatch(tr.scrollIntoView());
      }
    }
    return true;
  };
}

// 判断是否存在标记
export function isMark(state, markId) {
  if (!markId) return false;
  const mark = state.schema.marks[markId];
  if (!mark) return false;
  const { from, $from, to, empty } = state.selection;
  if (empty) {
    return !!mark.isInSet(state.storedMarks || $from.marks());
  }
  return state.doc.rangeHasMark(from, to, mark);
}

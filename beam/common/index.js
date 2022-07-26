import { blockquote } from "./blockquote.js";
import { _break } from "./break.js";
import { code } from "./code.js";
import { heading } from "./heading.js";
import { image } from "./image.js";
import { listItem } from "./list_item.js";
import { list } from "./list.js";
import { paragraph } from "./paragraph.js";
import { root } from "./root.js";
import { text } from "./text.js";
import { thematicBreak } from "./thematic_break.js";

import { _delete } from "./delete.js";
import { emphasis } from "./emphasis.js";
import { inlineCode } from "./inline_code.js";
import { link } from "./link.js";
import { strong } from "./strong.js";

// 顺序会影响
export const supports = [
  inlineCode,
  strong,
  emphasis,
  _delete,
  link,

  root,
  paragraph,
  blockquote,
  heading,
  thematicBreak,
  code,
  text,
  image,
  _break,
  list,
  listItem,
];

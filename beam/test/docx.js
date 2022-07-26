import { buildFirst } from "../docx/first.js";
import { header } from "../docx/header.js";
import { page4Footer } from "../docx/footer.js";
import { numbering } from "../docx/number.js";
import { build } from "../docx/index.js";
import * as _gfm from "../gfm/index.js";
import * as _common from "../common/index.js";
import * as _graph from "../graph/index.js";
import * as fs from "fs";
import path from "path";

import docx from "docx";
const { Paragraph, Document, TableOfContents, StyleLevel, PageBreak, Packer } =
  docx;

const __dirname = path.resolve();

export const toDocx = (options, markdown) => {
  const { parse2Docx } = build({
    uri: "http://localhost:3001/",
  })
    .sup(_common.supports)
    .sup(_gfm.supports)
    .sup(_graph.supports)
    .complete();
  const { paragraph, footnotes } = parse2Docx(markdown);
  const document = new Document({
    // 定义好的样式展示
    externalStyles: fs.readFileSync(
      path.join(__dirname, "./docx/styles.xml"),
      "utf-8"
    ),
    // 开启目录自动更新
    features: {
      updateFields: true,
    },
    // 序数
    numbering: numbering,
    footnotes: footnotes,
    sections: [
      {
        children: [
          ...buildFirst(options),
          new TableOfContents("目录", {
            hyperlink: true,
            // 暂时写死 对应名称
            stylesWithLevels: [
              new StyleLevel("标题 1", 1),
              new StyleLevel("标题 2", 2),
              new StyleLevel("标题 3", 3),
              new StyleLevel("heading 1", 1),
              new StyleLevel("heading 2", 2),
              new StyleLevel("heading 3", 3),
            ],
          }),
          new Paragraph({
            children: [new PageBreak()],
          }),
          ...paragraph,
        ],
        // 页眉
        headers: header(options),
        // 页脚页码
        footers: page4Footer,
      },
    ],
  });
  Packer.toBuffer(document).then((buffer) => {
    fs.writeFileSync(options.output, buffer);
  });
};
toDocx(
  {
    header: "安恒信息技术股份有限公司",
    output: `/Users/jonathan/Downloads/markdown-${new Date()}.docx`,
    title: "日志审计综合报表",
    information: [
      {
        key: "创建日期",
        value: "2022-06-28",
      },
      {
        key: "创建人",
        value: "希绪弗斯",
      },
    ],
    logo: {
      path: "./test/image1.png",
      width: 500,
      height: 199,
    },
  },
  fs.readFileSync(path.join(__dirname, "../report/report.md"), "utf-8")
);

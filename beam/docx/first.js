import * as fs from "fs";
import docx from "docx";
const { Paragraph, AlignmentType, TextRun, ImageRun, PageBreak } = docx;

// 创建首页内容
export const buildFirst = (options) => {
  const { logo, title, information } = options;
  return [
    // 首页
    new Paragraph({
      children: [
        new TextRun({
          break: 5,
        }),
      ],
    }),
    // logo
    new Paragraph({
      children: [
        new ImageRun({
          data: fs.readFileSync(logo.path),
          transformation: {
            width: logo.width,
            height: logo.height,
          },
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    // 报表信息 title
    new Paragraph({
      // docx 标题样式 a7
      style: "Title",
      children: [
        new TextRun({
          text: title,
          break: 2,
        }),
      ],
    }),
    // 报表具体信息 information
    new Paragraph({
      children: [
        new TextRun({
          break: 1,
        }),
      ],
    }),
    ...information.map((item) => {
      return new Paragraph({
        text: `${item.key}:${item.value}`,
        style: "Subtitle",
      });
    }),
    // 进行换行
    new Paragraph({
      children: [new PageBreak()],
    }),
  ];
};

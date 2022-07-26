import docx from "docx";
const { Paragraph, AlignmentType, PageNumber, TextRun, Footer } = docx;

// 页码居中页脚
export const page4Footer = {
  default: new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            children: [PageNumber.CURRENT],
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ],
  }),
  even: new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            children: [PageNumber.CURRENT],
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ],
  }),
};

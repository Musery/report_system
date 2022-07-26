import docx from "docx";
const { Paragraph, Header } = docx;

// 创建页眉
export const header = (options) => {
  return {
    default: new Header({
      children: [
        new Paragraph({
          text: options.header,
          style: "header",
        }),
      ],
    }),
  };
};

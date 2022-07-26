import docx from "docx";
const { LevelFormat, AlignmentType } = docx;
// 设置序数字段

export const numbering = {
  config: [
    {
      reference: "c-numbering",
      levels: [
        {
          level: 0,
          format: LevelFormat.UPPER_ROMAN,
          text: "%1",
          alignment: AlignmentType.START,
          style: {
            paragraph: {
              indent: {
                left: 720,
                hanging: 360,
              },
            },
          },
        },
        {
          level: 1,
          format: LevelFormat.DECIMAL,
          text: "%2.",
          alignment: AlignmentType.START,
          style: {
            paragraph: {
              indent: {
                left: 1440,
                hanging: 360,
              },
            },
          },
        },
        {
          level: 2,
          format: LevelFormat.LOWER_LETTER,
          text: "%3)",
          alignment: AlignmentType.START,
          style: {
            paragraph: {
              indent: {
                left: 2160,
                hanging: 360,
              },
            },
          },
        },
        {
          level: 3,
          format: LevelFormat.UPPER_LETTER,
          text: "%4)",
          alignment: AlignmentType.START,
          style: {
            paragraph: {
              indent: { left: 2880, hanging: 360 },
            },
          },
        },
      ],
    },
  ],
};

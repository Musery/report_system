import i18next from "i18next";

const translation = {
  h1: {
    zh: "一级标题",
    en: "first-level title",
  },
  h2: {
    zh: "二级标题",
    en: "sec-level title",
  },
  h3: {
    zh: "三级标题",
    en: "third-level title",
  },
  undo: {
    zh: "撤消",
    en: "undo",
  },
  redo: {
    zh: "恢复",
    en: "redo",
  },
  code: {
    zh: "代码块",
    en: "code",
  },
  bold: {
    zh: "加粗",
    en: "bold",
  },
  italic: {
    zh: "斜体",
    en: "italic",
  },
  delete: {
    zh: "删除线",
    en: "delete",
  },
  link: {
    zh: "超链接",
    en: "link",
  },
  table: {
    zh: "静态表格",
    en: "static table",
  },
  _table: {
    zh: "动态表格",
    en: "dynamic table",
  },
  _table_help: {
    zh: "可以通过 'as' 设置别名",
    en: "Aliases can be set via 'as'",
  },
  _data: {
    zh: "统计值",
    en: "statistics",
  },
  _data_help: {
    zh: "只使用第一个字段返回值作为展示值",
    en: "Only use the first field return value as the display value",
  },
  _echarts: {
    zh: "图形",
    en: "echarts",
  },
  _echarts_help: {
    zh: "可以通过图形配置进行样式修改",
    en: "Style modifications can be made through echarts configuration",
  },
  _echarts_option: {
    zh: "图形配置",
    en: "echarts option",
  },
  _echarts_option_help: {
    zh: "参考echarts配置",
    en: "Refer to echarts configuration",
  },
  pie: {
    zh: "饼图",
    en: "pie chart",
  },
  line: {
    zh: "折线图",
    en: "line chart",
  },
  bar: {
    zh: "柱状图",
    en: "bar chart",
  },
  scatter: {
    zh: "散点图",
    en: "scatter chart",
  },
  radar: {
    zh: "雷达图",
    en: "radar chart",
  },
  _edit: {
    zh: "编辑",
    en: "edit",
  },
  _edit_error: {
    zh: "编辑错误, 请检查格式是否正确",
    en: "Editing error, please check the format is correct",
  },
  _timing_save_success: {
    zh: "自动保存成功",
    en: "Timing save successfully",
  },
  _timing_save_fail: {
    zh: "自动保存失败",
    en: "Timing save failed",
  },
  _ws_close: {
    zh: "链接已断开, 正在重试",
    en: "Connection is broken, retrying",
  },
  _ws_reconnection: {
    zh: "重连成功",
    en: "successful reconnection",
  },
};

i18next.init({
  lng: "zh",
  debug: false,
  resources: (() => {
    const en = {};
    const zh = {};
    for (let k in translation) {
      Object.assign(en, { [k]: translation[k].en });
      Object.assign(zh, { [k]: translation[k].zh });
    }
    return { en: { translation: en }, zh: { translation: zh } };
  })(),
});

export { i18next };

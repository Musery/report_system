#### RJX-WYSIWYG

---

`rjx-wysiwyg` 基于 [prosemirror](https://prosemirror.xheldon.com/docs)和[mdast](https://github.com/syntax-tree/mdast)及其相关扩展插件实现的可视化 markdown 语法**报表**在线编辑和支持*docx, pdf*格式报表导出

#### 在线编辑&报表导出

- HTML <-> MD -> DOCX/PDF
  - 支持语法
    - 全部[CommonMark](https://commonmark.org/)
      1. 加粗(strong)
      2. 强调(emphasis)
      3. 删除(delete)
      4. 超链接(link)
      5. 标题(heading)
      6. 块引用(blockquote)
      7. 代码块(code)
      8. 图片(image)
      9. 换行(break)
      10. 分割线(thematicBreak)
      11. 列表(list)
    - 部分[GFM](https://github.github.com/gfm/)
      1. 脚注(footnotes)
      2. 表格(table)
    - 自定义
      1. 静态图(echarts)[^1]
      2. 动态[^2]表格
      3. 动态图
      4. 动态值

#### 示例

#### 支持 DOCX 样式自定义

#### 支持 国际化(i18n)

#### 动态数据源

- 支持数据源
  - mysql
  - pgsql
  - flink
  - elasticsearch
  - clickhouse

[^1]: 基于 `echarts` 实现图形统计展示
[^2]: 非静态数据

#### echarts 支持自定义化

| support                      | 饼图 | 折线图 | 柱状图 | 散点图 | 雷达图 |
| ---------------------------- | ---- | ------ | ------ | ------ | ------ |
| title/text                   | ✅   | ✅     | ✅     | ✅     | ✅     |
| title/subtext                | ✅   | ✅     | ✅     | ✅     | ✅     |
| title/x （l,c,r）            | ✅   | ✅     | ✅     | ✅     | ✅     |
| title/y （t,c,b）            | ✅   | ✅     | ✅     | ✅     | ✅     |
| tooltip/trigger (item, axis) | ✅   | ✅     | ✅     | ✅     | ✅     |
| legend/data                  | ✅   | ✅     | ✅     | ✅     | ✅     |
| legend/x （l,c,r）           | ✅   | ✅     | ✅     | ✅     | ✅     |
| legend/y （t,c,b）           | ✅   | ✅     | ✅     | ✅     | ✅     |
| series/data                  | ✅   | ✅     | ✅     | ✅     | ✅     |
| series/type                  | ✅   | ✅     | ✅     | ✅     | ✅     |
| (xAxis and yAxis)/data       | ❌   | ✅     | ✅     | ✅     | ❌     |
| radar/indicator              | ❌   | ❌     | ❌     | ❌     | ✅     |

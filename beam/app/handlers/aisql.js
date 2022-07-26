import { clickhouse } from "../orm/clickhouse.js";
import { sql } from "../orm/postgres.js";
import { Parser, util } from "@florajs/sql-parser";

const dist = {};
//  初始化字典
(await sql`select key, name, type from soc_data_dict`).forEach(async (dt) => {
  dist[dt.key] = {
    zh: dt.name,
    en: dt.key,
  };
  if (dt.type === "enum") {
    // 查询对应枚举
    const enums = new Map();
    await sql`select enum_name, enum_value from soc_data_dict_enums where data_dict_key = ${dt.key}`.forEach(
      (enumi) => {
        enums.set(enumi.enum_name, enumi.enum_value);
      }
    );
    dist[dt.key]["enums"] = enums;
  }
});

export const handlers = {
  AISQL_DATA: ({ aisql }, succ, err) => {
    const { columns, sql } = sqlParse(aisql);
    clickhouse.query(sql).exec(function (error, rows) {
      if (error) {
        err(error);
      } else {
        succ(rows[0][columns[0]]);
      }
    });
  },
  AISQL_TABLE: ({ aisql, lang = "zh" }, succ, err) => {
    const { columns, sql } = sqlParse(aisql);
    clickhouse.query(sql).exec(function (error, rows) {
      if (error) {
        err(error);
      } else {
        // 首行标题
        const result = [[]];
        for (let column of columns) {
          if (dist[column]) {
            result[0].push(dist[column][lang]);
          } else {
            result[0].push(column);
          }
        }
        for (let i = 0; i < rows.length; i++) {
          result.push([]);
          for (let column of columns) {
            if (dist[column] && dist[column].enums) {
              const replace = dist[column].enums[rows[i][column]];
              result[i + 1].push(replace ? replace : rows[i][column]);
            } else {
              result[i + 1].push(rows[i][column]);
            }
          }
        }
        succ(result);
      }
    });
  },
  AISQL_CHART: ({ aisql, type, option = {}, lang = "zh" }, succ, err) => {
    if (!aisql) {
      succ(option);
    } else {
      const { columns, sql } = sqlParse(aisql);
      clickhouse.query(sql).exec(function (error, rows) {
        if (error) {
          err(error);
        } else {
          option = { ...defaultOption[type](), ...option };
          // 删除height字段
          delete option.height;
          if (type === "radar") {
            // 需要动态补充 indicator
            const indicator =
              !option.radar.indicator || option.radar.indicator.length === 0;
            if (indicator) {
              // 强制初始化一下 保证不要出现空指针
              option.radar.indicator = [];
            }
            // 初始化 series radar序列
            option.series.push({
              type: "radar",
              data: [],
            });
            for (let i = 0; i < columns.length; i++) {
              if (i !== 0) {
                if (indicator) {
                  if (dist[columns[i]]) {
                    option.radar.indicator.push({
                      name: dist[columns[i]][lang],
                    });
                  } else {
                    option.radar.indicator.push({ name: columns[i] });
                  }
                }
              }
              for (let j = 0; j < rows.length; j++) {
                if (i === 0) {
                  option.series[option.series.length - 1].data.push({
                    name: rows[j][columns[i]],
                    value: [],
                  });
                } else {
                  option.series[option.series.length - 1].data[j].value.push(
                    rows[j][columns[i]]
                  );
                }
              }
            }
          } else if (type === "pie") {
            // 图比
            const radius = [
              [[0, "60%"]],
              [
                [0, "30%"],
                ["45%", "60%"],
              ],
              [
                [0, "25%"],
                ["35%", "50%"],
                ["60%", "70%"],
              ],
            ];
            // 获得初始值
            const init = option.series.length;

            for (let i = 0; i < columns.length; i++) {
              if (i !== 0) {
                // 增加一个序列
                option.series.push({
                  name: dist[columns[i]] ? dist[columns[i]][lang] : columns[i],
                  type: "pie",
                  selectedMode: "single",
                  radius: radius[columns.length - 2 + init][i - 1 + init],
                  data: [],
                  label: {
                    formatter:
                      "{a|{a}}{abg|}\n{hr|}\n  {b|{b}：}{c}  {per|{d}%}  ",
                    backgroundColor: "#F6F8FC",
                    borderColor: "#8C8D8E",
                    borderWidth: 1,
                    borderRadius: 4,
                    rich: {
                      a: {
                        color: "#6E7079",
                        lineHeight: 22,
                        align: "center",
                      },
                      hr: {
                        borderColor: "#8C8D8E",
                        width: "100%",
                        borderWidth: 1,
                        height: 0,
                      },
                      b: {
                        color: "#4C5058",
                        fontSize: 14,
                        fontWeight: "bold",
                        lineHeight: 33,
                      },
                      per: {
                        color: "#fff",
                        backgroundColor: "#4C5058",
                        padding: [3, 4],
                        borderRadius: 4,
                      },
                    },
                  },
                });
              }
              for (let j = 0; j < rows.length; j++) {
                if (i !== 0) {
                  // 一列一组数据
                  option.series[i - 1 + init].data.push({
                    name: rows[j][columns[0]],
                    value: rows[j][columns[i]],
                  });
                }
              }
            }
          } else {
            // 判断x,y 哪个是需要进行值设置
            let asix;
            if (option.xAxis.type === "category") {
              asix = option.xAxis;
            } else if (option.yAxis.type === "category") {
              asix = option.yAxis;
            }
            const autoAsix = asix && (!asix.data || asix.data.length === 0);
            if (autoAsix) {
              // 防止空指针
              asix.data = [];
            }
            const init = option.series.length;
            for (let i = 0; i < columns.length; i++) {
              if (i !== 0) {
                option.series.push({
                  name: dist[columns[i]] ? dist[columns[i]][lang] : columns[i],
                  type: type,
                  stack: "Total",
                  label: {
                    show: true,
                  },
                  data: [],
                });
              }
              for (let j = 0; j < rows.length; j++) {
                if (i === 0) {
                  // 用来做坐标
                  if (autoAsix) {
                    asix.data.push(rows[j][columns[i]]);
                  }
                } else {
                  // j系列的值
                  if (type === "scatter") {
                    // 数组 scatter
                    option.series[i - 1 + init].data.push([
                      rows[j][columns[0]],
                      rows[j][columns[i]],
                    ]);
                  } else {
                    option.series[i - 1 + init].data.push(rows[j][columns[i]]);
                  }
                }
              }
            }
          }
          succ(option);
        }
      });
    }
  },
};

// sql 校验
const sqlParse = (aisql) => {
  const parser = new Parser();
  const columns = [];
  const ast = parser.parse(aisql);
  // 进行表名称替换
  for (let column of ast.columns) {
    if (column.as) {
      columns.push(column.as);
    } else {
      if (column.type === "column_ref") {
        columns.push(column.column);
      } else {
        // 必须有 as
        throw new Error("Non-existing table fields must be aliased");
      }
    }
  }
  for (let from of ast.from) {
    switch (from.table) {
      case "event":
        from.table = "soc_all";
        break;
      default:
        throw new Error("UNKNOWN TABLE");
    }
  }
  return {
    sql: util.astToSQL(ast),
    columns,
  };
};

// 除series以外的option (默认支持)
const defaultOption = {
  pie: () => ({
    title: {
      text: "Chart Pie",
      x: "center",
    },
    tooltip: {
      trigger: "item",
    },
    legend: {
      orient: "vertical",
      x: "left",
    },
    series: [], // need fill
  }),
  line: () => ({
    title: {
      text: "Chart Line",
    },
    tooltip: {
      trigger: "axis",
    },
    legend: {},
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: [], // need fill
    },
    yAxis: {
      type: "value",
    },
    series: [], // need fill
  }),
  bar: () => ({
    title: {
      text: "Chart Bar",
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        // Use axis to trigger tooltip
        type: "shadow", // 'shadow' as default; can also be 'line' or 'shadow'
      },
    },
    legend: {},
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      boundaryGap: [0, 0.01],
    },
    yAxis: {
      type: "category",
      data: [], // need fill
    },
    series: [], // need fill
  }),
  scatter: () => ({
    title: {
      text: "Chart Scatter",
      top: 0,
    },
    xAxis: {
      type: "value",
    },
    yAxis: {
      type: "value",
    },
    tooltip: {
      trigger: "item",
      axisPointer: {
        type: "cross",
      },
    },
    series: [], // need fill
  }),
  radar: () => ({
    title: {
      text: "Basic Radar Chart",
    },
    tooltip: {
      trigger: "item",
    },
    legend: {
      orient: "vertical",
      x: "left",
      y: "center",
    },
    radar: {
      // must add indicator: [],
    },
    series: [], // need fill
  }),
};

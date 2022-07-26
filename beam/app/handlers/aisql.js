import { clickhouse } from "../orm/clickhouse.js";
import { sql } from "../orm/postgres.js";
import { Parser } from "@florajs/sql-parser";
import * as toSQL from "@florajs/sql-parser/lib/util.js";

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
  AISQL_CHART: ({ aisql, type, lang = "zh" }, succ, err) => {
    const { columns, sql } = sqlParse(aisql);
    clickhouse.query(sql).exec(function (error, rows) {
      if (error) {
        err(error);
      } else {
        const option = {
          legend: {
            data: [],
          },
          series: [],
        };
        if (type === "_radar") {
          option.radar = {
            indicator: [],
          };
          option.series.push({
            type: "radar",
            data: [],
          });
          for (let i = 0; i < columns.length; i++) {
            if (i !== 0) {
              if (dist[columns[i]]) {
                option.radar.indicator.push({ name: dist[columns[i]][lang] });
              } else {
                option.radar.indicator.push({ name: columns[i] });
              }
            }
            for (let j = 0; j < rows.length; j++) {
              if (i === 0) {
                // 从第二行开始 就是系列
                option.series[0].data.push({
                  name: rows[j][columns[i]],
                  value: [],
                });
                option.legend.data.push(rows[j][columns[i]]);
              } else {
                option.series[0].data[j - 1].value.push(rows[j][columns[i]]);
              }
            }
          }
        } else if (type === "_pie") {
          let radius = 0;
          for (let i = 0; i < columns.length; i++) {
            if (i !== 0) {
              // 增加一个序列
              option.series.push({
                type: "pie",
                selectedMode: "single",
                radius: [
                  `${radius === 0 ? radius : radius + 10}%`,
                  `${radius + 25}%`,
                ],
                data: [],
              });
              radius += 25;
            }
            for (let j = 0; j < rows.length; j++) {
              if (i === 0) {
                // 系列 legend
                option.legend.data.push(rows[j][columns[i]]);
              } else {
                // 一列一组数据
                option.series[i - 1].data.push({
                  name: rows[j][columns[0]],
                  value: rows[j][columns[i]],
                });
              }
            }
          }
        } else {
          // 要区分x,y
          const asix = {
            type: "category",
            data: [],
          };

          // 其他的legend
          for (let i = 0; i < columns.length; i++) {
            if (i !== 0) {
              if (dist[columns[i]]) {
                option.legend.data.push(dist[columns[i]][lang]);
              } else {
                option.legend.data.push(columns[i]);
              }
              option.series.push({
                name: option.legend.data[option.legend.data.length - 1],
                type: type.replace("_", ""),
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
                asix.data.push(rows[j][columns[i]]);
              } else {
                // j系列的值
                option.series[i - 1].data.push(rows[j][columns[i]]);
              }
            }
          }
        }
        succ(option);
      }
    });
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
    sql: toSQL.default.astToSQL(ast),
    columns,
  };
};

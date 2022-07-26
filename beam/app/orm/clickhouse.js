import config from "config";
import { ClickHouse } from "clickhouse";

export const clickhouse = new ClickHouse(config.get("clickhouse"));

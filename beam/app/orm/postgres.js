import config from "config";
import postgres from "postgres";

export const sql = postgres(config.get("postgres"));

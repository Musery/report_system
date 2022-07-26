import { Temporal } from "@js-temporal/polyfill";
import { logger } from "../utils/log_format.js";
import * as fs from "fs";
import path from "path";
const __dirname = path.resolve();

export const handlers = {
  GET_MDREPORT: ({ name }, succ, err) => {
    succ(fs.readFileSync(path.join(__dirname, `/report/${name}.md`), "utf-8"));
  },
  POST_MDREPORT: ({ name, content }, succ, err) => {
    succ(fs.writeFileSync(path.join(__dirname, `/report/${name}.md`), content));
  },
};

import log4js from "log4js";
import config from "config";

log4js.configure(config.get("Log4js"));

export const logger = {
  error: (err) => log4js.getLogger("error").error(err),
  info: (info) => log4js.getLogger("info").info(info),
};

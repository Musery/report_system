import * as mdreport from "./mdreport.js";
import * as aisql from "./aisql.js";
import { logger } from "../utils/log_format.js";

const handlers = {
  ...mdreport.handlers,
  ...aisql.handlers,
};

export const handle = ({ cbid, command, data }, ws) => {
  const handler = handlers[command];
  if (handler) {
    try {
      handler(
        data,
        (result) => {
          logger.info(
            `COMMAND:${command}, data:${
              data ? JSON.stringify(data) : ""
            }, result:${result ? JSON.stringify(result) : ""}`
          );
          ws.send(
            JSON.stringify({
              cbid,
              status: 200,
              data: result,
            })
          );
        },
        (error, message) => {
          logger.error(
            `COMMAND:${command}, data:${
              data ? JSON.stringify(data) : ""
            }, ERROR: ${error}`
          );
          ws.send(
            JSON.stringify({
              cbid,
              status: 501,
              message,
            })
          );
        }
      );
    } catch (err) {
      logger.error(
        `COMMAND:${command}, data:${
          data ? JSON.stringify(data) : ""
        }, ERROR: ${err}`
      );
    }
  } else {
    // 默认处理
    logger.info(
      `UNKNOW HANDLER WITH COMMAND:${command}, data:${
        data ? JSON.stringify(data) : ""
      }`
    );
  }
};

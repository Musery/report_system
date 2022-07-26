import config from "config";
import { WebSocketServer } from "ws";
import { logger } from "./app/utils/log_format.js";
import { handle } from "./app/handlers/index.js";

const App = config.get("App");
const wss = new WebSocketServer(App, () => {
  logger.info(`websocket is listening on port: ${App.port}`);
});

wss.on("connection", function connection(ws) {
  ws.isAlive = true;
  ws.on("pong", function heartbeat() {
    this.isAlive = true;
  });
  ws.on("message", function message(data) {
    const _data = JSON.parse(data);
    handle(_data, this);
  });
});
// 清理业务
wss.on("close", function close() {
  clearInterval(
    setInterval(function ping() {
      wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
      });
    }, 30)
  );
});

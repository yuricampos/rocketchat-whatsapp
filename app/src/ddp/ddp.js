import EventEmitter from "wolfy87-eventemitter";

import { contains } from "../utils/contains";
import { uniqueId } from "../utils/unique-id";

import Queue from "./queue";
import Socket from "./socket";

const DDP_VERSION = "1";
const PUBLIC_EVENTS = [ "ready", "nosub", "added", "changed", "removed", "result", "updated","error" ];
const DEFAULT_RECONNECT_INTERVAL = 10000;

export default class extends EventEmitter {

  emit () {
    setTimeout(super.emit.bind(this, ...arguments), 0);
  }

  constructor (options) {

    super();

    this.status = "disconnected";

    this.autoConnect = (options.autoConnect !== false);
    this.autoReconnect = (options.autoReconnect !== false);
    this.reconnectInterval = options.reconnectInterval || DEFAULT_RECONNECT_INTERVAL;

    this.messageQueue = new Queue(message => {
      if (this.status === "connected") {
        this.socket.send(message);
        return true;
      } else {
        return false;
      }
    });

    this.socket = new Socket(options.SocketConstructor, options.endpoint);

    this.socket.on("open", () => {
      this.socket.send({
        msg: "connect",
        version: DDP_VERSION,
        support: [DDP_VERSION]
      });
    });

    this.socket.on("close", () => {
      this.status = "disconnected";
      this.messageQueue.empty();
      this.emit("disconnected");

      if (this.autoReconnect) {
        setTimeout(
          this.socket.open.bind(this.socket),
          this.reconnectInterval
        );
      }
    });

    this.socket.on("message:in", message => {
      if (message.msg === "connected") {
        this.status = "connected";
        this.messageQueue.process();
        this.emit("connected", message);

      } else if (message.msg === "ping") {
        this.socket.send({msg: "pong", id: message.id});

      } else if (contains(PUBLIC_EVENTS, message.msg)) {
        this.emit(message.msg, message);
      }
    });

    if (this.autoConnect) {
      this.connect();
    }
  }

  connect () {
    this.socket.open();
  }

  disconnect () {
    this.autoReconnect = false;
    this.socket.close();
  }

  method (name, params) {
    const id = uniqueId();
    this.messageQueue.push({
      msg: "method",
      id: id,
      method: name,
      params: params
    });
    return id;
  }

  sub (name, params, id = null) {
    id || (id = uniqueId());
    this.messageQueue.push({
      msg: "sub",
      id: id,
      name: name,
      params: params
    });
    return id;
  }

  unsub (id) {
    this.messageQueue.push({
      msg: "unsub",
      id: id
    });
    return id;
  }
};

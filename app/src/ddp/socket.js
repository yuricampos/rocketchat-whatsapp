import EventEmitter from 'wolfy87-eventemitter';

export default class extends EventEmitter {

  constructor(SocketConstructor, endpoint) {
    super();

    this.SocketConstructor = SocketConstructor;
    this.endpoint = endpoint;
    this.rawSocket = null;
  }

  send(obj) {
    const message = JSON.stringify(obj);
    this.rawSocket.send(message);

    this.emit('message:out', obj);
  }

  open() {
    if (this.rawSocket) return;

    this.rawSocket = new this.SocketConstructor(this.endpoint);

    this.rawSocket.onopen = () => this.emit('open');

    this.rawSocket.onclose = () => {
      this.rawSocket = null;

      this.emit('close');
    };

    this.rawSocket.onclose = () => {
      delete this.rawSocket.onclose;

      this.rawSocket.close();
      this.rawSocket = null;

      this.emit('close');
    };

    this.rawSocket.onmessage = message => {
      var object;

      try {
        object = JSON.parse(message.data)
      } catch (ignore) {
        return;
      }

      this.emit('message:in', object);
    };
  }

  close() {
    if (this.rawSocket) this.rawSocket.close();
  }
};

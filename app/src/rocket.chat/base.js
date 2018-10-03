export default class Base {
  constructor (debug) {
    this.debug = debug;

    if (this.constructor === Base) {
      throw new TypeError('Abstract class "Base" cannot be instantiated directly.');
    }

    if (this.listeningResult === undefined) {
      throw new TypeError('Classes extending the "Base" abstract class must to implement the "listeningResult" method');
    }
  }

  log () {
    if (this.debug) console.log.apply(console, arguments);
  }
}

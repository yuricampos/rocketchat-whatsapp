/* global WebSocket */

import DDP from './../ddp/ddp';
import Base from './base';

import crypto from 'crypto';
import Guest from './guest';

export default class Client extends Base {

  constructor(config) {
    super(config.debug);

    this.eventLogin = 0;

    this.token = '';
    this.accessToken = '';
    this.logged = false;

    this.department = config.department;

    this.username = config.username;
    this.password = config.password;

    this.digest = crypto.createHash('sha256').update(this.password, 'utf8').digest('hex');

    this.host = config.host || 'localhost:3000';
    this.useSSL = config.useSSL || false;

    this.endpoint = `${this.useSSL ? 'wss://' : 'ws://'}${this.host}/websocket`;

    this.ddp = new DDP({
      endpoint: this.endpoint,
      SocketConstructor: WebSocket,
    });

    this.host = `${this.useSSL ? 'https://' : 'http://'}${this.host}`;
    this.downloadURL = config.downloadURL;

    this.logURL = config.logURL;

    this.guests = {};
  }

  init() {
    this.ddp.on('connected', message => {
      super.log('[DEBUG] Connected');
      this.token = message.session;
    });

    this.login();
    this.listeningResult();
  }

  login() {
    super.log('[DEBUG] Logando robo no Rocket.Chat');
    this.eventLogin = this.ddp.method('login', [{
      user: { username: this.username },
      password: { digest: this.digest, algorithm: 'sha-256' },
    }]);
  }

  listeningResult() {
    this.ddp.on('result', message => {
      if (!message.error) {
        switch (message.id) {
          case this.eventLogin:
            if (!this.logged) {
              super.log('[DEBUG] Noticando evento de loggin realizado\n', message);

              this.userId = message.result.id;
              this.accessToken = message.result.token;

              this.logged = true
              this.ddp.emit('loggedIn', message);
            }
            break;
        }

      } else {
        if (message.error.error == 'no-agent-online') {
          super.log('[DEBUG ] Noticando evento de nenhum agente oline para responder no Rocket.Chat\n', message);
          this.ddp.emit('noAgentOnline', message);
        }
      }
    });

    this.ddp.on('loadedHistory', (chatId, message) => {
      super.log('[DEBUG] Salvando conversa do Rocket.Chat para o log.');

      const messages = message.result.messages;

      fetch(this.logURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({chatId, messages}),

      });
    });

    this.ddp.on('logoutGuest', chatId => {
      super.log('[DEBUG] Logout: ' + chatId);

      this.removeGuest(chatId);
    });
  }

  addGuest(name, email, chatId) {
    if (!this.guests[chatId]) {
      super.log(`[DEBUG] Adicionando Guest: { name: '${name}', email: '${email}', chatId: '${chatId}' } na listagem.`);

      let guest = new Guest(this.ddp, {
        name,
        email,
        chatId,
        debug: super.debug,
        token: this.token,
        host: this.host,
        downloadURL: this.downloadURL,
        department: this.department,
      });

      this.guests[chatId] = guest;

      super.log('[DEBUG] Lista de guests atualizada:\n', this.guests);
    }
  }

  getGuest(chatId) {
    return this.guests[chatId];
  }

  removeGuest(chatId) {
    super.log(`[DEBUG] Removendo Guest: ${JSON.stringify(this.guests[chatId])}`);

    delete this.guests[chatId];
    delete Store.Chat.get(chatId).context;
    // delete Store.Chat.get(chatId).context.emAtendimento;

    super.log('[DEBUG] Lista de guests atualizada:\n', this.guests);
  }
}

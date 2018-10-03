/* global Store */

import DDP from './../ddp/ddp'; // Import para autocomplete, classe vem instanciada como parâmetro no construtor
import {uniqueId} from "./../utils/unique-id";
import Base from './base';

export default class Guest extends Base {

  /**
   *
   * @param {DDP} ddp
   * @param {object} opts
   */
  constructor(ddp, opts) {
    super(opts.debug);

    this.token = opts.token;
    this.department = opts.department

    this.eventRegistered = 0;
    this.eventSentMessage = 0;
    this.eventLoadedHistory = 0;

    this.registered = false;
    this.subscribed = false;
    this.loadedHistory = false;

    this.ddp = ddp;
    this.name = opts.name;
    this.email = opts.email;
    this.chatId = opts.chatId;

    this.msgs = [];
    this.rid = uniqueId();
    this.data = '';

    this.host = opts.host;
    this.downloadURL = opts.downloadURL;

    this.firstMsg = true;

    this.register();
    this.listeningResult();
    this.subscribe();

    this.responses = [];
  }

  register() {
    super.log(`[DEBUG ] Registrando usuário como Guest no Rocket.Chat: { token: '${this.token}', name: '${this.name}', email: '${this.email}' }`);

    let params = {
      token: this.rid,
      name: this.name,
      email: this.email,
    };

    if (this.department) {
      params['department'] = this.department;
    }

    this.eventRegistered = this.ddp.method('livechat:registerGuest', [params]);
  }

  listeningResult() {
    this.ddp.on('result', message => {
      if (!message.error) {
        switch (message.id) {
          case this.eventRegistered:
            if (!this.registered) {
              super.log('[DEBUG ] Noticando evento de usuário registrado\n', message);

              this.ddp.emit('registeredGuest', this.chatId, message);
              this.registered = true;
              this.data = message.result.visitor;

              this.subscribe();
            }
            break;

          case this.eventSentMessage:
            if (this.msgs.indexOf(message._id) == -1) {
              super.log('[DEBUG ] Noticando evento de mensagem enviada para o Rocket.Chat\n', message);

              this.msgs.push(message._id);
              this.ddp.emit('msgSent', message);
            }
            break;

          case this.eventLoadedHistory:
            if (!this.loadedHistory) {
              super.log('[DEBUG ] Noticando evento de resgate das mensagens para enviar para log\n', message);
              this.loadedHistory = true;

              this.ddp.emit('loadedHistory', this.chatId, message);
            }
            break;
        }

      } else {
        console.log('[Error]', message);
      }
    });
  }

  subscribe() {
    this.ddp.on('msgSent', () => {
      if ( !this.subscribed ) {
        super.log(`[DEBUG ] Incluindo client para a sala de atendimento do guest: RID: ${this.rid} CHATID: ${this.chatId}`);

        this.subscribed = true;
        this.ddp.sub('stream-room-messages', [this.rid, false]);
      }
    });
  }

  sendMsg(txtMsg) {
    super.log(`[DEBUG ] Enviando mensagem para o Rocket.Chat: RID: ${this.rid} CHATID: ${this.chatId}\n`, txtMsg);

    const msgId = uniqueId();
    this.eventSentMessage = this.ddp.method('sendMessageLivechat', [{
      _id: msgId,
      rid: this.rid,
      msg: txtMsg,
      token: this.data.token,
    }]);
  }

  receiveResponse() {
    this.ddp.on('changed', (msgObj) => {
      const response = msgObj.fields.args[0];

      if (
        msgObj.collection === 'stream-room-messages' &&
        msgObj.fields.args[0].rid === this.rid &&
        this.responses.indexOf(response._id) == -1 &&
        response.u._id != this.data._id &&
        response.t != "uj" && response.t != "ul"
      ) {
        this.responses.push(response._id);

        if (response.attachments && response.attachments.length > 0 && response.attachments[0].title.indexOf(this.chatId.replace('@c.us', '')) > -1 ) {
          return;
        }

        if (response.attachments && response.attachments.length > 0) {
          super.log(`[DEBUG ] Enviando arquivo para usuário. RID: ${this.rid} CHATID: ${this.chatId}`);

          const attachment = response.attachments[0];
          const file = response.file;

          let fileURL = `${this.host}${attachment.title_link}`;
          fileURL = encodeURIComponent(fileURL);

          fetch(`${this.downloadURL}/${fileURL}`)
            .then(response => response.json())
            .then(response => {
              let caption = file.name;
              if (file.type.indexOf('image') !== -1) {
                caption = attachment.description;
              } else {
                Store.Chat.get(this.chatId).sendMessage(attachment.description);
              }

              window.WAPI.sendMedia(
                response.base64,
                file.type,
                this.chatId,
                file.name,
                caption,
              );
            });
        }

        const botState = ['promptTranscript', 'connected'];
        if (botState.indexOf(response.msg) === -1) {
          super.log(`[DEBUG ] Enviando mensagem para usuário. RID: ${this.rid} CHATID: ${this.chatId}`);

          Store.Chat.get(this.chatId).sendMessage(response.msg);
        } else {
          super.log(`[DEBUG ] Notificando encerramento de chat vindo do atendente para usuário. RID: ${this.rid} CHATID: ${this.chatId}`);

          this.eventLoadedHistory = this.ddp.method('loadHistory', [
            this.rid,
            null,
          ]);

          this.ddp.emit('logoutGuest', this.chatId);
        }
      }
    })
  }
}

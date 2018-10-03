'use strict'

import { parseObject } from '../utils/parse-object';
import Client from './client';

export class RocketChat {
  constructor () {
    const script = document.getElementById('bundle.app-script');
    this.config = {};

    Object.assign(this.config, script.dataset);

    if (!this.config.rocketchat || this.config.rocketchat.username || this.config.rocketchat.password || this.config.rocketchat.host) {
      if (this.config.debug) console.log('No Rocket.Chat configuration found.');
      throw 'No Rocket.Chat configuration found.';
    }

    this.config = parseObject(this.config)

    this.client = new Client({
      debug: this.config.debug,
      username: this.config.rocketchat.username,
      password: this.config.rocketchat.password,
      host: this.config.rocketchat.host,
      useSSL: this.config.rocketchat.usessl,
      department: this.config.departament,
    });

    this.client.init();
  }

  init() {
    window.Store.Msg.on('add', (newMessage) => {
      if (newMessage && newMessage.isNewMsg && !newMessage.isSentByMe) {
        this.sendToRocketChat(newMessage.chat.id._serialized, newMessage.body);
      }
    });
  }

  sendToRocketChat(chatId, txtMsg) {
    const initialDataID = this.client.ddp.method('livechat:getInitialData', [this.department]);

    this.client.ddp.on('result', message => {
      if (message.id === initialDataID) {
        if(message.result.online) {

          if (typeof chatId === 'object') chatId = chatId._serialized;

          const chat = Store.Chat.get(chatId);
          const id = chatId.replace('@c.us', '');

          if (!this.client.getGuest(chatId)) {
            if (this.config.debug) console.log(`[DEBUG] Registering user as guest on Rocket.Chat. User: ${chat.contact.notifyName}`);

            this.client.addGuest(
              chat.contact.notifyName,
              `${id}@rocketchat-whatsapp.com`,
              chatId
            );

            this.client.ddp.on('registeredGuest', (chatId, message) => {
              if (chatId === chatId) {
                if (this.config.debug) console.log(`[DEBUG] Sending message to start the service chat in Rocket.Chat and initiate listening for user responses. User: ${chat.contact.notifyName}`);

                this.client.getGuest(chatId).sendMsg(txtMsg);
                this.client.getGuest(chatId).receiveResponse();
              }
            });
          } else {
            if (this.config.debug) console.log(`[DEBUG] Sending message to Rocket.Chat. User: ${chat.contact.notifyName}`);
            this.client.getGuest(chatId).sendMsg(txtMsg);
          }

        } else {
          if (this.config.debug) console.log('[DEBUG] No online attendants at Rocket.Chat');
          Store.Chat.get(chatId).sendMessage('Sorry, no online attendants.');
        }
      }
    });
  }
}

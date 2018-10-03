var config = {
  debug: true,
  waitTime: 10,
  rocketchat: {
    usessl: false,
    host: 'localhost:3000',
    department: '',
    username: 'bot',
    password: '12345678',
  },
};

var isCSPDisabled = false;

var whatsAppUrl = "https://web.whatsapp.com/";
var newTabUrl = "chrome://newtab/";

var isBackgroundPageLoaded = false;
var whatsAppTabs = [];

var requestRules = [
  {
    'data': {
      'name': 'Origin',
      'value': 'http://evil.com/'
    },
    'mandatory': true,
    'fn': null
  },
  {
    'data': {
      'name': 'Access-Control-Request-Headers',
      'value': null
    },
    'mandatory': false,
    'fn': function (rule, header, details) {
      if(accessControlRequests[details.requestId] === void 0){
        accessControlRequests[details.requestId] = {};
      }
      accessControlRequests[details.requestId].headers = header.value;
    }
  }
];

var responseRules = [
  {
    'data': {
      'name': 'Access-Control-Allow-Headers',
      'value': null
    },
    'mandatory': true,
    'fn': function (rule, header, details) {
      if(accessControlRequests[details.requestId] !== void 0){
        header.value = accessControlRequests[details.requestId].headers;
      }
    }
  },
  {
    'data': {
      'name': 'Access-Control-Allow-Credentials',
      'value': 'true'
    },
    'mandatory': false,
    'fn': null
  },
  {
    'data': {
      'name': 'Access-Control-Allow-Methods',
      'value': 'POST, GET, OPTIONS, PUT, HEAD, DELETE'
    },
    'mandatory': true,
    'fn': null
  },
  {
    'data': {
      'name': 'Allow',
      'value': 'POST, GET, OPTIONS, PUT, HEAD, DELETE'
    },
    'mandatory': true,
    'fn': null
  },
];

var requestListener = function (details) {
  if (!isCSPDisabled) {
    return;
  }

  requestRules.forEach(function (rule) {
    var flag = false;

    details.requestHeaders.forEach(function (header) {
      if (header.name === rule.data.name) {
        flag = true;
        if (rule.fn) {
          rule.fn.call(null, rule, header, details);
        } else {
          header.value = rule.data.value;
        }
      }
    });

    if (!flag && rule.mandatory) {
      if(rule.data.value){
        details.requestHeaders.push(rule.data);
      }
    }
  });

  return {
    requestHeaders: details.requestHeaders
  };
};

var responseListener = function (details) {
  if (!isCSPDisabled) {
    return;
  }

  var headers = details.responseHeaders;

  for (var i = 0; i < headers.length; i++) {
    if ('content-security-policy' === headers[i].name.toLowerCase()) {
      headers[i].value = "default-src 'self' * 'unsafe-inline' 'unsafe-eval' data: blob:; report-uri *; script-src 'self' 'unsafe-eval' *; connect-src 'self' * data: blob:; img-src * data: blob:; style-src 'self' 'unsafe-inline' *; font-src 'self' data: *; media-src 'self' * blob: mediastream:; child-src 'self' * blob: ";
      break;
    }
  }

  var flag;
  for (var j = 0; j < responseRules; j++) {
    flag = false;

    for (var i; i < headers; i++) {
      if (headers[i].name === responseRules[j].data.name) {
        flag = true;

        if (responseRules[j].fn) {
          responseRules[j].fn.call(null. responseRules[j].data, headers[i], details);

        } else {
          if (responseRules[j].data.value) {
            headers[i].value = responseRules[j].value;
          }
        }
      }
    }

    if (!flag && responseRules[j].mandatory) {
      if (responseRules[j].fn) {
        responseRules[j].fn.call(null, responseRules[j].data,  responseRules[j].data, details)
      }

      if (responseRules[j].data.value) {
        headers.push(responseRules[j].data)
      }
    }
  }

  return {
    responseHeaders: headers
  };
};

chrome.webRequest.onHeadersReceived.removeListener(responseListener);
chrome.webRequest.onBeforeSendHeaders.removeListener(requestListener);

chrome.webRequest.onHeadersReceived.addListener(responseListener, {
  urls: ['*://web.whatsapp.com/*'],
  types: ["main_frame", "sub_frame", "xmlhttprequest"]
}, ['blocking', 'responseHeaders']);

chrome.webRequest.onBeforeSendHeaders.addListener(requestListener, {
  urls: ['*://web.whatsapp.com/*'],
  types: ["main_frame", "sub_frame", "xmlhttprequest"]
}, ['blocking', 'requestHeaders']);

updateTabs(function () {
  if (whatsAppTabs.length == 0) {
    loadBackgroundPage();

  } else if (whatsAppTabs.length > 1) {
    closeAllTabsBut(whatsAppTabs[whatsAppTabs.length - 1]);
  }
});

chrome.runtime.onInstalled.addListener(function (details) {
  var defaults = {
    debug: true,
    waitTime: 10,
    rocketchat: {
      usessl: false,
      host: 'localhost:3000',
      department: '',
      username: 'bot',
      password: '12345678',
    },
  }

  chrome.storage.sync.set(defaults, function() {});

  if (details.reason == 'install') {
    updateTabs(function () {});
  }
});

function closeAllTabs() {
  return closeAllTabsBut(-1);
}

function closeAllTabsBut(tabToKeep) {
  var removedTabs = [];

  for (var i = whatsAppTabs.length - 1; i >= 0; i--) {
    var whatsAppTab = whatsAppTabs[i];

    if (whatsAppTab != tabToKeep) {
      removedTabs.push(whatsAppTabs.splice(i, 1)[0]);
    }
  }

  if (removedTabs.length > 0) {
    chrome.tabs.remove(removedTabs);
  }

  return removedTabs.length;
}

function loadBackgroundPage() {
  if (!isBackgroundPageLoaded) {
    isBackgroundPageLoaded = true;

    var randomParam = '?watRnd=' + Math.random();
    document.body.innerHTML = '<iframe width="1000" height="10000" src="' + whatsAppUrl + randomParam + '"></iframe>';
  }
}

function unloadBackgroundPage() {
  if (isBackgroundPageLoaded) {
    isBackgroundPageLoaded = false;

    document.body.innerHTML = '';
  }
}

function updateTabs(callback) {
  chrome.tabs.query({ url: whatsAppUrl + "*" }, function (tabs) {
    whatsAppTabs = [];

    for (var i = 0; i < tabs.length; i++) {
      whatsAppTabs.push(tabs[i].id);
    }

    callback();
  });
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (typeof changeInfo.url == 'string') {
    if (changeInfo.url.indexOf(whatsAppUrl) == 0 && whatsAppTabs.indexOf(tabId) == -1) {
      whatsAppTabs.push(tabId);
      closeAllTabsBut(tabId);
      unloadBackgroundPage();

    } else if (changeInfo.url.indexOf(whatsAppUrl) != 0 && whatsAppTabs.indexOf(tabId) > -1) {
      whatsAppTabs.splice(whatsAppTabs.indexOf(tabId), 1);
      loadBackgroundPage();
    }
  }
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
  if (whatsAppTabs.indexOf(tabId) > -1) {
    whatsAppTabs.splice(whatsAppTabs.indexOf(tabId), 1);
    loadBackgroundPage();
  }
});

chrome.runtime.onMessage.addListener(function (messageEvent, sender, callback) {
  if (messageEvent.name == "getIsBackgroundPage") {
    callback(sender.tab == undefined);
  }
});

var updateUI = function () {
  var iconName  = isCSPDisabled ? 'on' : 'off';
  var title     = isCSPDisabled ? chrome.i18n.getMessage('sleepingMsg') : chrome.i18n.getMessage('runningMsg');
  var color     = isCSPDisabled ? '#4688F1' : '#A42F20';

  chrome.browserAction.setIcon({ path: "app/assets/img/icon38-" + iconName + ".png" });
  chrome.browserAction.setTitle({ title: title });

  chrome.browserAction.setBadgeText({text: iconName.toLocaleUpperCase()});
  chrome.browserAction.setBadgeBackgroundColor({color: color});

  chrome.storage.sync.get('debug', function(data) { config.debug = data.debug; });
  chrome.storage.sync.get('waitTime', function(data) { config.waitTime = data.waitTime; });
  chrome.storage.sync.get('rocketchat', function(data) { config.rocketchat = data.rocketchat; });

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    Object.assign(config, {isOnline: isCSPDisabled});

    if (request.task == "isOnline") sendResponse(config);
  });
};

chrome.browserAction.onClicked.addListener(function(tab) {
  isCSPDisabled = !isCSPDisabled;

  if (isCSPDisabled) {
    chrome.browsingData.remove({}, {"serviceWorkers": true}, function () {});
  }

  updateUI();

  if ( isCSPDisabled ) {
    var tabId;
    chrome.tabs.query({ url: whatsAppUrl + '*', lastFocusedWindow: true }, function (tabs) {
      if  (tabs.length > 0 ) {
        chrome.tabs.update(tabs[0].id, { active: true });
        tabId = tabs[0].id;

      } else if ( tab.url == newTabUrl ) {
        chrome.tabs.update(tab.id, { url: whatsAppUrl });
        tabId = tab.id;

      } else {
        chrome.tabs.create({ url: whatsAppUrl });
        tabId = chrome.tabs.id;
      }
    });

  } else {
    closeAllTabs();
    unloadBackgroundPage();
  }
});

updateUI();

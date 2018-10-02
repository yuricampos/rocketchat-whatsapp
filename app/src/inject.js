// HACKING INJECTION
function onLoad() {
  this.remove();
}

/**
 * Method to get all url params and create an object
 *
 * @param {string} url
 */
function getAllUrlParams(url) {
  var queryString = url.split('?')[1];
  var obj = {};

  if (queryString) {
    queryString = queryString.split('#')[0];
    var arr = queryString.split('&');

    for (var i=0; i<arr.length; i++) {
      var a = arr[i].split('=');

      var paramNum = undefined;
      var paramName = a[0].replace(/\[\d*\]/, function(v) {
        paramNum = v.slice(1,-1);
        return '';
      });

      var paramValue = typeof(a[1])==='undefined' ? true : a[1];

      paramName = paramName.toLowerCase();
      paramValue = paramValue.toLowerCase();

      if (obj[paramName]) {
        if (typeof obj[paramName] === 'string') {
          obj[paramName] = [obj[paramName]];
        }

        if (typeof paramNum === 'undefined') {
          obj[paramName].push(paramValue);
        } else {
          obj[paramName][paramNum] = paramValue;
        }
      } else {
        obj[paramName] = paramValue;
      }
    }
  }

  return obj;
}

/**
 * Method to inject codes as <script> document into Whatsapp™ web page
 *
 * @param {object} Config
 */
function injectScripts(Config) {
  if ( Config.isDebug ) {
    console.log('Waiting page load complete to inject the scripts.');

    var second = 0;
    var wait = setInterval(function() {
      console.log(++second+'s');

      if (second === Config.waitTime) clearInterval(wait);
    }, 1000);
  }

  var scripts = [
    "chrome-extension://__MSG_@@extension_id__/app/assets/js/whatsapp.js",

    "chrome-extension://__MSG_@@extension_id__/app/assets/js/rocket.chat/guest.js",
    "chrome-extension://__MSG_@@extension_id__/app/assets/js/rocket.chat/client.js",
    "chrome-extension://__MSG_@@extension_id__/app/assets/js/rocket.chat/main.js",
  ];

}


/**
 * Integrating the inject script with background plugin script to load the plugin configuration
 */
chrome.runtime.sendMessage({task: "isOnline"}, function(response) {
  // Load only if plugin is On
  if (response.isOnline) {
    if ( response.isDebug ) console.log('Injecting Configuration:\n', response);

    injectScripts(response);
  }
});

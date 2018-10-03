// HACKING INJECTION
function onLoad() {
  this.remove();
}

/**
 * Method to inject codes as <script> document into Whatsapp™ web page
 *
 * @param {object} Config
 */
function injectScripts(Config) {
  if ( Config.debug ) {
    console.log('Waiting page load complete to inject the scripts.');

    var second = 0;
    var wait = setInterval(function() {
      console.log(++second+'s');

      if (second === Config.waitTime) clearInterval(wait);
    }, 1000);
  }

  var keys = Object.keys(Config);

  setTimeout(function() {

    [
      'chrome-extension://'+chrome.i18n.getMessage('@@extension_id')+'/app/assets/js/whatsapp.js',
      'chrome-extension://'+chrome.i18n.getMessage('@@extension_id')+'/app/assets/js/bundle.app.js',
    ]
    .map(js => {
      var name = js.split('/');
      name = name[name.length - 1].replace('.js', '');

      var s = document.createElement('script');
      s.src = js;
      s.id = `${name}-script`;

      keys.forEach(function (key) {
        var val = Config[key];

        switch(typeof val) {
          case 'boolean': val = val ? '1' : '0';
            break;
          case 'object': val = JSON.stringify(val);
            break;
        }

        s.dataset[key] = val;
      });

      s.setAttribute('async', '');
      s.onload = onLoad;

      (document.body || document.documentElement).appendChild(s);
    });

  }, Config.waitTime * 1000);
}


/**
 * Integrating the inject script with background plugin script to load the plugin configuration
 */
chrome.runtime.sendMessage({task: "isOnline"}, function(response) {
  // Load only if plugin is On
  if (response.isOnline) {
    if ( response.debug ) console.log('Injecting Configuration:\n', response);

    injectScripts(response);
  }
});

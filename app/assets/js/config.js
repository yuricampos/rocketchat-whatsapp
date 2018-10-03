(function() {
  [...document.querySelectorAll('.nav-link')].map(tab => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();

      [...document.querySelectorAll('.nav-link')].map(el => {
        el.classList.remove('active');
      });

      tab.classList.add('active');

      [...document.querySelectorAll('#tabContent .tab-pane')].map(el => {
        el.classList.remove('show');
        el.classList.remove('active');
      });

      const id = tab.href.split('#')[1];

      document.getElementById(id).classList.add('show');
      document.getElementById(id).classList.add('active');
    });
  });

  document.getElementById('restore').addEventListener('click', (event) => {
    event.preventDefault();

    [...document.querySelectorAll('.inativo')].map(r => {
      r.click();
    });

    document.getElementById('waitTime').value = '';

    document.getElementById('rocketchat.host').value = '';
    document.getElementById('rocketchat.department').value = '';
    document.getElementById('rocketchat.username').value = '';
    document.getElementById('rocketchat.password').value = '';
  });

  function showAlerta(msg, type) {
    var elMsg = document.getElementById('msg');

    elMsg.innerHTML = msg;
    elMsg.classList.add(`alert-${type}`);

    setTimeout(function() {
      elMsg.classList.remove(`alert-${type}`);
      elMsg.innerHTML = `&nbsp;`;
    }, 3000);
  }

  document.getElementById('save').addEventListener('click', (event) => {
    event.preventDefault();

    const saveData = {
      debug: (document.getElementById('debug').value === '1'),
      waitTime: +document.getElementById('waitTime').value,
      rocketchat: {
        usessl: (document.getElementById('rocketchat.usessl').value === '1'),
        host: document.getElementById('rocketchat.host').value,
        department: document.getElementById('rocketchat.department').value,
        username: document.getElementById('rocketchat.username').value,
        password: document.getElementById('rocketchat.password').value,
      },
    };

    chrome.storage.sync.set(saveData, function() {
      showAlerta('Configuration saved!', 'success');
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get({
      debug: false,
      waitTime: 10,
      rocketchat: {
        usessl: false,
        host: '',
        department: '',
        username: '',
        password: '',
      },
    }, function(items) {
      document.getElementById('waitTime').value = items.waitTime;

      document.getElementById('rocketchat.host').value = items.rocketchat.host;
      document.getElementById('rocketchat.department').value = items.rocketchat.department;
      document.getElementById('rocketchat.username').value = items.rocketchat.username;
      document.getElementById('rocketchat.password').value = items.rocketchat.password;

      const debug = (items.debug) ? '1' : '0';
      const usessl = (items.rocketchat.usessl) ? '1' : '0';

      [
        'a[data-toggle="debug"][data-title="'+debug+'"]',
        'a[data-toggle="rocketchat.usessl"][data-title="'+usessl+'"]',
      ]
        .map((selector) => {
          document.querySelector(selector).click();
        });
    });
  });

  [...document.querySelectorAll('.btn-group a')].map(btn => {
    btn.addEventListener('click', function(event) {
      event.preventDefault();

      const sel = this.dataset.title;
      const tog = this.dataset.toggle;

      [...btn.parentElement.querySelectorAll('a[data-toggle="'+tog+'"]')].map(el => {
        el.classList.remove('active');
        el.classList.remove('notActive');

        el.classList.add('notActive');
      });

      document.getElementById(tog).value = sel;
      btn.classList.remove('notActive');
      btn.classList.add('active');
    });
  });
})();

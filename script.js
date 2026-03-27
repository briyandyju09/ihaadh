// APPS

const APP_REGISTRY = {
    photobooth: {
        title: 'Photobooth',
        winId: 'win-photobooth',
        onOpen: initPhotobooth,
    },
}    

// CLOCK

function updateClock() {
  const clockEl = document.getElementById('topbar-clock');
  const now = new Date();

  const date = now.toLocaleDateString('en-GB', {  
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  });

  const time = now.toLocaleTimeString('en-GB', { 
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  clockEl.textContent = `${date},  ${time}`;
}
updateClock();
setInterval(updateClock, 1000);

// OPEN APP

let zTop = 200;

function openApp(appKey) {
  const app = APP_REGISTRY[appKey];
  if (!app) { console.warn(`myOS: unknown app "${appKey}"`); return; }

  const win = document.getElementById(app.winId);
  if (!win) { console.warn(`myOS: window #${app.winId} not found`); return; }

  if (win.classList.contains('window-open')) {
    focusWin(win);
    return;
  }

  const desktop = document.getElementById('desktop');
  const dw = desktop.clientWidth;
  const dh = desktop.clientHeight;
  const ww = win.offsetWidth  || parseInt(win.style.width)  || 420;
  const wh = win.offsetHeight || parseInt(win.style.height) || 320;

  const jitter = () => (Math.random() - 0.5) * 60;
  win.style.left = `${Math.max(10, (dw - ww) / 2 + jitter())}px`;
  win.style.top  = `${Math.max(10, (dh - wh) / 2 + jitter())}px`;
  win.classList.add('window-open');
  focusWin(win);

  if (typeof app.onOpen === 'function') {
    app.onOpen(win);
  }
}  

function closeApp(appKey) {
  const app = APP_REGISTRY[appKey];
  if (!app) return;
  const win = document.getElementById(app.winId);
  if (!win) return;
  win.classList.remove('window-open');
}

function focusWin(win) {
  zTop += 1;
  win.style.zIndex = zTop;
  document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
  win.classList.add('focused');
}

document.querySelectorAll('.desktop-icon').forEach(icon => {
  icon.addEventListener('dblclick', () => {
    const appKey = icon.dataset.app;
    openApp(appKey);
  });
});

document.querySelectorAll('.desktop-icon').forEach(icon => {
  icon.addEventListener('click', () => {
    const appKey = icon.dataset.app;
    openApp(appKey);
  });
});

document.querySelectorAll('.window').forEach(win => {
  win.addEventListener('mousedown', () => focusWin(win));
});


//  PHOTO BOOTH


const CUTE_EMOJIS = ['🤍','👻','🐰','🐢','🦎','🐛','🧟‍♀️','🎲','🔊','🎹','🧪','🖇️','🧃','🍀','☃️','💚'];

let pbStream = null;
let pbPhotos = [];
let pbInitialised = false

function initPhotobooth() {
  if (pbInitialised) return;
  pbInitialised = true;
    
  const video   = document.getElementById('pb-video');
  const startBtn = document.getElementById('pb-start-btn');
  const saveBtn  = document.getElementById('pb-save-btn');
  const canvas   = document.getElementById('pb-canvas');
  const countdown = document.getElementById('pb-countdown');

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      pbStream = stream;
      video.srcObject = stream;
    })
    .catch(err => {
      console.error('Photobooth: camera error', err);
      countdown.textContent = '📷 no camera';
      countdown.classList.remove('hidden');
    });

  startBtn.addEventListener('click', () => runPhotoStrip(video, canvas, countdown, startBtn, saveBtn));
  saveBtn.addEventListener('click',  () => downloadStrip(canvas));
}


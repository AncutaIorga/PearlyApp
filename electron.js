const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  // PRUEBA ESTA RUTA DIRECTA (Asegúrate de que esta carpeta existe)
  // Si tu build de Angular crea 'browser', déjalo así. Si no, quita '/browser'
  const startUrl = path.join(__dirname, 'dist/pearly-app/browser/index.html');
  
  console.log("Intentando cargar:", startUrl);
  win.loadFile(startUrl);

  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
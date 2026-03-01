const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    // El icono en producción debe tomarse de la carpeta compilada (dist) o recursos
    icon: path.join(__dirname, 'dist/pearly-app/browser/assets/icons/icon-512x512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Construimos la ruta al index.html
  // Importante: Verifica si tu carpeta es 'dist/pearly-app/browser/index.html' 
  // o simplemente 'dist/pearly-app/index.html'
  const indexPath = path.join(__dirname, 'dist/pearly-app/browser/index.html');

  mainWindow.loadURL(
    url.format({
      pathname: indexPath,
      protocol: 'file:',
      slashes: true
    })
  );

  // SIEMPRE deja esto activado mientras arreglas la pantalla blanca
  // para ver los errores con Ctrl+Shift+I
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
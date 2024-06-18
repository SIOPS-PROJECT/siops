const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron/main');
const path = require('path')
const helper = require('./website.js');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, './APIS/preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
      enableRemoteModule: true
    },
    title: "ACAPE Software",
    icon: "./icon.jpg"
  })

  // win.setMenu(null)

  win.loadFile('./views/main.html')
}

function imprimirFactura (url) {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, './APIS/preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
      enableRemoteModule: true
    },
    title: "ACAPE Software",
  })
  win.setMenu(null)

  win.loadFile(`http://localhost:9000/${url}`)
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
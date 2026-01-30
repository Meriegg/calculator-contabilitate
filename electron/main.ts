import type { TMemory } from '../shared/types.js';
import { fileURLToPath } from "url";
import { app, Tray, Menu, BrowserWindow, globalShortcut, screen, ipcMain, clipboard } from "electron";
import path from "path";

let tray: Tray | null = null;
let memory: TMemory = {};

const generalPadding = 4;
const mainWindowWidth = 550;
const variableWindowWidth = 280;

let isOpen = false;
let varWindowHardClosed = false;

let calcWin: BrowserWindow | null = null;
let varWin: BrowserWindow | null = null;

const isDev = !app.isPackaged;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createCalcWindow() {
  calcWin = new BrowserWindow({
    width: mainWindowWidth,
    height: 90,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: "#00000000",
    backgroundMaterial: "mica",
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    calcWin.loadURL("http://localhost:5173");
    calcWin.webContents.openDevTools({ mode: "detach" });
  } else {
    calcWin.loadFile(path.join(process.resourcesPath, "dist", "index.html"))
  }

  calcWin.on("close", (e) => {
    e.preventDefault();
    isOpen = false;
    renderCalcWindow();
    renderVarWindow();
  })
}

function createVariableWindow() {
  varWin = new BrowserWindow({
    width: variableWindowWidth,
    height: 90,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: "#00000000",
    backgroundMaterial: "mica",
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    varWin.loadURL("http://localhost:5173/#/var");
    varWin.webContents.openDevTools({ mode: "detach" });
  } else {
    varWin.loadFile(path.join(process.resourcesPath, "dist", "index.html"), {
      hash: "/var"
    });
  }

  // varWin.on("blur", () => {
  //   console.log("blur var win")
  //   varWin?.hide();
  // });
  varWin.on("close", (e) => {
    e.preventDefault();
  });
}

function renderCalcWindow() {
  if (!calcWin) return;

  if (!isOpen) {
    calcWin.hide();
    return;
  }

  const { width } = screen.getPrimaryDisplay().workAreaSize;
  calcWin.setPosition(Math.round(width / 2 - (mainWindowWidth / 2)), 40, false);

  calcWin.show();
  calcWin.focus();

  calcWin.webContents.send("ui:focusInput");
}

function renderVarWindow() {
  if (!varWin) return;

  if (varWindowHardClosed || !Object.keys(memory)?.length) {
    varWin.hide();
    return;
  }

  if (!isOpen && !Object.keys(memory)?.length) {
    varWin.hide();
    return;
  }


  const { width } = screen.getPrimaryDisplay().workAreaSize;
  varWin.setPosition(width - variableWindowWidth - generalPadding, 0 + generalPadding, false);

  varWin.show();
}


const createTray = () => {
  tray = new Tray(
    isDev ? path.join(__dirname, "../assets/cc-ico.ico") : path.join(process.resourcesPath, "assets/cc-ico.ico")
  );
  const menu = Menu.buildFromTemplate([
    { label: "Deschide", click: () => { isOpen = true; renderCalcWindow(); renderVarWindow(); } },
    { label: "Inchide", click: () => app.quit() },
  ]);
  tray.setToolTip("Calculator Contabilitate");
  tray.setContextMenu(menu);

  tray.on("click", () => { isOpen = true; renderCalcWindow(); renderVarWindow(); });
}

app.whenReady().then(() => {
  createCalcWindow();
  createVariableWindow();
  createTray();

  globalShortcut.register("Alt+Space", () => {
    isOpen = !isOpen;
    renderVarWindow();
    renderCalcWindow();
  });

  ipcMain.handle("state:setMemory", (_event, newMemory: TMemory) => {
    console.log(newMemory);
    memory = newMemory;

    varWin?.webContents.send("state:memInvalidated")

    renderVarWindow();
  });

  ipcMain.handle("ui:hide", () => {
    isOpen = false;
    renderCalcWindow();
    renderVarWindow();
  });

  ipcMain.handle("ui:show", () => {
    isOpen = true;
    renderCalcWindow();
    renderVarWindow();
  });

  ipcMain.handle("ui:hardToggleVarWindow", () => {
    varWindowHardClosed = !varWindowHardClosed;
    console.log("vwhc");
    console.log(varWindowHardClosed);
    renderVarWindow();
  });

  ipcMain.handle("ui:setHeight", (_event, height: number) => {
    const { height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    const maxHeight = screenHeight * 0.8;
    const requestedHeight = height + generalPadding;

    const heightToSet = parseInt(Math.min(requestedHeight, maxHeight).toFixed(0));

    calcWin?.setContentSize(mainWindowWidth, heightToSet)
  });

  ipcMain.handle("ui:setVarHeight", (_event, height: number) => {
    const { height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    const maxHeight = screenHeight * 0.5;
    const requestedHeight = Math.max(height + generalPadding, 60);

    const heightToSet = parseInt(Math.min(requestedHeight, maxHeight).toFixed(0));

    varWin?.setContentSize(variableWindowWidth, heightToSet)
  });

  ipcMain.handle("ui:copyToClipboard", (_event, text: string) => {
    clipboard.writeText(text);
  });

  ipcMain.handle("activateAutoStart", () => {
    app.setLoginItemSettings({
      openAtLogin: true,
    })
  });

  ipcMain.handle("deactivateAutoStart", () => {
    app.setLoginItemSettings({
      openAtLogin: false
    })
  })

  ipcMain.handle("state:getMemory", () => ({ newMemory: memory }))
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});


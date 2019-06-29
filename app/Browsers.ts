export { };

import { BrowserWindow, dialog, shell, Menu, WebContents, ipcMain } from "electron";
import { Licence } from "./Licence"
import { INoxunoteWindow, INoxunoteApp, ISettingsWindow } from "./types";
import { DataBase } from "./DataBase"

const fs = require('fs-extra')
const homedir = require('os').homedir()

/** Creates folder if not exists
 * @param {string} dirPath the new folder path
 */
function mkdirSync(dirPath: string) {
    try {
        fs.mkdirSync(dirPath);
    } catch (err) {
        if (err.code !== 'EEXIST') throw err
    }
}

class MainWindow implements INoxunoteWindow {
    allowClose: boolean;
    browserWindow: BrowserWindow;
    webContents: WebContents;
    constructor() {
        this.allowClose = false
        this.browserWindow = new BrowserWindow({
            width: 950,
            height: 600,
            minHeight: 200,
            titleBarStyle: "hidden",
            center: false,
            movable: true,
            frame: false,
            minWidth: 200,
            transparent: false,
            backgroundColor: '#1E232A',
            autoHideMenuBar: true,
        })
        // Shortcut to webContents (retrocompatibility)
        this.webContents = this.browserWindow.webContents;
        this.browserWindow.loadURL(`file://${__dirname}/views/mainWindow/index.html`); // Loads the renderer processs
        // Creating NoxuNote working directories if not exists
        mkdirSync(homedir + '/NoxuNote');
        mkdirSync(homedir + '/NoxuNote/notes');
        this.browserWindow.on('close', (e: { preventDefault: () => void; }) => {
            if (!this.allowClose) {
                e.preventDefault()
                this.browserWindow.webContents.send('electron_request_close')
            }
        })
    }
}

class MainDrawWindow implements INoxunoteWindow {
    allowClose: boolean;
    browserWindow: BrowserWindow;
    webContents: WebContents;
    constructor(url: any) {
        this.browserWindow = new BrowserWindow({
            width: 950,
            height: 600,
            titleBarStyle: "default",
            center: false,
            movable: true,
            frame: true,
            transparent: false,
            backgroundColor: '#1E232A',
            resizable: false,
            autoHideMenuBar: true,
        })
        this.browserWindow.loadURL(`file://${__dirname}/views/mainDrawWindow/draw.html`) // Loads the renderer process
        if (url) this.browserWindow.webContents.once('dom-ready', () => this.load(url));
    }

    load(url: any) {
        this.browserWindow.webContents.send('loadImage', url)
    }

}

class MainOutputWindow implements INoxunoteWindow {
    allowClose: boolean;
    browserWindow: BrowserWindow;
    webContents: WebContents;
    constructor() {
        this.browserWindow = new BrowserWindow({
            width: 640,
            height: 480,
            titleBarStyle: "default",
            center: false,
            movable: true,
            frame: true,
            transparent: false,
            backgroundColor: '#FFFFFF',
            resizable: true,
            show: true
        })
        this.browserWindow.loadURL(`file://${__dirname}/views/outputWindow/outputWindow.html`)
    }
}

class SettingsWindow implements INoxunoteWindow, ISettingsWindow {
    allowClose: boolean;
    browserWindow: BrowserWindow;
    constructor(key?: string) {
        this.browserWindow = new BrowserWindow({
            width: 1024,
            height: 600,
            titleBarStyle: "default",
            movable: true,
            frame: true,
            backgroundColor: '#1E232A',
            //resizable: false,
            autoHideMenuBar: true
        })
        this.browserWindow.loadURL(`file://${__dirname}/views/settingsWindow/settings.html`)
    }
    /**
     * Change l'onglet visualisé dans la fenetre
     * @param {String} key L'onglet à atteindre
     */
    switch(key: string) {
        this.browserWindow.webContents.send('switch', key)
    }
}

class PrePrintWindow implements INoxunoteWindow {
    allowClose: boolean;
    browserWindow: BrowserWindow;
    webContents: WebContents;
    constructor(content: any) {
        this.browserWindow = new BrowserWindow({
            width: 1200,
            height: 720,
            titleBarStyle: "default",
            movable: true,
            frame: true,
            backgroundColor: '#FFFFFF',
            //resizable: false,
            autoHideMenuBar: true
        })
        this.browserWindow.loadURL(`file://${__dirname}/views/prePrintWindow/preprint.html`)
        if (content) this.browserWindow.webContents.once('dom-ready', () => this.setNote(content));
    }
    setNote(note: any) {
        this.browserWindow.webContents.send('setNote', note)
    }
}

class NoxuNoteApp implements INoxunoteApp {
    licence: Licence;
    mainWindow: INoxunoteWindow;
    db: DataBase;
    mainDrawWindow: any;
    mainOutputWindow: INoxunoteWindow;
    settingsWindow: ISettingsWindow;
    prePrintWindow: INoxunoteWindow;

    /**
     * Instancie l'application, la fenêtre principale, les BDD.
     * @param {boolean} DEBUG mode débogage
     */
    constructor(DEBUG: any) {
        this.createDb()
        this.createMainWindow()
        this.licence = new Licence(this, DEBUG)
    }
    quit() {
        this.mainWindow.allowClose = true
        this.mainWindow.browserWindow.close()
        process.exit(1)
    }
    createDb() {
        this.db = new DataBase()
    }
    createMainWindow() {
        this.mainWindow = new MainWindow()
        this.mainWindow.browserWindow.on('closed', (event: any) => {
            this.db.saveAllJson()
            this.mainWindow = null
        })
    }
    /**
     * Instancie la fenêtre de dessin
     * @param {number} url (optionnel) url de l'image a editer
     * d'une ligne au milieu de la note. Si pas de valeur, inséré à la fin.
     */
    createMainDrawWindow(url: any) {
        if (!this.mainDrawWindow) {
            this.mainDrawWindow = new MainDrawWindow(url)
            this.mainDrawWindow.browserWindow.on('closed', () => {
                this.mainDrawWindow = null;
            })
        }
    }
    createMainOutputWindow(caller: Electron.WebContents) {
        this.mainOutputWindow = new MainOutputWindow()
        this.mainOutputWindow.browserWindow.on('closed', () => {
            this.mainOutputWindow = null;
            if (caller) BrowserWindow.fromWebContents(caller).webContents.send('mainOutputWindowClosed')
        })
    }
    closeMainOutputWindow() {
        this.mainOutputWindow.browserWindow.close()
    }
    createSettingsWindow(key: any) {
        if (!this.settingsWindow) {
            this.settingsWindow = new SettingsWindow()
            this.settingsWindow.browserWindow.webContents.on('did-finish-load', () => {
                this.settingsWindow.switch(key)
            })
            this.settingsWindow.browserWindow.on('closed', () => {
                this.db.saveAllJson()
                this.settingsWindow = null
                this.mainWindow.browserWindow.webContents.send('updateDb')
            })
        }
    }
    createPrePrintWindow(content: any) {
        this.prePrintWindow = new PrePrintWindow(content)
        this.prePrintWindow.browserWindow.on('closed', () => {
            this.mainOutputWindow = null;
        })
    }
}

module.exports.NoxuNoteApp = NoxuNoteApp
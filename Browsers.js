
const electron = require('electron')
const { dialog } = require('electron')
const { shell } = require('electron')
const { Menu } = require('electron')
const app = electron.app;
const ipc = electron.ipcMain; // Handles asynchronous and synchronous messages sent from a renderer process (web page).
const BrowserWindow = electron.BrowserWindow;

const licenceAPI = require('./licenceAPI.js')
const parser = require("./parser.js")
const database = require("./DataBase.js")

const fs = require('fs');
const homedir = require('os').homedir();
const path = require('path');

/** Creates folder if not exists
 * @param {string} dirPath the new folder path
 */
function mkdirSync(dirPath) {
    try {
        fs.mkdirSync(dirPath);
    } catch (err) {
        if (err.code !== 'EEXIST') throw err
    }
}

class MainWindow {
    constructor() {
        this.allowClose = false
        this.browserWindow = new BrowserWindow({
            width: 950,
            height: 600,
            minHeight: 200,
            maximized: false,
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
        this.browserWindow.on('close', (e) => {
            if (!this.allowClose) {
                e.preventDefault()
                this.browserWindow.webContents.send('electron_request_close')
            }
        })
    }
}

class MainDrawWindow {
    constructor(url) {
        this.browserWindow = new BrowserWindow({
            width: 950,
            height: 600,
            maximized: true,
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
    
    load(url) {
        this.browserWindow.webContents.send('loadImage', url)
    }
    
}

class MainOutputWindow {
    constructor() {
        this.browserWindow = new BrowserWindow({
            width: 640,
            height: 480,
            maximized: true,
            titleBarStyle: "default",
            center: false,
            movable: true,
            frame: true,
            transparent: false,
            backgroundColor: '#FFFFFF',
            zoomFactor: 1,
            resizable: true,
            show: true
        })
        this.browserWindow.loadURL(`file://${__dirname}/views/outputWindow/outputWindow.html`)
    }
}

class SettingsWindow {
    constructor(key) {
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
    switch(key) {
        this.browserWindow.send('switch', key)
    }
}

class PrePrintWindow {
    constructor(content) {
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
    setNote(note) {
        this.browserWindow.send('setNote', note)
    }
}

class NoxuNoteApp {
    /**
     * Instancie l'application, la fenêtre principale, les BDD.
     * @param {boolean} DEBUG mode débogage
     */
    constructor(DEBUG) {
        this.createLicence(DEBUG)
        this.createDb()
        this.createMainWindow()
    }
    quit() {
        this.mainWindow.allowClose = true
        this.mainWindow.browserWindow.close()
        process.exit(1)
    }
    createLicence(DEBUG) {
        // Instanciation de l'objet licence, le constructeur de Licence possède un callback qui
        // renvoie l'objet lui même garantit que toutes les informations ont bien été téléchargées 
        // (ChangeLog etc.)
        this.licence = new licenceAPI.Licence((l) => {
            if (l.actualVersion != l.lastVersion) {
                // Si NoxuNote n'est pas à jour on informe l'utilisateur 4 secondes après l'ouverture
                setTimeout(()=>{
                var answer = dialog.showMessageBox({
                    type: "question",
                    buttons: ['Télécharger', 'Plus tard'],
                    detail: "Nouveautés (version " + l.lastVersion + ") : \n" + l.changeLog,
                    message: "Mise à jour disponible !"
                })
                if (answer == 0) {
                    shell.openExternal('http://noxunote.fr/prototype/#download')
                }
                }, 4000)
            }
        }, DEBUG)
    }
    createDb() {
        this.db = new database.DataBase()
    }
    createMainWindow() {
        this.mainWindow = new MainWindow()
        this.mainWindow.browserWindow.on('closed', (event) => {
            this.db.saveAllJson()
            this.mainWindow = null
        })
    }
    /**
     * Instancie la fenêtre de dessin
     * @param {number} url (optionnel) url de l'image a editer
     * d'une ligne au milieu de la note. Si pas de valeur, inséré à la fin.
     */
    createMainDrawWindow(url) {
        if (!this.mainDrawWindow) {
            this.mainDrawWindow = new MainDrawWindow(url)
            this.mainDrawWindow.browserWindow.on('closed', () => {
                this.mainDrawWindow = null;
            })
        }
    }
    createMainOutputWindow(caller) {
        this.mainOutputWindow = new MainOutputWindow()
        this.mainOutputWindow.browserWindow.on('closed', () => {
            this.mainOutputWindow = null;
            if (caller) BrowserWindow.fromWebContents(caller).send('mainOutputWindowClosed')
        })
    }
    closeMainOutputWindow() {
        this.mainOutputWindow.browserWindow.close()
    }
    createSettingsWindow(key) {
        if (!this.settingsWindow) {
            this.settingsWindow = new SettingsWindow()
            this.settingsWindow.browserWindow.webContents.on('did-finish-load', ()=>{
                this.settingsWindow.switch(key)
            })
            this.settingsWindow.browserWindow.on('closed', () => {
                this.db.saveAllJson()
                this.settingsWindow = null
                this.mainWindow.browserWindow.send('updateDb')
            })
        }   
    }
    createPrePrintWindow(content) {
        this.prePrintWindow = new PrePrintWindow(content)
        this.prePrintWindow.browserWindow.on('closed', () => {
            this.mainOutputWindow = null;
        })
    }
}

module.exports.NoxuNoteApp = NoxuNoteApp
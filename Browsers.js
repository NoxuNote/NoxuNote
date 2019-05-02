
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
        this.browserWindow.on('close', (e) => {
            var answer = dialog.showMessageBox({
                type: "question",
                buttons: ['Oui', 'Non', 'Annuler'],
                detail: "Si vous quittez sans enregistrer, le contenu présent risque d'être perdu.",
                title: "Avertissement",
                message: "Enregistrer la note ?"
            })
            if (answer == 0) {
                this.browserWindow.webContents.send('callSaveAsNoxuNote')
            } else if (answer == 2) {
                e.preventDefault()
            }
        })
        // Creating NoxuNote working directories if not exists
        mkdirSync(homedir + '/NoxuNote');
        mkdirSync(homedir + '/NoxuNote/notes');
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
    constructor(key) {
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
    }
    setNote(note) {
        this.browserWindow.send('setNote', note)
    }
}

class NoxuNoteApp {
    constructor() {
        this.note = new Array() // Stoque le contenu brut de la note
        this.note.push('@NOXUNOTE_BEGIN')
        this.mode = "new" // Stoque le mode d'édition en cours, vaut "new" ou "edit"
        this.editedContent = "" // Stoque le contenu de la div précedemment editée
        this.editedLine = 0 // Contient le numéro de ligne précedemment editée
        this.createLicence()
        this.createDb()
        this.createMainWindow()
    }
    createLicence() {
        // Instanciation de l'objet licence, le constructeur de Licence possède un callback qui
        // renvoie l'objet lui même garantit que toutes les informations ont bien été téléchargées 
        // (ChangeLog etc.)
        setTimeout(() => {
            this.licence = new licenceAPI.Licence((l) => {
                if (l.actualVersion != l.lastVersion) {
                    var answer = dialog.showMessageBox({
                        type: "question",
                        buttons: ['Télécharger', 'Plus tard'],
                        detail: "Nouveautés (version " + l.lastVersion + ") : \n" + l.changeLog,
                        message: "Mise à jour disponible !"
                    })
                    if (answer == 0) {
                        shell.openExternal('http://noxunote.fr/prototype/#download')
                    }
                }
            })
        }, 1000)
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
                this.mode = "new"
                this.mainWindow.browserWindow.webContents.send('restoreMainForm')
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
                this.settingsWindow = null
                this.mainWindow.browserWindow.send('updateDb')
            })
        }   
    }
    createPrePrintWindow() {
        this.prePrintWindow = new PrePrintWindow()
        this.prePrintWindow.browserWindow.webContents.on('did-finish-load', ()=>{
            this.prePrintWindow.setNote(this.note)
        })
        this.prePrintWindow.browserWindow.on('closed', () => {
            this.mainOutputWindow = null;
        })
    }
}

module.exports.NoxuNoteApp = NoxuNoteApp
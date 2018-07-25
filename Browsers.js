
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

class MainWindow extends BrowserWindow {
    constructor() {
        super({
            width: 950,
            height: 600,
            minHeight: 200,
            icon: './icon.png',
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
        this.loadURL(`file://${__dirname}/index.html`); // Loads the renderer processs
        this.on('close', (e) => {
            var answer = dialog.showMessageBox({
                type: "question",
                buttons: ['Oui', 'Non', 'Annuler'],
                detail: "Si vous quittez sans enregistrer, le contenu présent risque d'être perdu.",
                title: "Avertissement",
                message: "Enregistrer la note ?"
            })
            if (answer == 0) {
                this.webContents.send('callSaveAsNoxuNote')
            } else if (answer == 2) {
                e.preventDefault()
            }
        })
        // Creating NoxuNote working directories if not exists
        mkdirSync(homedir + '/NoxuNote');
        mkdirSync(homedir + '/NoxuNote/notes');
    }
}

class MainDrawWindow extends BrowserWindow {
    constructor(inserterPosition) {
        super({
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

        // (optionnel) la ligne ou insérer le prochain dessin, utilisé lors de l'insertion 
        this.inserterPosition = inserterPosition

        this.loadURL(`file://${__dirname}/draw.html`) // Loads the renderer process
    }
}

class MainOutputWindow extends BrowserWindow {
    constructor() {
        super({
            width: 640,
            height: 480,
            maximized: true,
            titleBarStyle: "default",
            center: false,
            movable: true,
            frame: true,
            transparent: false,
            backgroundColor: '#FFFFFF',
            zoomFactor: 0.01,
            resizable: true
        })
        this.loadURL(`file://${__dirname}/outputWindow.html`)
    }
}

class SettingsWindow extends BrowserWindow {
    constructor(key) {
        super({
            width: 1024,
            height: 600,
            titleBarStyle: "default",
            movable: true,
            frame: true,
            backgroundColor: '#1E232A',
            //resizable: false,
            autoHideMenuBar: true
        })
        this.loadURL(`file://${__dirname}/settings.html`)
    }
    /**
     * Change l'onglet visualisé dans la fenetre
     * @param {String} key L'onglet à atteindre
     */
    switch(key) {
        this.send('switch', key)
    }
}

class PrePrintWindow extends BrowserWindow {
    constructor(key) {
        super({
            width: 1200,
            height: 720,
            titleBarStyle: "default",
            movable: true,
            frame: true,
            backgroundColor: '#FFFFFF',
            //resizable: false,
            autoHideMenuBar: true
        })
        this.loadURL(`file://${__dirname}/preprint.html`)
    }
    setNote(note) {
        this.send('setNote', note)
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
        this.mainWindow.on('closed', (event) => {
            this.db.saveAllJson()
            this.mainWindow = null
        })
    }
    /**
     * Instancie la fenêtre de dessin
     * @param {number} line (optionnel) la ligne ou insérer le prochain dessin, utilisé lors de l'insertion 
     * d'une ligne au milieu de la note. Si pas de valeur, inséré à la fin.
     */
    createMainDrawWindow(line) {
        if (!this.mainDrawWindow) {
            this.mainDrawWindow = new MainDrawWindow(line)
            this.mainDrawWindow.on('closed', () => {
                this.mainDrawWindow = null;
                this.mode = "new"
                this.mainWindow.webContents.send('restoreMainForm')
            })
        }
    }
    createMainOutputWindow() {
        this.mainOutputWindow = new MainOutputWindow()
        this.mainOutputWindow.on('closed', () => {
            this.mainOutputWindow = null;
        })
    }
    createSettingsWindow(key) {
        if (!this.settingsWindow) {
            this.settingsWindow = new SettingsWindow()
            this.settingsWindow.webContents.on('did-finish-load', ()=>{
                this.settingsWindow.switch(key)
            })
            this.settingsWindow.on('closed', () => {
                this.settingsWindow = null
                this.mainWindow.send('updateDb')
            })
        }   
    }
    createPrePrintWindow() {
        this.prePrintWindow = new PrePrintWindow()
        this.prePrintWindow.webContents.on('did-finish-load', ()=>{
            this.prePrintWindow.setNote(this.note)
        })
        this.prePrintWindow.on('closed', () => {
            this.mainOutputWindow = null;
        })
    }
}

module.exports.NoxuNoteApp = NoxuNoteApp

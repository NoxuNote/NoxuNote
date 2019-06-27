/**
 * main.js - The core script of NoxuNote, which represents the main Electron thread,
 * it instanciates and communicates with the renderer processes like noxuApp.mainWindow and mainDrawWindow
 * through the IPCRenderer. 
 *                         
 * Author : Léo ROLLAND
 * rolland.leo@orange.fr
 * 
 */

// Verbose
const DEBUG = false

// Importing electron library
const electron	= require('electron')
const Menu 			= electron.Menu
const dialog 		= electron.dialog
const app 			= electron.app
const BrowserWindow = electron.BrowserWindow
const ipc 			= electron.ipcMain // Handles asynchronous and synchronous messages sent from a renderer process (web page).
// Importing NoxuNote librairies
const browsers	= require("./Browsers.js")
// Importing external modules
const fs				= require('fs')
const homedir		= require('os').homedir()

/***************************************************************************************************
 *                                         SQUIRREL SETUP                                          *
 ***************************************************************************************************/

// Catch squirrel events 
if (handleSquirrelEvent(app)) {
	return;
}
function handleSquirrelEvent(application) {
	if (process.argv.length === 1) {
			return false;
	}

	const ChildProcess = require('child_process');
	const path = require('path');

	const appFolder = path.resolve(process.execPath, '..');
	const rootAtomFolder = path.resolve(appFolder, '..');
	const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
	const exeName = path.basename(process.execPath);

	const spawn = function(command, args) {
			let spawnedProcess, error;

			try {
					spawnedProcess = ChildProcess.spawn(command, args, {
							detached: true
					});
			} catch (error) {}

			return spawnedProcess;
	};

	const spawnUpdate = function(args) {
			return spawn(updateDotExe, args);
	};

	const squirrelEvent = process.argv[1];
	switch (squirrelEvent) {
			case '--squirrel-install':
			case '--squirrel-updated':
					// Optionally do things such as:
					// - Add your .exe to the PATH
					// - Write to the registry for things like file associations and
					//   explorer context menus

					// Install desktop and start menu shortcuts
					spawnUpdate(['--createShortcut', exeName]);

					setTimeout(application.quit, 1000);
					return true;

			case '--squirrel-uninstall':
					// Undo anything you did in the --squirrel-install and
					// --squirrel-updated handlers

					// Remove desktop and start menu shortcuts
					spawnUpdate(['--removeShortcut', exeName]);

					setTimeout(application.quit, 1000);
					return true;

			case '--squirrel-obsolete':
					// This is called on the outgoing version of your app before
					// we update to the new version - it's the opposite of
					// --squirrel-updated

					application.quit();
					return true;
	}
};

let noxuApp

/***************************************************************************************************
 *                                         INITIALISATION                                          *
 ***************************************************************************************************/

// Handles the renderer process instanciation when app is ready, used most of the time.
app.on('ready', () => {
	function undo() {
		if (noxuApp.mainDrawWindow) noxuApp.mainDrawWindow.browserWindow.webContents.send('undo')
	}
	// Création de la fenêtre principale
	noxuApp = new browsers.NoxuNoteApp(DEBUG)

	// Create the Application's main menu
    var template = [{
        label: "Application",
        submenu: [
            { label: "A propos", selector: "orderFrontStandardAboutPanel:" },
            { type: "separator" },
            { label: "Quitter", accelerator: "Command+Q", click: function() { app.quit(); }}
        ]},{
        label: "Fichier",
        submenu: [
            { label: "Enregistrer", accelerator: "CmdOrCtrl+S", click: function() { noxuApp.mainWindow.browserWindow.webContents.send('callSaveAsNoxuNote') } },
        ]}, {
        label: "Editer",
        submenu: [
            { label: "Annuler", accelerator: "CmdOrCtrl+Z", selector: "undo:", click: ()=>undo() },
            { label: "Rétablir", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
            { type: "separator" },
            { label: "Couper", accelerator: "CmdOrCtrl+X", selector: "cut:" },
            { label: "Copier", accelerator: "CmdOrCtrl+C", selector: "copy:" },
            { label: "Coller", accelerator: "CmdOrCtrl+V", selector: "paste:" },
            { label: "Sélectionner tout", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
		]}, {
		label: "Accès rapide",
		submenu: [
      { label: "Accéder au site", click: ()=> loadExternalLink('http://noxunote.fr/') },
			{ label: "Faire un don", click: ()=> loadExternalLink('http://noxunote.fr/don/') },
			{ label: "Signaler un bogue", click: ()=> loadExternalLink('http://noxunote.fr/bug/') },
			{ label: "Donner une idée", click: ()=> loadExternalLink('http://noxunote.fr/idea/') },
			{ label: "Page Facebook", click: ()=> loadExternalLink('https://www.facebook.com/NoxuNote/') }
		]}
	];
	if(DEBUG) {
		noxuApp.mainWindow.browserWindow.openDevTools()
		noxuApp.mainWindow.browserWindow.maximize()
	} else Menu.setApplicationMenu(Menu.buildFromTemplate(template))
});

/* Handles the activate state, used on macOS when launching the application for 
the first time, attempting to re-launch the application when it's already running, 
or clicking on the application's dock or taskbar icon.
*/
app.on('activate', () => {
	if (noxuApp.mainWindow === null) {
		// Création de la fenêtre principale
		noxuApp = new browsers.NoxuNoteApp()
		// createWindow();
	}
});

// Handles the end of the program
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

/***************************************************************************************************
 *                                       FONCTIONS USUELLES                                        *
 ***************************************************************************************************/

ipc.on('getVersion', (event)=>event.returnValue = noxuApp.licence.getVersion())

/** 
 * Créee un fichier au format NoxuNote (.txt) 
 * @param title le nom du fichier
 */
function save_as_noxunote(title, matiere, content) {
	// On détermine un nom par défaut.
	var date = new Date()
	var hour
	if (date.getMinutes() < 10) hour = date.getHours() + "h0" + date.getMinutes()
	else hour = date.getHours() + "h" + date.getMinutes()
	const mois = new Intl.DateTimeFormat('fr-FR', { month: 'long'}).format(date)

	let now = hour + " le " + date.getDate() + " " + mois + " " + date.getFullYear()
	if (title == "not defined") title = "Note " + now
	var path = homedir + '/NoxuNote/notes/' + title + '.txt';
	try { fs.writeFileSync(path, content) }
	catch (e) { console.log('Failed to save the file !' + e) }
	// Ajout de la matière dans la base de données
	noxuApp.db.notes.setProperty('matiere', matiere, title)
	noxuApp.db.notes.setProperty('lastedit', now, title)
}

/**
 * Loads a noxunote file without prompting for save
 * @param {String} name Le nom du fichier à charger
 */
function force_load(name) {
	// Loading file content
	var fileContent;
	try {
		fileContent = fs.readFileSync(homedir + "/NoxuNote/notes/" + name + ".txt").toString();
	} catch (e) {
		console.log(e);
	}
	// Setting file content to renderThread divs
	noxuApp.mainWindow.webContents.send('setNoteContent', fileContent)
	// Setting file title to renderThread title
	noxuApp.mainWindow.webContents.send('setNoteTitle', name)
	noxuApp.mainWindow.webContents.send('setNoteMatiere', noxuApp.db.notes.getDetails(name+'.txt').matiere)
	noxuApp.mainWindow.webContents.send('resetIsFileModified')
}

ipc.on('load_noxunote', (event, name) => event.returnValue = force_load(name));

// Génère une fenêtre de dessin, appelé quand on appuis sur "Dessiner".
ipc.on('dessiner', (event, url) => {
	if (!noxuApp.mainDrawWindow) noxuApp.createMainDrawWindow(url)
})

// Utilisé quand un nouveau dessin est reçu par le mainDrawWindow. au format brut.
ipc.on('newDessin', (event, data) => {
	noxuApp.mainDrawWindow.browserWindow.close()
	noxuApp.mainWindow.browserWindow.webContents.send('insertDrawing', data)
})
ipc.on('refreshImg', (event, filename) => {
	noxuApp.mainDrawWindow.browserWindow.close()
	noxuApp.mainWindow.browserWindow.webContents.send('refreshImg', filename)
})

ipc.on('save_as_noxunote', (event, title, matiere, content) => event.returnValue=save_as_noxunote(title, matiere, content));

/***************************************************************************************************
 *                                            PRINTING                                             *
 ***************************************************************************************************/
function openExport(content) {
	noxuApp.createPrePrintWindow(content)
}
// caller : the browser webcontent instance that calls the function
function makePreview(format, css, content, caller) {
	console.log('making preview..')
	noxuApp.createMainOutputWindow(caller)
	noxuApp.mainOutputWindow.browserWindow.webContents.on('did-finish-load', () => {
		noxuApp.mainOutputWindow.browserWindow.webContents.send('setContent', content)
		noxuApp.mainOutputWindow.browserWindow.webContents.send('setFormat', format)
		noxuApp.mainOutputWindow.browserWindow.webContents.send('setCSS', css)
		// On informe le outputWindow que tous les éléments lui ont été envoyés
		noxuApp.mainOutputWindow.browserWindow.webContents.send('uploadedContent')
	})
}
function makeFile(format) {
	// format non pris en charge actuellement
	setTimeout(() => {
		console.log('making file..')
		try {
			var path = dialog.showSaveDialog(
				{
					title: "Exporter en PDF",
					filters: [
						{name: 'PDF', extensions: ['pdf']}
					]
				}
			)
			if (path) {
				noxuApp.mainOutputWindow.browserWindow.webContents.printToPDF(
					{
						marginsType: 1,
						silent: false,
						pageSize: "A4",
						printBackground: true,
						printSelectionOnly: false,
						landscape: false,
					},  
					(error, data) => {
						if (error) {
							dialog.showMessageBox({
								type: "info", 
								buttons: ['Ok'],
								title: "Echec",
								message: "Echec : Erreur lors de la génération du fichier PDF."
							})
						}
						fs.writeFileSync(path, data, {flag:'w'}, (error) => {
							if (error) throw error
							console.log('Write PDF successfully.')
						})
						noxuApp.closeMainOutputWindow()
						dialog.showMessageBox({
							type: "info", 
							buttons: ['Ok'],
							title: "Succès",
							message: "Votre fichier PDF à bien été enregistré !"
						})
					}
				)
			}
		} catch(e) {
			dialog.showMessageBox({
				type: "info", 
				buttons: ['Ok'],
				title: "Echec",
				message: "Echec de la tache d'exportation"
			})
			noxuApp.closeMainOutputWindow()
		}
	}, 1);
}

ipc.on('openExport', (event, content) => openExport(content))
ipc.on('makePreview', (event, format, css, content) => makePreview(format, css, content, event.sender))
ipc.on('makeFile', (event, format) => makeFile(format))

function loadExternalLink(URL) {
	var browser = new BrowserWindow({
		width: 1000,
		height: 720,
		icon: './icon.png',
		maximized: false,
		center: false,
		movable: true,
		frame: true,
		transparent: false,
		autoHideMenuBar: true,
		backgroundColor: '#FFFFFF',
	})
	browser.loadURL(URL)
	browser.on('closed', (event) => {
		browser = null;
	})
}
ipc.on('loadExternalLink', (event, URL) => loadExternalLink(URL))

function loadTutorial() {
	var browserTuto = new BrowserWindow({
		width: 850,
		height: 1080,
		icon: './icon.png',
		maximized: false,
		center: false,
		movable: true,
		frame: true,
		transparent: false,
		backgroundColor: '#FFFFFF',
		autoHideMenuBar: true,
	})
	browserTuto.loadURL(`file://${__dirname}/tutoriel/tuto.html`)
	browserTuto.on('closed', (event) => {
		browser = null;
	})
}
ipc.on('loadTutorial', (event) => loadTutorial())

ipc.on('saveToDoContent', (event, content) => {
	var path = homedir + '/NoxuNote/todo.txt';
	try { fs.writeFileSync(path, content) }
	catch (e) { console.log('Failed to save the file !' + e); }
})

ipc.on('minimizeWindow', event => BrowserWindow.fromWebContents(event.sender).minimize())

ipc.on('maximizeWindow', (event)=>{
	let window = BrowserWindow.fromWebContents(event.sender)
	if (window.isMaximized()) window.unmaximize()	
	else window.maximize()
})


/***************************************************************************************************
 *                                        IMAGE IMPORTATION                                        *
 ***************************************************************************************************/

 /**
	* Lit un fichier image et le copie dans le répertoire de travail
	* @returns l'url du nouveau fichier copié
	*/
function promptImage() {
	// Prompt the path
	var path = dialog.showOpenDialog(
		{
			title: "Choisissez une image",
			filters: [
				{name: 'PNG', extensions: ['png']},
				{name: 'JPG', extensions: ['jpg']},
				{name: 'GIF', extensions: ['gif']},
				{name: 'BITMAP', extensions: ['bmp']}
			]
		}
	)
	if (path && path.length==1) return copyFileToWorkingFolder(path[0])
	else return null
}

ipc.on('insertLocalImageDrawer', (event) => {
	event.returnValue = promptImage()
})

/***************************************************************************************************
 *                                        COPIE DE FICHIER                                         *
 ***************************************************************************************************/

/**
 * Copie un fichier "abc.png" dans le répertoire de travail de NoxuNote
 * en modifiant son nom par "import_7676821.png" par exemple.
 * @param {String} filePath URL du fichier à copier
 * @returns {String} URL du fichier copié
 */
function copyFileToWorkingFolder(filePath) {
	let fileExt = ""
	try {
		fileExt = /\.[0-9a-z]+$/i.exec(filePath)[0]
	} catch {
		console.warn("Extension de fichier non reconnue " + filePath)
	}
	const fileSeed = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5); // 11'881'376 possibilités
	const newFilePath = homedir + '/NoxuNote/created_images/import_file_' + fileSeed + fileExt;
	try {
		fs.copyFileSync(filePath, newFilePath);
	} catch {
		console.error("Erreur lors de la copie du fichier " + filePath)
	}
	return newFilePath
}
// Réception d'une demande de copie de fichier, aucune réponse n'est renvoyée de manière synchrone
ipc.on('copyFileToWorkingFolder', (event, filePath) => event.returnValue = copyFileToWorkingFolder(filePath))

ipc.on('quit', (event) => noxuApp.quit())


/***************************************************************************************************
 *                                            DATABASE                                             *
 ***************************************************************************************************/

ipc.on('db_getMatList', (event) => { event.returnValue = noxuApp.db.matieres.matList })
ipc.on('db_addMat', (event, name, colorcode) => { event.returnValue = noxuApp.db.matieres.addMat(name, colorcode) })
ipc.on('db_editMat', (event, property, value, name) => { event.returnValue = noxuApp.db.matieres.setProperty(property, value, name) } )
ipc.on('db_removeMat', (event, name) => { event.returnValue = noxuApp.db.matieres.removeMat(name) } )
ipc.on('db_getColors', (event) => { event.returnValue = noxuApp.db.colors.colorsList })
ipc.on('db_getFileList', (event)=> { event.returnValue = noxuApp.db.getFileList() })
ipc.on('db_setNoteProperty', (event, property, value, name) => { event.returnValue = noxuApp.db.notes.setProperty(property, value, name) })
ipc.on('db_deleteNote', (event, name) => event.returnValue = noxuApp.db.notes.deleteNote(name))
ipc.on('db_getAssocList', (event) => event.returnValue = noxuApp.db.dactylo.assocList)
ipc.on('db_removeAssoc', (event, input) => event.returnValue = noxuApp.db.dactylo.removeAssoc(input))
ipc.on('db_addAssoc', (event, input, output) => event.returnValue = noxuApp.db.dactylo.addAssoc(input, output))

ipc.on('openSettings', (event, key) => { noxuApp.createSettingsWindow(key) })
/***************************************************************************************************
 *                               RÉCUPÉRATION D'INFORMATIONS TIERCES                               *
 ***************************************************************************************************/
ipc.on('amIMaximized', event => event.returnValue = BrowserWindow.fromWebContents(event.sender).isMaximized())

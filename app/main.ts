export {};
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
const DEBUG = true

// Importing electron library
const { Menu, dialog, app, BrowserWindow, ipcMain } = require('electron')
// Importing NoxuNote librairies
const browsers	= require("./Browsers.js")
// Importing external modules
const fs				= require('fs-extra')
const homedir		= require('os').homedir()

/***************************************************************************************************
 *                                         SQUIRREL SETUP                                          *
 ***************************************************************************************************/

// Catch squirrel events 
if (handleSquirrelEvent(app)) {
	//return;
}
function handleSquirrelEvent(application: Electron.App) {
	if (process.argv.length === 1) {
			return false;
	}

	const ChildProcess = require('child_process');
	const path = require('path');

	const appFolder = path.resolve(process.execPath, '..');
	const rootAtomFolder = path.resolve(appFolder, '..');
	const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
	const exeName = path.basename(process.execPath);

	const spawn = function(command: any, args: any) {
			let spawnedProcess, error;

			try {
					spawnedProcess = ChildProcess.spawn(command, args, {
							detached: true
					});
			} catch (error) {}

			return spawnedProcess;
	};

	const spawnUpdate = function(args: any[]) {
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

let noxuApp: any;

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
    var template: any = [{
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

ipcMain.on('getVersion', (event: any)=>event.returnValue = noxuApp.licence.getVersion())

/** 
 * Créee un fichier au format NoxuNote (.txt) 
 * @param title le nom du fichier
 */
function save_as_noxunote(title: string, matiere: any, content: any) {
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
function force_load(name: string) {
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
	noxuApp.mainWindow.webContents.send('setNoteMatiere', noxuApp.db.notes.getNoteMetadata(name+'.txt').matiere)
	noxuApp.mainWindow.webContents.send('resetIsFileModified')
}

ipcMain.on('load_noxunote', (event: { returnValue: void; }, name: string) => event.returnValue = force_load(name));

// Génère une fenêtre de dessin, appelé quand on appuis sur "Dessiner".
ipcMain.on('dessiner', (event: any, url: any) => {
	if (!noxuApp.mainDrawWindow) noxuApp.createMainDrawWindow(url)
})

// Utilisé quand un nouveau dessin est reçu par le mainDrawWindow. au format brut.
ipcMain.on('newDessin', (event: any, data: any) => {
	noxuApp.mainDrawWindow.browserWindow.close()
	noxuApp.mainWindow.browserWindow.webContents.send('insertDrawing', data)
})
ipcMain.on('refreshImg', (event: any, filename: any) => {
	noxuApp.mainDrawWindow.browserWindow.close()
	noxuApp.mainWindow.browserWindow.webContents.send('refreshImg', filename)
})

ipcMain.on('save_as_noxunote', (event: { returnValue: void; }, title: string, matiere: any, content: any) => event.returnValue=save_as_noxunote(title, matiere, content));

/***************************************************************************************************
 *                                            PRINTING                                             *
 ***************************************************************************************************/
function openExport(content: any) {
	noxuApp.createPrePrintWindow(content)
}
// caller : the browser webcontent instance that calls the function
function makePreview(format: any, css: any, content: any, caller: any) {
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
function makeFile(format: any) {
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
					(error: any, data: any) => {
						if (error) {
							dialog.showMessageBox({
								type: "info", 
								buttons: ['Ok'],
								title: "Echec",
								message: "Echec : Erreur lors de la génération du fichier PDF."
							})
						}
						fs.writeFileSync(path, data, {flag:'w'}, (error: any) => {
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

ipcMain.on('openExport', (event: any, content: any) => openExport(content))
ipcMain.on('makePreview', (event: { sender: any; }, format: any, css: any, content: any) => makePreview(format, css, content, event.sender))
ipcMain.on('makeFile', (event: any, format: any) => makeFile(format))

function loadExternalLink(URL: string) {
	let browser: any = new BrowserWindow({
		width: 1000,
		height: 720,
		icon: './icon.png',
		center: false,
		movable: true,
		frame: true,
		transparent: false,
		autoHideMenuBar: true,
		backgroundColor: '#FFFFFF',
	})
	browser.loadURL(URL)
	browser.on('closed', (event: any) => {
		browser = null;
	})
}
ipcMain.on('loadExternalLink', (event: any, URL: any) => loadExternalLink(URL))

ipcMain.on('saveToDoContent', (event: any, content: any) => {
	var path = homedir + '/NoxuNote/todo.txt';
	try { fs.writeFileSync(path, content) }
	catch (e) { console.log('Failed to save the file !' + e); }
})

ipcMain.on('minimizeWindow', (event: { sender: Electron.WebContents; }) => BrowserWindow.fromWebContents(event.sender).minimize())

ipcMain.on('maximizeWindow', (event: { sender: Electron.WebContents; })=>{
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

ipcMain.on('insertLocalImageDrawer', (event: { returnValue: string; }) => {
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
function copyFileToWorkingFolder(filePath: string) {
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
ipcMain.on('copyFileToWorkingFolder', (event: { returnValue: string; }, filePath: any) => event.returnValue = copyFileToWorkingFolder(filePath))

ipcMain.on('quit', (event: any) => noxuApp.quit())


/***************************************************************************************************
 *                                            DATABASE                                             *
 ***************************************************************************************************/

ipcMain.on('db_getMatList', (event: { returnValue: any; }) => { event.returnValue = noxuApp.db.matieres.matList })
ipcMain.on('db_addMat', (event: { returnValue: any; }, name: any, colorcode: any) => { event.returnValue = noxuApp.db.matieres.addMat(name, colorcode) })
ipcMain.on('db_editMat', (event: { returnValue: any; }, property: any, value: any, name: any) => { event.returnValue = noxuApp.db.matieres.setProperty(property, value, name) } )
ipcMain.on('db_removeMat', (event: { returnValue: any; }, name: any) => { event.returnValue = noxuApp.db.matieres.removeMat(name) } )
ipcMain.on('db_getColors', (event: { returnValue: any; }) => { event.returnValue = noxuApp.db.colors.rawJson })
ipcMain.on('db_getFileList', (event: { returnValue: any; })=> { event.returnValue = noxuApp.db.getFileList() })
ipcMain.on('db_setNoteProperty', (event: { returnValue: any; }, property: any, value: any, name: any) => { event.returnValue = noxuApp.db.notes.setProperty(property, value, name) })
ipcMain.on('db_deleteNote', (event: { returnValue: any; }, name: any) => event.returnValue = noxuApp.db.notes.deleteNote(name))
ipcMain.on('db_getAssocList', (event: { returnValue: any; }) => event.returnValue = noxuApp.db.dactylo.rawJson)
ipcMain.on('db_removeAssoc', (event: { returnValue: any; }, input: any) => event.returnValue = noxuApp.db.dactylo.removeAssoc(input))
ipcMain.on('db_addAssoc', (event: { returnValue: any; }, input: any, output: any) => event.returnValue = noxuApp.db.dactylo.addAssoc(input, output))

ipcMain.on('openSettings', (event: any, key: any) => { noxuApp.createSettingsWindow(key) })
/***************************************************************************************************
 *                               RÉCUPÉRATION D'INFORMATIONS TIERCES                               *
 ***************************************************************************************************/
ipcMain.on('amIMaximized', (event: { returnValue: boolean; sender: Electron.WebContents; }) => event.returnValue = BrowserWindow.fromWebContents(event.sender).isMaximized())
// export {}
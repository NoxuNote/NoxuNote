/**
 * main.js - The core script of NoxuNote (backend side), which represents the main Electron thread,
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
const electron 		= require('electron')
const {dialog} 		= require('electron')
const {shell} 		= require('electron')
const {Menu}		= require('electron')
const app 			= electron.app
const ipc 			= electron.ipcMain // Handles asynchronous and synchronous messages sent from a renderer process (web page).
const BrowserWindow = electron.BrowserWindow
// Importing NoxuNote librairies
const licenceAPI 	= require('./licenceAPI.js')
const parser 		= require("./parser.js")
const database		= require("./DataBase.js")
const browsers		= require("./Browsers.js")
// Importing external modules
const fs 			= require('fs')
const homedir 		= require('os').homedir()
const path 			= require('path')

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
	noxuApp = new browsers.NoxuNoteApp()

	// Create the Application's main menu
    var template = [{
        label: "Application",
        submenu: [
            { label: "A propos", selector: "orderFrontStandardAboutPanel:" },
            { type: "separator" },
            { label: "Quitter", accelerator: "Command+Q", click: function() { app.quit(); }}
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
	if(!DEBUG) {
		Menu.setApplicationMenu(Menu.buildFromTemplate(template))
	}
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

function noteToHtml(texte) {
	return parser.noteToHtml(texte)
}

/** 
 * Action qui valide le contenu du formulaire qu'il soit en noxuApp.mode 'new' ou 'edition'
 * @param {number} line Le numéro de la ligne editée (optionnel)
 * @param {string} content le contenu actuel entré par l'utilisateur
 * @param {boolean} ajoutLigne définit si on doit ajouter une ligne sous jacente à la ligne actuelle.
 */
function entree_texte(line, content, ajoutLigne) {
	// Si on est en train de dessiner, on cancel la fonction
	if (noxuApp.mainDrawWindow) { return }
	
	if (noxuApp.mode == "new") {
		noxuApp.mainWindow.webContents.send('changeInput', '')
		var html = noteToHtml(content)
		// S'il s'agit d'une image on enregistre non pas la note (img=) mais le produit par la fonction noteToHtml 
		// afin de satisfaire l'éditeur d'images.
		if (html.substr(0, 4) == "<img") {
			// Ajout du contenu traité par noteToHtml en cas d'image
			noxuApp.note.push(html)
			// On ajoute un délai pour laisser charger l'image
			noxuApp.mainWindow.webContents.send('addDiv', noxuApp.note.length-1, html)
			// setTimeout( ()=>{
			// 	noxuApp.mainWindow.webContents.send('addDiv', noxuApp.note.length-1, html);
			// }, 200 )
		} else {
			// Ajout de l'extrait dans la note
			noxuApp.note.push(content)
			noxuApp.mainWindow.webContents.send('addDiv', noxuApp.note.length-1, html)
		}

	} else {
		//noxuApp.mainWindow.webContents.send('setDivContent', line, noteToHtml(content));
		//noxuApp.note[line] = content;
		if (ajoutLigne && line+1 <= noxuApp.note.length-1) clickInserter(line+1, content)
		else {
			noxuApp.mainWindow.webContents.send('setDivContent', line, noteToHtml(content))
			noxuApp.note[line] = content
			noxuApp.mainWindow.webContents.send('restoreMainForm')
			noxuApp.mode = "new"
		}
	}
	console.log(noxuApp.note);
}
ipc.on('entree_texte', (event, line, content, ajoutLigne) => entree_texte(line, content, ajoutLigne))

/**
 * La fonction qui valide l'edition precedente et prepare la nouvelle edition
 * @param {number} line Ligne a editer, 0 pour la derniere ligne
 * @param {string} actualFormContent Contenu du formulaire actuel à valider dans la div précedemment editee
 */
function edit_div(line, actualFormContent) {
	// Si on est en train de dessiner, on cancel la fonction
	if (noxuApp.mainDrawWindow) { return }
	// On valide le contenu précédent
	if (noxuApp.mode == "edit") {
		// On valide le contenu déjà en cours d'édition
		noxuApp.mainWindow.webContents.send('setDivContent', noxuApp.editedLine, noteToHtml(actualFormContent));
		noxuApp.note[noxuApp.editedLine] = actualFormContent;
	} else noxuApp.mode = "edit"
	// Si on a demande une ligne inexistante alors on restaure le form principal
	if(line > noxuApp.note.length-1) {
		noxuApp.mode = "new"
		noxuApp.mainWindow.webContents.send('restoreMainForm')
		return
	}
	// Utilisé en cas d'appui sur la flèche supérieure notamment
	if (line == 0 && noxuApp.note.length > 1) noxuApp.editedLine = noxuApp.note.length-1
	else noxuApp.editedLine = line
	// Stoquage du contenu edité
	noxuApp.editedContent = noxuApp.note[noxuApp.editedLine]
	// S'il s'agit d'une image, on l'édite avec draw
	let sub
	try { sub = noxuApp.editedContent.substr(0, 4) } catch (e) {}

	if (sub == "<img") {
		// Instanciation d'une DrawWindow
		noxuApp.createMainDrawWindow();
		// Sélection du src="data"
		data = /src="[\s\S]*?"/g.exec(noxuApp.editedContent)[0];
		// Isolement de la source
		data = data.slice(5, -1);
		// Quand la fenêtre de dessin est prête, on lui demande de charger l'image
		noxuApp.mainDrawWindow.browserWindow.webContents.on('did-finish-load', ()=>{
			noxuApp.mainDrawWindow.browserWindow.webContents.send('setEditState', line)
			noxuApp.mainDrawWindow.browserWindow.webContents.send('loadImage', data)
		})
	} else {			
		// Déplacement du form avec le contenu édité
		// Délai placé pour laisser le temps de terminer l'édition de la ligne précédente avant
		// de demander au formulaire de se déplacer. Dans le cas de la regénération d'un tableau
		// par exemple.
		if (noxuApp.editedContent && (actualFormContent.substr(0,1)=="/" || noxuApp.editedContent.substr(0,1)=="/") ) {
			setTimeout(() => { noxuApp.mainWindow.webContents.send('moveForm', noxuApp.editedLine, noxuApp.editedContent) }, 5)
			//noxuApp.mainWindow.webContents.send('moveForm', noxuApp.editedLine, noxuApp.editedContent)
		} else {
			// QUAND ON DOIT LE FAIRE ???
			setTimeout(() => { noxuApp.mainWindow.webContents.send('moveForm', noxuApp.editedLine, noxuApp.editedContent) }, 5)
			//noxuApp.mainWindow.webContents.send('moveForm', noxuApp.editedLine, noxuApp.editedContent)
		}
	}
}
ipc.on('edit_div', (event, line, actualFormContent) => edit_div(line, actualFormContent))


/**
 * Fonction qui supprime une ligne
 * @param {number} line Ligne a supprimer
 */
function delete_div(line) {
	// Supprimer la ligne du tableau
	noxuApp.note.splice(line, 1)
	reloadContent()
	// Remettre le noxuApp.mode new
	noxuApp.mode = "new"
	noxuApp.mainWindow.webContents.send('restoreMainForm')
}
ipc.on('delete_div', (event, line) => { delete_div(line) }) // Handling call


/** 
 * Créee un fichier au format NoxuNote (.txt) 
 * @param title le nom du fichier
 */
function save_as_noxunote(title, matiere) {
	// On détermine un nom par défaut.
	var date = new Date()
	var hour
	if (date.getMinutes() < 10) hour = date.getHours() + "h0" + date.getMinutes()
	else hour = date.getHours() + "h" + date.getMinutes()

	let now = hour + " le " + date.getDate() + "-" + date.getMonth()

	if (title == "not defined") title = "Note " + now
	var path = homedir + '/NoxuNote/notes/' + title + '.txt';
	var content = "";
	for (var j = 0; j < noxuApp.note.length; j++) {
		content += noxuApp.note[j] + '\n'
	}
	try { fs.writeFileSync(path, content) }
	catch (e) { console.log('Failed to save the file !' + e) }
	// Ajout de la matière dans la base de données
	noxuApp.db.notes.setProperty('matiere', matiere, title)
	noxuApp.db.notes.setProperty('lastedit', now, title)
}


/** 
 * Reset le noxuApp.mainWindow content et reconstruit le document, utilisé après grosses modification de tableaux notamment
 */
function reloadContent() {
	// Resetting renderThread content
	noxuApp.mainWindow.webContents.send('clearContent')
	for (var i = 1; i < noxuApp.note.length; i++) {
		// Envoi du contenu traité
		noxuApp.mainWindow.webContents.send('addDiv', i, noteToHtml(noxuApp.note[i]))
	}
	noxuApp.mainWindow.webContents.send('restoreMainForm')
}
ipc.on('reloadContent', (event) => reloadContent())

/** 
 * Reset le programme et les variables
 */
function reset() {
	// Resetting renderThread content
	noxuApp.mainWindow.webContents.send('clearContent')
	noxuApp.mainWindow.webContents.send('restoreMainForm')
	// Resetting all variables
	noxuApp.note = new Array()
	noxuApp.note.push("@NOXUNOTE_BEGIN")
	noxuApp.mode = "new"
}
ipc.on('reset', (event) => reset())

/**
 * Loads a noxunote file without prompting for save
 * @param {String} name Le nom du fichier à charger
 */
function force_load(name) {
	reset()
	// Loading file content
	var fileContent;
	try {
		fileContent = fs.readFileSync(homedir + "/NoxuNote/notes/" + name + ".txt").toString().split("\n");
	} catch (e) {
		console.log(e);
	}
	// Setting file content to renderThread divs
	for (var j = 1; j < fileContent.length-1; j++) {
		entree_texte(0, fileContent[j]);
	}
	// Setting file title to renderThread title
	noxuApp.mainWindow.webContents.send('setNoteTitle', name)
	noxuApp.mainWindow.webContents.send('setNoteMatiere', noxuApp.db.notes.getDetails(name+'.txt').matiere)
	noxuApp.mainWindow.webContents.send('resetIsFileModified')
}

/** 
 * Prompt user save and load noxunote given file
 * @param name {string} title le nom du fichier
 * @param isFileModified {boolean} la note précedemment ouverte a été modifiée
 */
function load_noxunote(name, isFileModified) {
	let saveFile = false
	if (isFileModified) {
		var answer = dialog.showMessageBox({
			type: "question", 
			buttons: ['Oui', 'Non', 'Annuler'],
			detail: "Le contenu ajouté risque d'être perdu si vous quittez sans enregistrer.",
			title: "Avertissement",
			message: "Enregistrer les modifications ?"
		})
		if (answer == 0) {
			noxuApp.mainWindow.webContents.send('callSaveAsNoxuNote')
			saveFile = true
		} else if (answer == 2) {
			return
		}
	}
	if(saveFile) {
		setTimeout(()=>{
			force_load(name)
		}, 500)
	} else {
		force_load(name)
	}
}
ipc.on('load_noxunote', (event, path, isFileModified) => load_noxunote(path, isFileModified));


// Permet de régénérer une div
// utilisé lorsque l'on modifie l'emplacement d'une div pour réattribuer le onClick
ipc.on('repairDiv', (event, line) => {
	noxuApp.mainWindow.webContents.send('setDivContent', line, noteToHtml(noxuApp.note[line]));
})

// Génère une fenêtre de dessin, appelé quand on appuis sur "Dessiner".
ipc.on('dessiner', (event) => {
	if ( !noxuApp.mainDrawWindow ) {
		noxuApp.createMainDrawWindow(noxuApp.mode!="new" ? noxuApp.editedLine : undefined)
	}
})

// Utilisé quand un nouveau dessin est reçu par le mainDrawWindow. au format brut.
ipc.on('newDessin', (event, data) => {
	if (noxuApp.mainDrawWindow.inserterPosition == undefined) {
		noxuApp.mainDrawWindow.browserWindow.close()
		entree_texte(0, '<img class="schema negative" src="' + data + '"></img>')
	} else newEditedDessin(data, noxuApp.mainDrawWindow.inserterPosition)
})

// Appelé par draw.html lorsque l'on clique sur sauver en noxuApp.mode edition.
function newEditedDessin(data, line) {
	// new Date().getTime() indique à chromium que l'image à été modifiée en changeant son URL.
	noxuApp.mainDrawWindow.browserWindow.close()
	// On redéfinit le noxuApp.mode edit car le close met en noxuApp.mode new
	noxuApp.mode = "edit"
	entree_texte(line, '<img class="schema negative" src="' + data + '?' + new Date().getTime() + '"></img>')
	console.log('<img class="schema negative" src="' + data + '?' + new Date().getTime() + '"></img>')
}
ipc.on('newEditedDessin', (event, data, line) => newEditedDessin(data, line))

// Utilisé pour supprimer un dessin puis de fermer la fenêtre de dessin.
ipc.on('deleteDessin', (event, line) => {
	delete_div(line)
	noxuApp.mainDrawWindow.browserWindow.close()
})

ipc.on('save_as_noxunote', (event, title, matiere) => save_as_noxunote(title, matiere));

/***************************************************************************************************
 *                                            PRINTING                                             *
 ***************************************************************************************************/

function openExport() {
	noxuApp.createPrePrintWindow()
}
// caller : the browser webcontent instance that calls the function
function makePreview(format, css, caller) {
	console.log('making preview..')
	noxuApp.createMainOutputWindow(caller)
	noxuApp.mainOutputWindow.browserWindow.webContents.on('did-finish-load', () => {
		for (var i = 1; i < noxuApp.note.length; i++) {
			noxuApp.mainOutputWindow.browserWindow.webContents.send('addDiv', noteToHtml(noxuApp.note[i]), i)
		}
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

ipc.on('openExport', (event) => openExport())
ipc.on('makePreview', (event, format, css) => makePreview(format, css, event.sender))
ipc.on('makeFile', (event, format) => makeFile(format))

function promptImage(action) {
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
	if (path) {
		// Generating filename
		var imgFeed = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
		var fileName = homedir+'/NoxuNote/created_images/imported_'+imgFeed+'.png';

		// Copying file from path to /NoxuNote folder
		fs.createReadStream(path[0]).pipe(fs.createWriteStream(fileName))
		.on('close', function (err) {
			if (err) throw Error(err)
			else action(fileName)
		});
	}
}

ipc.on('insertLocalImage', (event) => {
	if ( !noxuApp.mainDrawWindow && (noxuApp.mode == "new") ) {
		promptImage((fileName) => {
			entree_texte(0, "<img class='schema' src=\""+fileName+"\"></img>")
		})
	}
})

// Évènement appelé par le mainDrawWindow lors de l'appui de l'insertion d'image
ipc.on('insertLocalImageDrawer', (event)=> {
	if (noxuApp.mainDrawWindow) {
		promptImage((fileName)=>{
			noxuApp.mainDrawWindow.browserWindow.webContents.send('insertLocalImage', fileName)
		})
	}
})

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

function clickInserter(line, actualFormContent) {
	// Si on était en noxuApp.mode édition
	if (noxuApp.mode=="edit") {
		// On valide le contenu déjà en cours d'édition
		noxuApp.mainWindow.webContents.send('setDivContent', noxuApp.editedLine, noteToHtml(actualFormContent));
		noxuApp.note[noxuApp.editedLine] = actualFormContent;
	} 
	noxuApp.mode = "new"

	// On ajoute une ligne dans la note avant la ligne "line", on rafraichit et on l'édite
	noxuApp.note.splice(line, 0, "")
	reloadContent()
	edit_div(line, "")
	console.log(noxuApp.note);
}

ipc.on('inserterClicked', (event, line, actualFormContent)=>clickInserter(line, actualFormContent))

ipc.on('minimizeWindow', event => BrowserWindow.fromWebContents(event.sender).minimize())

ipc.on('maximizeWindow', (event)=>{
	let window = BrowserWindow.fromWebContents(event.sender)
	if (window.isMaximized()) window.unmaximize()	
	else window.maximize()
})

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
ipc.on('getNoteLength', event => event.returnValue = noxuApp.note.length-1)
ipc.on('amIMaximized', event => event.returnValue = BrowserWindow.fromWebContents(event.sender).isMaximized())

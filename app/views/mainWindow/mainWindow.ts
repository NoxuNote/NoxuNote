/**
 * mainWindow.js - The core script of the rendering thread of NoxuNote (frontend side), handles interface to main.js
 * This script is called by index.html which is itself called by main.js
 * mainWindow.js and main.js communicate together through the ipc listener implemented in Electron
 * https://electronjs.org/docs/api/ipc-renderer
 */

/***************************************************************************************************
 *                                           CONSTANTES                                            *
 ****************************************************************************************************/

// Importing and creating electron aliases
const ipc = require('electron').ipcRenderer
const { ipcRenderer } = require('electron')
const shell = require('electron').shell
const { dialog } = require('electron').remote
const homedir = require('os').homedir()
const fs = require("fs")
const os = require("os")
const math = require("mathjs")
const ModalManager = require("./ModalManager.js")
const NotificationService = require("./NotificationService.js")
const EquationManager = require('./EquationManager.js')
const toNewFormat = require("./migration")
var title = "not defined";

import * as $ from "jquery";
import { CalcPlugin } from './plugins/calc';
import { NoxunotePlugin, Matiere } from "../../types";
import { TodoPlugin } from "./plugins/todo";
import { BrowsePlugin } from "./plugins/browse";


declare var HTML5TooltipUIComponent: any; // html5tooltips has no type.d.ts file

const elts = {
	header: {
		titrePrincipal: document.getElementById("TitrePrincipal"),
		modified: document.getElementById('isModified')
	},
	calc: {
		menu: document.getElementById('menuBasCalc'),
		triggers: [document.getElementById("triggerCalc")],
		normalInput: <HTMLInputElement>document.getElementById("calc"),
		normalOutput: document.getElementById('calcResult'),
		derivativeInput: <HTMLInputElement>document.getElementById("calcDerivative"),
		derivativeOutput: document.getElementById('calcResultDerivative')
	},
	menuGaucheSauver: {
		menu: document.getElementById('menuGaucheSauver'),
		matieres: document.getElementById('matieres'),
		sauverInput: <HTMLInputElement>document.getElementById('menuGaucheSauverInput')
	},
	menuGaucheOuvrir: {
		menu: document.getElementById('menuGaucheOuvrir'),
		triggers: [document.getElementById('menuGaucheOuvrirTrigger')],
		allMat: document.getElementById('allMat'),
		allMatNotesCount: document.getElementById('allMatNotesCount'),
		matList: document.getElementById('matList'),
		filesList: document.getElementById('filesList'),
		fileLookup: document.getElementById('fileLookup')
	},
	toDo: {
		triggers: [document.getElementById('triggerTodo'), document.getElementById('triggerTodo2')],
		menu: document.getElementById('toDoBlock'),
		content: <HTMLInputElement>document.getElementById("toDoContent")
	},
	matieres: {
		matNeutre: <HTMLInputElement>document.getElementById('matneutre')
	},
	insert: {
		imageByUrlValue: <HTMLInputElement>document.getElementById("imageByUrlValue"),
		imageByFileValue: <HTMLInputElement>document.getElementById("imageByFileValue")
	},
	listFiles: document.getElementById("listFiles")
}

var plugins: NoxunotePlugin[] = [
	new CalcPlugin(elts.calc),
	new TodoPlugin(elts.toDo),
	new BrowsePlugin(elts.menuGaucheOuvrir, ipc)
]

// CTRL on windows, CMD on mac
const metaKey = os.type()=="Darwin"?"Cmd":"Ctrl"

var isFileModified = false
function setIsFileModified(b: boolean) {
	if (isFileModified != b) {
		if (b) 
			elts.header.modified.classList.add('displayed')
		else 
		elts.header.modified.classList.remove('displayed')
	}
	isFileModified = b
}


const editor = $('#summernote')

/**
 * Action à effectuer lorsque l'utilisateur choisit une option
 * dans la modale de confirmation de sauvegarde
 */
let saveConfirmationModalAction: Function = function () {}

// Manageur de modales
const modalManager = new ModalManager()
const notificationService = new NotificationService()
const equationManager = new EquationManager(modalManager, editor)

/***************************************************************************************************
 *                                    DÉCLARATION DES FONCTIONS                                    *
 ***************************************************************************************************/

/**
* Affiche/Masque le volet Menu Gauche Sauver
*/
var hiddenLeftSave = true;
var hiddenLeftOpen = true;
function boutonMenuGaucheSauver() {
	// Apparaît
	if (hiddenLeftSave) {
		hiddenLeftSave = false;
		elts.menuGaucheSauver.sauverInput.classList.toggle("appear");

		// Si présent, disparait
		if (!hiddenLeftOpen) {
			hiddenLeftOpen = true;
			elts.menuGaucheOuvrir.menu.classList.toggle("appear");
		}

	} else {
		hiddenLeftSave = true;
		elts.menuGaucheSauver.sauverInput.classList.toggle("appear");
	}
}

/**
* Affiche/Masque le volet Menu Gauche Sauver
*/
function boutonMenuGaucheOuvrir() {
	// Apparait
	if (hiddenLeftOpen) {
		hiddenLeftOpen = false;
		elts.menuGaucheOuvrir.menu.classList.toggle("appear");

		// Si présent, disparait
		if (!hiddenLeftSave) {
			hiddenLeftSave = true;
			elts.menuGaucheSauver.sauverInput.classList.toggle("appear");
		}
	} else {
		hiddenLeftOpen = true;
		elts.menuGaucheOuvrir.menu.classList.toggle("appear");
	}
}

/**
 * Ouvre une fenêtre de dessin
 * url - optionnel, permet d'éditer l'image donnée par l'url
 */
function dessiner(url?: string) {
	ipc.send('dessiner', url);
}

/**
 * Enregistre la note au format NoxuNote
 */
function save_as_noxunote() {
	ipc.sendSync('save_as_noxunote', title, getMat(), editor.summernote('code'));
	setIsFileModified(false)
	plugins.find(p => p instanceof BrowsePlugin).init()
}


/**
* Fonction appelée quand on entre un caractère dans le titre.
* met à jour la variable title et le titre du document (en haut)
*/
function onTypeOnTitle() {
	setTimeout(() => {
		title = elts.menuGaucheSauver.sauverInput.value.replace(/[><\/\\.]/g, "")
		elts.header.titrePrincipal.innerHTML = title
		if (title == "") {
			elts.header.titrePrincipal.innerHTML = "(Cliquez pour nommer la note)"
			title = "not defined";
		}
	}, 20)
}


/**
 * Loads a file
 * @param path path to file
 */
function load_noxunote(name: any) {
	ipc.sendSync('load_noxunote', name)
}


function setNoteTitle(newtitle: string) {
	// Définition du titre
	title = newtitle
	if (newtitle == "") {
		elts.header.titrePrincipal.innerHTML = "(Cliquez pour nommer la note)";
		elts.menuGaucheSauver.sauverInput.value = ""
		title = "not defined"
	} else {
		elts.header.titrePrincipal.innerHTML = title;
		elts.menuGaucheSauver.sauverInput.value = title
	}
}

// /**
//  * Affichage de la liste des fichiers dans le menu sauver
//  */
// function generateFileList() {
// 	var listFilesDiv = elts.listFiles
// 	var matieres = ipcRenderer.sendSync('db_getMatList')
// 	var files = ipcRenderer.sendSync('db_getFileList')

// 	// Nettoyage des fichiers affichés
// 	while (listFilesDiv.firstChild) {
// 		listFilesDiv.removeChild(listFilesDiv.firstChild);
// 	}

// 	// Mémorise les index des fichiers affichés
// 	let shownFiles: string[] = []

// 	// Ajoute un fichier à la liste des fichiers à ouvrir
// 	let addFile = (f: any) => {
// 		// Création de la pastille
// 		var matDiv = document.createElement('div')
// 		matDiv.classList.add("pastille")
// 		matDiv.innerHTML = "•"
// 		matDiv.style.color = f.color
// 		listFilesDiv.appendChild(matDiv)

// 		// Création du texte
// 		var innerDiv = document.createElement('div')
// 		innerDiv.style.display = "inline"
// 		innerDiv.id = "file"
// 		// Ajout du tooltip
// 		let tooltip: { set: (arg0: { animateFunction: string; color: string; stickDistance: number; contentText: string; stickTo: string; target: HTMLDivElement; }) => void; show: () => void; hide: { (): void; (): void; }; mount: () => void; }
// 		if (f.lastedit) {
// 			tooltip = new HTML5TooltipUIComponent;
// 			tooltip.set({
// 				animateFunction: "spin",
// 				color: "slate",
// 				stickDistance: 20,
// 				contentText: '<i class="fas fa-clock-o"></i> Dernière modif : ' + f.lastedit,
// 				stickTo: "right",
// 				target: innerDiv
// 			});
// 			innerDiv.addEventListener('mouseenter', () => tooltip.show());
// 			innerDiv.addEventListener('mouseleave', () => tooltip.hide());
// 			innerDiv.addEventListener('click', () => tooltip.hide());
// 			tooltip.mount();
// 		}
// 		const nomNote = f.nom.replace(".txt", "")
// 		innerDiv.innerHTML = nomNote
		
// 		innerDiv.onclick = () => {
// 			// Lors d'un clic, définit l'action de la modale de confirmation
// 			// sur le chargement de la nouvelle note
// 			if (isFileModified) {
// 				saveConfirmationModalAction = ()=>load_noxunote(nomNote) // On définit l'action de confirmation
// 				modalManager.openModal('saveConfirmationModal') // Ouvre la modale de confirmation
// 			} else { // Si aucune modification actuellement, on charge directement la note
// 				load_noxunote(nomNote)
// 			}
// 		}

// 		listFilesDiv.appendChild(innerDiv);

// 		// Ajout d'un br et inscription dans la liste des éléments affichés
// 		listFilesDiv.appendChild(document.createElement('br'))
// 		shownFiles.push(f.nom)
// 	}
// 	let addCategory = (name: string) => {
// 		listFilesDiv.appendChild(document.createElement('hr'))
// 		var innerDiv = document.createElement('h5')
// 		innerDiv.style.display = "inline"
// 		innerDiv.title = name
// 		innerDiv.innerHTML = '<span style="color: #EEEEEE">' + name + '</span>'
// 		listFilesDiv.appendChild(innerDiv)
// 		listFilesDiv.appendChild(document.createElement('br'))
// 	}

// 	// Affichage des matieres
// 	matieres.forEach((m: { nom: any; }) => {
// 		addCategory(m.nom)
// 		files.filter((e: { [x: string]: any; }) => e['matiere'] === m.nom).forEach(addFile)
// 	})

// 	// Affichage des éléments non inscrits
// 	addCategory("Non triés")
// 	files.filter((e: { nom: any; }) => !shownFiles.includes(e.nom)).forEach(addFile)
// }

/**
 * Affichage des matières disponibles dans SAUVER
 */
function generateMatList() {
	// Suppression du conteneur actuel
	var matList = elts.menuGaucheSauver.matieres
	while (matList.firstChild) {
		matList.removeChild(matList.firstChild)
	}

	// Récupération de la liste des matières
	var matieres: Matiere[] = ipcRenderer.sendSync('db_matieres_getMatieres')
	for (var i = 0; i < matieres.length; i++) {
		var innerDiv = document.createElement('div')
		innerDiv.id = "matiere"
		let checkbox: string = "<input type='radio' name='mat' value='" + matieres[i].id + "'>"
		innerDiv.innerHTML = checkbox + matieres[i].name
		innerDiv.style.background = matieres[i].color
		matList.appendChild(innerDiv)
	}
}

/**
 * Renvoie la matière sélectionnée
 */
function getMat() {
	var form = elts.menuGaucheSauver.matieres.childNodes
	for (let i = 0; i < form.length; i++) {
		let firstChild: HTMLInputElement = (<HTMLInputElement>form[i].firstChild);
		if (firstChild.checked) return firstChild.value
	}
	return ""
}

/**
 * Appelle le module d'exportation html avec le code actuel de la summernote
 */
function openExport() {
	ipc.send('openExport', editor.summernote('code'));
}

/**
 * Commande de création d'une nouvelle note
 */
function newFile() {
	const resetFunc: Function = ()=>{
		setNoteTitle("");
		editor.summernote('reset')
		setIsFileModified(false)
	}
	if (isFileModified) {
		saveConfirmationModalAction = resetFunc // On définit l'action de confirmation
		modalManager.openModal('saveConfirmationModal') // Ouvre la modale de confirmation
	} else { // Si aucune modification actuellement, on charge directement la note
		resetFunc.call(null)
	}	
}


function openSettings(key: any) {
	ipc.send('openSettings', key)
}

/**
 * Définit une matière cochée par défaut dans le menu de sauvegarde, sinon coche neutre
 * @param {string} matiere La matière à cocher
 */
function setNoteMatiere(matiere: any) {
	let list = elts.menuGaucheSauver.matieres
	let found = false
	list.childNodes.forEach(e => {
		let firstChild = <HTMLInputElement>e.firstChild
		if (firstChild.value === matiere) {
			firstChild.checked = true
			found = true
		}
		else firstChild.checked = false
	})
	if (!found) elts.matieres.matNeutre.checked = true
}

/**
 * Insère l'image donnée par l'url
 */
function insertImg(url: any) {
	editor.summernote('restoreRange')
	editor.summernote('focus')
	editor.summernote('insertImage', url, url)
}

function maximizeWindow() {
	ipc.send("maximizeWindow");
}
function minimizeWindow() {
	ipc.send("minimizeWindow");
}
function closeWindow() {
	if (isFileModified) {
		modalManager.openModal('saveConfirmationModal') // Ouvre une modale de confirmation de sauvegarde
		saveConfirmationModalAction = ()=>ipc.send('quit') // Modifie l'action si confirmation de l'utilisateur
	} else {
		ipc.send('quit')
	}
}

/***************************************************************************************************
 *										SUMMERNOTE      			               			       *
 ***************************************************************************************************/
var MediaButton = function (context: any) {
	var ui = ($ as any).summernote.ui;
	// create button
	var button = ui.button({
		contents: '<i class="fas fa-image"></i>',
		tooltip: 'Image, vidéo, dessin',
		click: () => { editor.summernote('saveRange'); modalManager.openModal("choixMediaModal") }
	});

	return button.render();   // return button as jquery object
}

var EquationButton = function (context: any) {
	var ui = ($ as any).summernote.ui;
	// create button
	var button = ui.button({
		contents: '<i class="fas fa-calculator"/>',
		tooltip: `Équation (${metaKey}+e)`,
		click: () => {
			editor.summernote('saveRange')
			modalManager.openModal("equationModal")
			equationManager.refreshHistory()
		}
	});
	return button.render();   // return button as jquery object
}

var SchemaCreationButton = function (context: any) {
	var ui = ($ as any).summernote.ui;
	// create button
	var button = ui.button({
		contents: '<i class="fas fa-pencil-ruler"></i>',
		tooltip: 'Créer un dessin/schéma',
		click: () => {
			editor.summernote('saveRange')
			dessiner()
		}
	});
	return button.render();   // return button as jquery object
}

var SchemaEditionButton = function (context: any) {
	var ui = ($ as any).summernote.ui;
	// create button
	var button = ui.button({
		contents: '<i class="fas fa-pencil-ruler"></i>',
		tooltip: 'Modifier l\'image',
		click: () => {
			// Get highlighted image
			let target = context.layoutInfo.editable.data('target')
			if (target instanceof HTMLImageElement) {
				let clickedImg = <HTMLImageElement>target
				let url = ""
				if (os.type() == "Windows_NT") url = clickedImg.src.toString().replace("file:///", "") // Pas de slash au début des path windows
				else url = clickedImg.src.toString().replace("file:///", "/") // Slash au début des paths (chemins absolus) sous unix
				console.log('edition du fichier : ', extractUrlFromSrc(url))
				dessiner(extractUrlFromSrc(url))
			}
		}
	});
	return button.render();   // return button as jquery object
}

$(document).ready(initializeSummernote)

function initializeSummernote() {
	const wordsDictionnary = ipcRenderer.sendSync('db_getAssocList').map((element: { output: any; }) => element.output)
	// @ts-ignore
	editor.summernote({
		lang: 'fr-FR',
		focus: true,
    blockquoteBreakingLevel: 1,
		/**
		 * Suggestion automatique de mots
		 */
		hint: {
			words: wordsDictionnary,
			match: /\b(\w{1,})$/,
			search: function (keyword: any, callback: (arg0: any) => void) {
				callback($.grep(this.words, function (item: { indexOf: (arg0: any) => number; }) {
					return item.indexOf(keyword) === 0;
				}))
			}
		},
		/**
		 * Boutons proposés dans la toolbar en haut de l'éditeur
		 */
		toolbar: [
			['magic', ['style', 'specialChar']],
			['create', ['schemaCreation']],
			['fontsize', ['fontname', 'fontsize', 'color']],
			['style', ['bold', 'italic', 'underline']],
			['para', ['ul', 'ol', 'paragraph']],
			['font', ['superscript', 'subscript', 'codeview']],
			['insert', ['media', 'equation', 'table']]
		],
		/**
		 * Boutons proposés lors du clic sur une image
		 */
		popover: {
			image: [
				['custom', ['schemaEdition']],
				['imagesize', ['imageSize100', 'imageSize50', 'imageSize25']],
				['float', ['floatLeft', 'floatRight', 'floatNone']],
				['remove', ['removeMedia']]
			],
      link: [
        ['link', ['linkDialogShow', 'unlink']],
      ],
      table: [
        ['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
        ['delete', ['deleteRow', 'deleteCol', 'deleteTable']],
      ]
		},
		/**
		 * Enregistrement des boutons personnalisés
		 */
		buttons: {
			media: MediaButton,
			equation: EquationButton,
			schemaCreation: SchemaCreationButton,
			schemaEdition: SchemaEditionButton
		},
		/**
		 * Evenements de sortie de summernote
		 */
		callbacks: {
			onInit: function () {
				setTimeout(()=> {
					$("#fullscreenLoader").addClass('disabled')
				}, 1000)
			},
			onChange: function (contents: any, $editable: any) {
				setIsFileModified(true)
			},
			onKeydown: function (e: KeyboardEvent) {
				/**
				 * Lors d'un appui sur entrée, on vérifie si la ligne débute par un marqueur NoxuNote
				 * Par exemple ##Titre doit transformer la ligne en un titre de niveau 2.
				 */
				if (e.keyCode === 13) {
					const selection = window.getSelection()
					const data = (<CharacterData>selection.getRangeAt(0).commonAncestorContainer).data // Stocke le contenu de la ligne entrée
					if (data) {
						const line = data.toString()
						if (line.substr(0, 3) === "###") {
							// Changement du format de la ligne
							editor.summernote("formatH1");
							let parent = <HTMLElement>selection.anchorNode.parentNode;
							// Suppression des caractères ### avec éventuels espaces au début
							parent.innerText = parent.innerText.toString().replace(/^[#\s]*/g, "")
							// Déplacement du curseur à la fin de la ligne
							setCursorAfterElement(parent, e)
						}
						else if (line.substr(0, 2) === "##") {
							editor.summernote("formatH2");
							let parent = <HTMLElement>selection.anchorNode.parentNode;
							parent.innerText = parent.innerText.toString().replace(/^[#\s]*/g, "")
							setCursorAfterElement(parent, e)
						}
						else if (line.substr(0, 1) === "#") {
							editor.summernote("formatH3");
							let parent = <HTMLElement>selection.anchorNode.parentNode;
							parent.innerText = parent.innerText.toString().replace(/^[#\s]*/g, "")
							setCursorAfterElement(parent, e)
						}
					}
				}
			}
		}
	})
}

/**
 * Place le curseur après l'élément voulu en utilisant une méthode d'insertion
 * de balise, de déplacement de curseur, et de suppression de la balise.
 * @param {*} ele Element après lequel le curseur doit être inseré
 * @param {*} e Evenement type clavier
 */
function setCursorAfterElement(ele: HTMLElement, e: { preventDefault: () => void; }) {
	var dummyElement; // Élement fictif crée après ele
	if (!ele.nextElementSibling) { // Si il n'éxiste pas déjà un élément suivant, on le crée
		dummyElement = document.createElement('p')
		dummyElement.appendChild(document.createTextNode('\u00A0'))
		ele.parentNode.appendChild(dummyElement)
	}
	let nextElement: Element = ele.nextElementSibling; // Élement suivant
	//nextElement.tabIndex = 0

	// Déplacement du curseur
	(<HTMLElement>nextElement).focus()
	var r = document.createRange();
	r.setStart(nextElement.childNodes[0], 0);
	r.setEnd(nextElement.childNodes[0], 0);
	var s = window.getSelection();
	s.removeAllRanges();
	s.addRange(r);

	if (dummyElement) {
		dummyElement.remove() // Si on a crée un élément, on le supprime
	} else {
		e.preventDefault() // Sinon on annule l'insertion d'une entrée
	}
}

/**
 * Récupère l'URL entrée dans le champ de la modal d'insertion et
 * l'insère dans l'éditeur summernote. Ferme aussi la modal
 */
function insertImageFromUrl() {
	const field = elts.insert.imageByUrlValue;
	insertImg(field.value)
	modalManager.closeAllModal()
	field.value = ""
}

/**
 * Récupère l'URL entrée dans le champ de la modal d'insertion et
 * l'insère dans l'éditeur summernote. Ferme aussi la modal
 */
function insertImageFromFile() {
	const field = elts.insert.imageByFileValue
	const files = field.files;
	Array.from(files).forEach((f: { path: any; })=>{
		// Copie de l'image dans le répertoire de travail
		const copiedImagePath = ipc.sendSync('copyFileToWorkingFolder', f.path)
		insertImg(copiedImagePath)
	})
	modalManager.closeAllModal()
	field.value = ""
}

/**
 * Extrait l'url de l'image en ignorant les métadonnées type abc.jpg?<metadonnées>
 * @param {String} src HTMLImageElement.src - Source de l'image
 */
function extractUrlFromSrc(src: string) {
	if (src.includes("?")) {
		return /^[\s\S]*\?/.exec(src)[0].replace('?', '')
	} else {
		return src
	}
}

/**
 * Cherche dans l'éditeur summernote l'image donnée par l'url et la rafarichit en mettant
 * a jour les métadonnées de la source (image.jpg?<metadonnées>)
 * @param {String} url 
 */
function refreshImg(url: any) {
	let $images = document.getElementsByClassName('note-editing-area')[0].querySelectorAll("img")
	$images.forEach((i: { src: string; }) => {
		// Pour l'instant, applique la MAJ sur toutes les images (pour simplifier le code)
		i.src = extractUrlFromSrc(i.src) + "?" + new Date().getTime();
	})
	setIsFileModified(true)
}

/**
 * Définit le contenu complet de l'éditeur selon le code "content"
 * @param {String} content Contenu de la note à charger (code html)
 */
function setNoteContent(content: string) {
	// Conversion des anciens formats de noxunote en HTML (ne gère pas les tableaux)
	if (content.includes("@NOXUNOTE_BEGIN")) {
		console.log("Ancien format détecté, formattage ...")
		content = toNewFormat(content)
	}
	editor.summernote('reset')
	editor.summernote('code', content)
	const editorContent = document.getElementsByClassName("note-editable")[0]
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, editorContent]);
}

$('#editorRoot').click(() => { editor.summernote('focus') })

/**
 * Met à jour le dictionnaire de mots suggerés par summernote en fonction de la BDD.
 */
function refreshDictionnary() {
	// TODO
}
/***************************************************************************************************
 *                                    INITIALISATION DU SCRIPT                                     *
 ***************************************************************************************************/

// Enable tab character insertion on default input
generateMatList()

notificationService.showNotification("Bienvenue dans NoxuNote", `version ${ipcRenderer.sendSync('getVersion')}`, 4000)

/***************************************************************************************************
 *      ASSOCIATION DES ÉVÈNEMENTS DE L'IPC AUX FONCTIONS DU PROCESSUS GRAPHIQUE (AU DESSUS).      *
 ***************************************************************************************************/
ipcRenderer.on('setNoteTitle', (event: any, title: any) => setNoteTitle(title))
ipcRenderer.on('setNoteMatiere', (event: any, matiere: any) => setNoteMatiere(matiere))
ipcRenderer.on('callSaveAsNoxuNote', (event: any) => save_as_noxunote())
ipcRenderer.on('resetIsFileModified', (event: any) => setIsFileModified(false))
ipcRenderer.on('updateDb', (event: any) => { plugins.find(p=>p instanceof BrowsePlugin).init(); generateMatList(); refreshDictionnary() })
ipcRenderer.on('setNoteContent', (event: any, note: any) => setNoteContent(note))
ipcRenderer.on('insertDrawing', (event: any, url: any) => insertImg(url))
ipcRenderer.on('refreshImg', (event: any, url: any) => refreshImg(url))
ipcRenderer.on('electron_request_close', (event: any) => closeWindow()) // Permet de gérer graphiquement l'alerte de sauvegarde
ipcRenderer.on('showNotification', (event: any, notification: string)=>{
	// On reçoit un objet Notification serialisé, il faut le transformer en objet
	const notifArgs = JSON.parse(notification)
	if (notifArgs.b1Action) notifArgs.b1Action = eval(notifArgs.b1Action) // On déserialise les fonctions
	if (notifArgs.b2Action) notifArgs.b2Action = eval(notifArgs.b2Action)
	notificationService.showNotification(
		notifArgs.title,
		notifArgs.content,
		notifArgs.timeout,
		notifArgs.b1Text,
		notifArgs.b1Action,
		notifArgs.b2Text,
		notifArgs.b2Action
	)
})
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
const { ipcRenderer, shell } = require('electron')
const os = require("os")
const toNewFormat = require("./migration")

import * as $ from "jquery";
import { NotificationService } from "./NotificationService"
import { CalcPlugin } from './plugins/calc';
import { NoxunotePlugin, Matiere, Note, NoteMetadata } from "../../types";
import { TodoPlugin } from "./plugins/todo";
import { BrowsePlugin } from "./plugins/browse";
import { ModalManager } from "./ModalManager";
import { EquationManager } from "./EquationManager";
import { InfoPlugin } from "./plugins/info";


declare var HTML5TooltipUIComponent: any; // html5tooltips has no type.d.ts file

const editor = $('#summernote')

const elts = {
	header: {
		titrePrincipal: document.getElementById("TitrePrincipal"),
		matiere: document.getElementById('matiere'),
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
	menuGaucheOuvrir: {
		menu: document.getElementById('menuGaucheOuvrir'),
		triggers: [document.getElementById('menuGaucheOuvrirTrigger')],
		allMat: document.getElementById('allMat'),
		allMatNotesCount: document.getElementById('allMatNotesCount'),
		matList: document.getElementById('matList'),
		filesList: document.getElementById('filesList'),
		fileLookup: document.getElementById('fileLookup'),
		fileTextSearch: <HTMLInputElement>document.getElementById('fileTextSearch')
	},
	toDo: {
		triggers: [document.getElementById('triggerTodo'), document.getElementById('triggerTodo2')],
		menu: document.getElementById('toDoBlock'),
		content: <HTMLInputElement>document.getElementById("toDoContent")
	},
	info: {
		triggers: [document.getElementById('triggerInfoBlock')],
		element: document.getElementById('infoBlock')
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
	new BrowsePlugin(elts.menuGaucheOuvrir, ipc),
	new InfoPlugin(elts.info)
]

/**
 * - Objet Note issu de la BDD (en cours d'édition)
 * Il doit toujours être à jour par rapport au contenu
 * en BDD.
 * - Vaut undefined ou null si on travaille sur une nouvelle Note.
 * Au moment de la sauvegarde, prend la valeur de la note sauvegardée en BDD.
 */
let loadedNote: Note = undefined;

/**
 * Définit la note actuellement chargée et met à jour l'affichage
 * @param note Note a afficher | null pour reset
 */
function setLoadedNote(note: Note): void {
	// Browseplugin
	let browser: BrowsePlugin =(<BrowsePlugin>plugins.find(p=>p instanceof BrowsePlugin))
	// En cas de reset
	if (note == null) {
		editor.summernote('reset')
		setIsFileModified(false)
	}
	browser.setLoadedNote(note)
	browser.init() // Met a jour l'affichage des fichiers
	// Si on charge une nouvelle note
	let assert1 = (loadedNote && note && loadedNote.meta.id != note.meta.id) 			// Une note est déjà ouverte, mais on veut en charger une AUTRE
	let assert2 = (!loadedNote && note)																						// Aucune note n'est déjà ouverte, mais on veut en charger une
	// Dans tous les autres cas, on ne touche pas à l'éditeur
	if ( assert1 || assert2 ) {
		// On met à jour l'éditeur
		setNoteContent(note.content)
		setIsFileModified(false)
	}
	loadedNote = note; // Mise à jour de la var locale.
	// Mise à jour de l'affichage
	if (note) {
		elts.header.titrePrincipal.innerText = note.meta.title
		// Si une matière est précisée
		let mat: Matiere = browser.matieres.find(m=>m.id==note.meta.matiere)
		if (mat) {
			elts.header.matiere.innerText = mat.name
			elts.header.matiere.style.display = "inline-block"
			elts.header.matiere.style.backgroundColor = mat.color
		} else {
			elts.header.matiere.style.display = "none"
		}
	} else {
		elts.header.titrePrincipal.innerText = "(Cliquez pour nommer la note)"
		elts.header.matiere.style.display = "none"
	}
}

// CTRL on windows, CMD on mac
const metaKey = os.type()=="Darwin"?"Cmd":"Ctrl"

var isFileModified = false
/**
 * Définit la variable isFileModified en mettant à jour l'affichage (disquette)
 * @param b Le fichier est il modifié par rapport au contenu du disque ?
 */
function setIsFileModified(b: boolean) {
	if (isFileModified != b) {
		if (b) 
			elts.header.modified.classList.add('displayed')
		else 
		elts.header.modified.classList.remove('displayed')
	}
	isFileModified = b
}


/**
 * Action à effectuer lorsque l'utilisateur choisit une option
 * dans la modale de confirmation de sauvegarde
 */
let saveConfirmationModalAction: Function = function () {}

// Manageur de modales
const modalManager = new ModalManager()
const notificationService: NotificationService = new NotificationService()
const equationManager = new EquationManager(modalManager, editor)

/***************************************************************************************************
 *                                    DÉCLARATION DES FONCTIONS                                    *
 ***************************************************************************************************/


/**
* Affiche/Masque le volet Menu Gauche Sauver
*/
function boutonMenuGaucheOuvrir() {
	(<BrowsePlugin>plugins.find(p => p instanceof BrowsePlugin)).toggle()
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
	// Si on éditait déjà une note
	if (loadedNote) {
		console.debug("Sauvegarde de la note deja existante", loadedNote.meta)
		// On met a jour le contenu de la note sauvée
		loadedNote.content = editor.summernote('code').toString()
		// Et on sauvegarde les changements en BDD
		setLoadedNote(ipc.sendSync('db_notes_saveNote', loadedNote))
	} else {
		console.debug("Sauvegarde d'une nouvelle note", editor.summernote('code'))
		// On définit la note actuellement editée
		setLoadedNote(ipc.sendSync('db_notes_saveNewNote', '(Sans titre)', editor.summernote('code').toString()))
		// On affiche la note sauvegardée dans la liste des notes.
		
	}
	setIsFileModified(false)
	// Recharge la liste des notes
	plugins.find(p => p instanceof BrowsePlugin).init()
}

/**
 * Appelle le module d'exportation html avec le code actuel de la summernote
 */
function openExport() {
	ipc.send('openExport', editor.summernote('code'));
}


//
// ─── REINITIALISATION INTERFACE ─────────────────────────────────────────────────
//

/**
 * Commande de création d'une nouvelle note
 * de manière douce
 */
function newFile() {
	if (isFileModified) {
		saveConfirmationModalAction = ()=>setLoadedNote(null) // On définit l'action de confirmation
		modalManager.openModal('saveConfirmationModal') // Ouvre la modale de confirmation
	} else { // Si aucune modification actuellement, on charge directement la note
		setLoadedNote(null)
	}	
}


function openSettings(key: any) {
	ipc.send('openSettings', key)
}

/**
 * Insère l'image donnée par l'url
 */
function insertImg(url: any) {
	editor.summernote('restoreRange')
	editor.summernote('focus')
	editor.summernote('insertImage', url, url)
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

let SchemaEditionButton = function (context: any) {
	let ui = ($ as any).summernote.ui;
	// create button
	let button = ui.button({
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

var InformationButton = function (context: any) {
	var ui = ($ as any).summernote.ui;
	// create button
	var button = ui.button({
		contents: '<i class="fas fa-info-circle"></i>',
		tooltip: 'Astuces / Signaler un bug',
		click: () => {
			(<InfoPlugin>plugins.find(p=>p instanceof InfoPlugin)).toggle()
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
			['info', ['informations']],
			['magic', ['style', 'specialChar']],
			['create', ['schemaCreation']],
			['fontsize', ['fontname', 'fontsize', 'color']],
			['style', ['bold', 'italic', 'underline']],
			['para', ['ol', 'paragraph']],
			['font', ['superscript', 'subscript']],
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
			schemaEdition: SchemaEditionButton,
			informations: InformationButton
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
			},
			onPaste: function () {
				setTimeout(()=>reattachEventListeners(), 0)
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
	let oldVersion: boolean = content.includes("@NOXUNOTE_BEGIN")
	if (oldVersion) {
		console.log("Ancien format détecté, formattage ...")
		content = toNewFormat(content)
	}
	editor.summernote('reset')
	editor.summernote('code', content)
	if (oldVersion) {
		const editorContent = document.getElementsByClassName("note-editable")[0]
		MathJax.Hub.Queue(["Typeset", MathJax.Hub, editorContent])
		alert('Attention, vous avez chargé une note provenant d\'une ancienne version,\n par soucis de compatibilité, évitez de la modifier. \n\nCréez une nouvelle note.')
	}
	reattachEventListeners()
}

/**
 * Search for particular content in note and re-addEventListener to these.
 */
function reattachEventListeners() {
	// MathNodes
	$('.note-editable').find('span.mathNode').get().forEach( (e: HTMLSpanElement) => {
		e.onclick = (ec: MouseEvent)=> {
			ec.stopPropagation()
			equationManager.editMathNode(e)
		}
	})
}

$('#editorRoot').click(() => { editor.summernote('focus') })

function triggerSaveEdit() {
	// Si une note est déjà en cours d'édition
	if (!loadedNote) {
		save_as_noxunote()
	}
	(<BrowsePlugin>plugins.find(p=>p instanceof BrowsePlugin)).focusOnNoteTitle()
}

/**
 * Met à jour le dictionnaire de mots suggerés par summernote en fonction de la BDD.
 */
function refreshDictionnary() {
	// TODO
	// const wordsDictionnary = ipcRenderer.sendSync('db_getAssocList').map((element: { output: any; }) => element.output)
	// editor.summernote({
	// 	/**
	// 	 * Suggestion automatique de mots
	// 	 */
	// 	hint: {
	// 		words: wordsDictionnary,
	// 		match: /\b(\w{1,})$/,
	// 		search: function (keyword: any, callback: (arg0: any) => void) {
	// 			callback($.grep(this.words, function (item: { indexOf: (arg0: any) => number; }) {
	// 				return item.indexOf(keyword) === 0;
	// 			}))
	// 		}
	// 	},
	// })
}

/**
 * Charge une note de manière douce
 * (Vérifie que l'ancienne est bien enregistrée etc.)
 */
function loadNote(note: Note) {
	// Lors d'un clic, définit l'action de la modale de confirmation
	// sur le chargement de la nouvelle note
	if (isFileModified) {
		saveConfirmationModalAction = ()=>setLoadedNote(note) // On définit l'action de confirmation
		modalManager.openModal('saveConfirmationModal') // Ouvre la modale de confirmation
	} else { // Si aucune modification actuellement, on charge directement la note
		setLoadedNote(note);
	}
	plugins.find(p=>p instanceof BrowsePlugin).init() // Met a jour l'affichage des fichiers
}
/***************************************************************************************************
 *                                    INITIALISATION DU SCRIPT                                     *
 ***************************************************************************************************/
notificationService.showNotification("Bienvenue dans NoxuNote", `version ${ipcRenderer.sendSync('getVersion')}<br>Si vous rencontrez un bug,<br>cliquez sur le premier bouton de la barre d'outils !`, 6000)

/***************************************************************************************************
 *      ASSOCIATION DES ÉVÈNEMENTS DE L'IPC AUX FONCTIONS DU PROCESSUS GRAPHIQUE (AU DESSUS).      *
 ***************************************************************************************************/
// ipcRenderer.on('setNoteTitle', (event: any, title: any) => setNoteTitle(title))
// ipcRenderer.on('setNoteMatiere', (event: any, matiere: any) => setNoteMatiere(matiere))
ipcRenderer.on('loadNote', (event: any, note: Note) => loadNote(note))
ipcRenderer.on('callSaveAsNoxuNote', (event: any) => save_as_noxunote())
ipcRenderer.on('resetIsFileModified', (event: any) => setIsFileModified(false))
ipcRenderer.on('updateDb', (event: any) => { 
	plugins.find(p=>p instanceof BrowsePlugin).init()
	refreshDictionnary()
	if (loadedNote) 
		setLoadedNote(ipcRenderer.sendSync('db_notes_getNote', loadedNote.meta.id))
})
ipcRenderer.on('insertDrawing', (event: any, url: any) => insertImg(url))
ipcRenderer.on('refreshImg', (event: any, url: any) => refreshImg(url))
ipcRenderer.on('forceReset', (event:any) => setLoadedNote(null))
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
ipcRenderer.on('updatedNoteMetadata', (event: any, meta: NoteMetadata) => {
	// Si la note mise à jour correspond à la note actuellement chargée
	if (loadedNote && loadedNote.meta.id == meta.id) {
		notificationService.showNotification(
			"Changements effectués 👍",
			"Les données de la note ont été éditées !",
			2000
		)
		// On charge les nouvelles données
		setLoadedNote({
			content: loadedNote.content, 	// Contenu actuel (inchangé)
			meta: meta 										// nouvelle métadata
		})
	}
})
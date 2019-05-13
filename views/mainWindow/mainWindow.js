/**
 * mainWindow.js - The core script of the rendering thread of NoxuNote (frontend side), handles interface to main.js
 * This script is called by index.html which is itself called by main.js
 * mainWindow.js and main.js communicate together through the ipc listener implemented in Electron
 * https://electronjs.org/docs/api/ipc-renderer
 */

/***************************************************************************************************
 *                                           CONSTANTES                                            *
 ***************************************************************************************************/

// Importing and creating electron aliases
const ipc = require('electron').ipcRenderer
const { ipcRenderer } = require('electron')
const { dialog } = require('electron').remote
const homedir = require('os').homedir()
const fs = require("fs")
const os = require("os")
const math = require("mathjs")
const ModalManager = require("./ModalManager.js")
const EquationManager = require('./EquationManager.js')
const toNewFormat = require("./migration")
var title = "not defined";
var isFileModified = false

const editor = $('#summernote')

/**
 * Action à effectuer lorsque l'utilisateur choisit une option
 * dans la modale de confirmation de sauvegarde
 */
let saveConfirmationModalAction = function () {}

// Manageur de modales
const modalManager = new ModalManager()
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
		document.getElementById('menuGaucheSauver').classList.toggle("appear");

		// Si présent, disparait
		if (!hiddenLeftOpen) {
			hiddenLeftOpen = true;
			document.getElementById('menuGaucheOuvrir').classList.toggle("appear");
		}

	} else {
		hiddenLeftSave = true;
		document.getElementById('menuGaucheSauver').classList.toggle("appear");
	}
}

/**
* Affiche/Masque le volet Menu Gauche Sauver
*/
function boutonMenuGaucheOuvrir() {
	// Apparait
	if (hiddenLeftOpen) {
		hiddenLeftOpen = false;
		document.getElementById('menuGaucheOuvrir').classList.toggle("appear");

		// Si présent, disparait
		if (!hiddenLeftSave) {
			hiddenLeftSave = true;
			document.getElementById('menuGaucheSauver').classList.toggle("appear");
		}
	} else {
		hiddenLeftOpen = true;
		document.getElementById('menuGaucheOuvrir').classList.toggle("appear");
	}
}


/**
* Affiche/Masque le volet menu d'aide
*/
var hiddenHelp = true;
function boutonAide() {
	if (hiddenHelp) {
		hiddenHelp = false;
		// document.getElementById('menuGaucheSauver').style.display = 'block';
		document.getElementById('menuDroitAide').classList.toggle("appear");
	} else {
		hiddenHelp = true;
		// document.getElementById('menuGaucheSauver').style.display = 'none';
		// http://jsfiddle.net/qrc8m/
		document.getElementById('menuDroitAide').classList.toggle("appear");
	}
}


/**
* Affiche/Masque le volet menu calculatrice
*/
var hiddenCalc = true;
function boutonCalculatrice() {
	if (hiddenCalc) {
		hiddenCalc = false;
		// document.getElementById('menuGaucheSauver').style.display = 'block';
		document.getElementById('menuBasCalc').classList.toggle("appear");
	} else {
		hiddenCalc = true;
		// document.getElementById('menuGaucheSauver').style.display = 'none';
		// http://jsfiddle.net/qrc8m/
		document.getElementById('menuBasCalc').classList.toggle("appear");
	}
}

/**
* Affiche/Masque le volet menu Todo
*/
var hiddenToDo = true;
function toDo() {
	if (hiddenToDo) {
		hiddenToDo = false;
		// document.getElementById('menuGaucheSauver').style.display = 'block';
		document.getElementById('toDoBlock').classList.toggle("appear");
	} else {
		hiddenToDo = true;
		// document.getElementById('menuGaucheSauver').style.display = 'none';
		// http://jsfiddle.net/qrc8m/
		document.getElementById('toDoBlock').classList.toggle("appear");
	}
}



/**
 * Ouvre une fenêtre de dessin
 * url - optionnel, permet d'éditer l'image donnée par l'url
 */
function dessiner(url) {
	ipc.send('dessiner', url);
}

/**
 * Enregistre la note au format NoxuNote
 */
function save_as_noxunote() {
	ipc.sendSync('save_as_noxunote', title, getMat(), editor.summernote('code'));
	isFileModified = false
	generateFileList()
}


/**
* Fonction appelée quand on entre un caractère dans le titre.
* met à jour la variable title et le titre du document (en haut)
*/
function onTypeOnTitle() {
	setTimeout(() => {
		title = document.getElementById('menuGaucheSauverInput').value.replace(/[><\/\\.]/g, "")
		document.getElementById('TitrePrincipal').innerHTML = title
		if (title == "") {
			document.getElementById("TitrePrincipal").innerHTML = "(Cliquez pour nommer la note)"
			title = "not defined";
		}
	}, 20)
}


/**
 * Nettoie entièrement l'affichage du document
 */
function clearContent() {
	var parent = document.getElementById('content')
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild)
	}
}


/**
 * Loads a file
 * @param path path to file
 */
function load_noxunote(name) {
	ipc.sendSync('load_noxunote', name)
}


function setNoteTitle(newtitle) {
	// Définition du titre
	title = newtitle
	if (newtitle == "") {
		document.getElementById("TitrePrincipal").innerHTML = "(Cliquez pour nommer la note)"
		document.getElementById("menuGaucheSauverInput").value = ""
		title = "not defined"
	} else {
		document.getElementById("TitrePrincipal").innerHTML = title
		document.getElementById("menuGaucheSauverInput").value = title
	}
}

/**
 * Affichage des matières disponibles dans SAUVER
 */
function calcEvaluate() {
	setTimeout(() => {
		var input = document.getElementById("calc").value
		var output = document.getElementById("calcResult")
		try {
			var result = math.eval(input)
			if (result.toString().length < 40) {
				if (result != "undefined") {
					output.innerHTML = result
				} else {
					output.innerHTML = "(indéfini)"
				}
			} else {
				output.innerHTML = "(indéfini)"
			}
		} catch (e) {
			output.innerHTML = "(indéfini)";
		}
	}, 20);
}

/**
 * Calcule et affiche la derivée de la fonction
 */
function calcEvaluateDerivative() {
	setTimeout(() => {
		var input = document.getElementById("calcDerivative").value;
		var output = document.getElementById("calcResultDerivative");
		try {
			var result = math.derivative(input, "x");
			if (result.toString().length < 40) {
				if (result != "undefined") {
					output.innerHTML = result;
				} else {
					output.innerHTML = "(indéfini)";
				}
			} else {
				output.innerHTML = "(indéfini)";
			}
		} catch (e) {
			output.innerHTML = "(indéfini)";
		}
	}, 20);
}

/**
 * Affichage de la liste des fichiers dans le menu sauver
 */
function generateFileList() {
	var listFilesDiv = document.getElementById("listFiles")
	var matieres = ipcRenderer.sendSync('db_getMatList')
	var files = ipcRenderer.sendSync('db_getFileList')

	// Nettoyage des fichiers affichés
	while (listFilesDiv.firstChild) {
		listFilesDiv.removeChild(listFilesDiv.firstChild);
	}

	// Mémorise les index des fichiers affichés
	let shownFiles = []

	// Ajoute un fichier à la liste des fichiers à ouvrir
	let addFile = f => {
		// Création de la pastille
		var matDiv = document.createElement('div')
		matDiv.classList += "pastille"
		matDiv.innerHTML = "•"
		matDiv.style.color = f.color
		listFilesDiv.appendChild(matDiv)

		// Création du texte
		var innerDiv = document.createElement('div')
		innerDiv.style.display = "inline"
		innerDiv.id = "file"
		// Ajout du tooltip
		let tooltip
		if (f.lastedit) {
			tooltip = new HTML5TooltipUIComponent;
			tooltip.set({
				animateFunction: "spin",
				color: "slate",
				stickDistance: 20,
				contentText: '<i class="fas fa-clock-o"></i> Dernière modif : ' + f.lastedit,
				stickTo: "right",
				target: innerDiv
			});
			innerDiv.addEventListener('mouseenter', () => tooltip.show());
			innerDiv.addEventListener('mouseleave', () => tooltip.hide());
			innerDiv.addEventListener('click', () => tooltip.hide());
			tooltip.mount();
		}
		const nomNote = f.nom.replace(".txt", "")
		innerDiv.innerHTML = nomNote
		
		innerDiv.onclick = () => {
			// Lors d'un clic, définit l'action de la modale de confirmation
			// sur le chargement de la nouvelle note
			if (isFileModified) {
				saveConfirmationModalAction = ()=>load_noxunote(nomNote) // On définit l'action de confirmation
				modalManager.openModal('saveConfirmationModal') // Ouvre la modale de confirmation
			} else { // Si aucune modification actuellement, on charge directement la note
				load_noxunote(nomNote)
			}
		}

		listFilesDiv.appendChild(innerDiv);

		// Ajout d'un br et inscription dans la liste des éléments affichés
		listFilesDiv.appendChild(document.createElement('br'))
		shownFiles.push(f.nom)
	}
	let addCategory = name => {
		listFilesDiv.appendChild(document.createElement('hr'))
		var innerDiv = document.createElement('h5')
		innerDiv.style.display = "inline"
		innerDiv.title = name
		innerDiv.innerHTML = '<span style="color: #EEEEEE">' + name + '</span>'
		listFilesDiv.appendChild(innerDiv)
		listFilesDiv.appendChild(document.createElement('br'))
	}

	// Affichage des matieres
	matieres.forEach(m => {
		addCategory(m.nom)
		files.filter(e => e['matiere'] === m.nom).forEach(addFile)
	})

	// Affichage des éléments non inscrits
	addCategory("Non triés")
	files.filter(e => !shownFiles.includes(e.nom)).forEach(addFile)
}

/**
 * Affichage des matières disponibles dans SAUVER
 */
function generateMatList(db) {
	// Suppression du conteneur actuel
	var matList = document.getElementById('matieres')
	while (matList.firstChild) {
		matList.removeChild(matList.firstChild)
	}

	// Récupération de la liste des matières
	var matieres = ipcRenderer.sendSync('db_getMatList')
	for (var i = 0; i < matieres.length; i++) {
		var innerDiv = document.createElement('div')
		innerDiv.id = "matiere"
		checkbox = "<input type='radio' name='mat' value='" + matieres[i].nom + "'>"
		innerDiv.innerHTML = checkbox + matieres[i].nom
		innerDiv.style.background = matieres[i].couleur
		matList.appendChild(innerDiv)
	}
}

/**
 * Renvoie la matière sélectionnée
 */
function getMat() {
	var form = document.getElementById('matieres').childNodes
	for (i = 0; i < form.length; i++) {
		console.log(form[i].firstChild);
		if (form[i].firstChild.checked) {
			return form[i].firstChild.value
		}
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
	const resetFunc = ()=>{
		setNoteTitle("");
		editor.summernote('reset')
		isFileModified = false
	}
	if (isFileModified) {
		saveConfirmationModalAction = resetFunc // On définit l'action de confirmation
		modalManager.openModal('saveConfirmationModal') // Ouvre la modale de confirmation
	} else { // Si aucune modification actuellement, on charge directement la note
		resetFunc.call()
	}	
}

/**
 * Commande de l'appui du bouton "image"
 */
function insertLocalImage() {
	ipc.send("insertLocalImage")
}

/**
 * Ouvre une fenêtre asciimath aide
 */
function showAsciiMathHelp() {
	ipc.send('loadExternalLink', 'http://asciimath.org')
}

/**
 * Ouvre une fenêtre tutoriel
 */
function showTutorial() {
	ipc.send('loadTutorial')
}

/**
 * Enregistre le contenu de la todo list lors de l'appui
 * sur la touche espace.
 */
function toDoKeyPressed(event) {
	var content = document.getElementById("toDoContent").value
	ipc.send('saveToDoContent', content)
}

/**
 * Met à jour le contenu du bloc notes avec le contenu du fichier
 */
function loadTodoFile() {
	var fileContent = ""
	try {
		fileContent = fs.readFileSync(homedir + "/NoxuNote/todo.txt").toString();
	} catch (e) {
		fileContent = ""
	}
	document.getElementById("toDoContent").value = fileContent
}

function openSettings(key) {
	ipc.send('openSettings', key)
}

/**
 * Définit une matière cochée par défaut dans le menu de sauvegarde, sinon coche neutre
 * @param {string} matiere La matière à cocher
 */
function setNoteMatiere(matiere) {
	let list = document.getElementById('matieres')
	let found = false
	list.childNodes.forEach(e => {
		if (e.firstChild.value === matiere) {
			e.firstChild.checked = true
			found = true
		}
		else e.firstChild.checked = false
	})
	if (!found) document.getElementById('matneutre').checked = true
}

/**
 * Insère l'image donnée par l'url
 */
function insertImg(url) {
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
var MediaButton = function (context) {
	var ui = $.summernote.ui;
	// create button
	var button = ui.button({
		contents: '<i class="fas fa-image"></i>',
		tooltip: 'Image, vidéo, dessin',
		click: () => { editor.summernote('saveRange'); modalManager.openModal("choixMediaModal") }
	});

	return button.render();   // return button as jquery object
}

var EquationButton = function (context) {
	var ui = $.summernote.ui;
	// create button
	var button = ui.button({
		contents: '<i class="fas fa-calculator"/>',
		tooltip: 'Équation',
		click: () => {
			editor.summernote('saveRange')
			modalManager.openModal("equationModal")
			equationManager.refreshHistory()
		}
	});
	return button.render();   // return button as jquery object
}

var SchemaCreationButton = function (context) {
	var ui = $.summernote.ui;
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

var SchemaEditionButton = function (context) {
	var ui = $.summernote.ui;
	// create button
	var button = ui.button({
		contents: '<i class="fas fa-pencil-ruler"></i>',
		tooltip: 'Modifier l\'image',
		click: () => {
			// Get highlighted image
			clickedImg = context.layoutInfo.editable.data('target')
			let url = ""
			if (os.type() == "Windows_NT") url = clickedImg.src.toString().replace("file:///", "") // Pas de slash au début des path windows
			else url = clickedImg.src.toString().replace("file:///", "/") // Slash au début des paths (chemins absolus) sous unix
			console.log('edition du fichier : ', extractUrlFromSrc(url))
			dessiner(extractUrlFromSrc(url))
		}
	});
	return button.render();   // return button as jquery object
}

$(document).ready(function () {
	let words = ipcRenderer.sendSync('db_getAssocList').map(element => element.output)
	editor.summernote({
		lang: 'fr-FR',
		focus: true,
    blockquoteBreakingLevel: 1,
		/**
		 * Suggestion automatique de mots
		 */
		hint: {
			words: words,
			match: /\b(\w{1,})$/,
			search: function (keyword, callback) {
				callback($.grep(this.words, function (item) {
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
			onChange: function (contents, $editable) {
				isFileModified = true
			},
			onKeydown: function (e) {
				/**
				 * Lors d'un appui sur entrée, on vérifie si la ligne débute par un marqueur NoxuNote
				 * Par exemple ##Titre doit transformer la ligne en un titre de niveau 2.
				 */
				if (e.keyCode === 13) {
					const selection = window.getSelection()
					const data = selection.getRangeAt(0).commonAncestorContainer.data // Stocke le contenu de la ligne entrée
					if (data) {
						const line = data.toString()
						if (line.substr(0, 3) === "###") {
							// Changement du format de la ligne
							editor.summernote("formatH1")
							// Suppression des caractères ### avec éventuels espaces au début
							selection.anchorNode.parentNode.innerText = selection.anchorNode.parentNode.innerText.toString().replace(/^[#\s]*/g, "")
							// Déplacement du curseur à la fin de la ligne
							setCursorAfterElement(selection.anchorNode.parentNode, e)
						}
						else if (line.substr(0, 2) === "##") {
							editor.summernote("formatH2")
							selection.anchorNode.parentNode.innerText = selection.anchorNode.parentNode.innerText.toString().replace(/^[#\s]*/g, "")
							setCursorAfterElement(selection.anchorNode.parentNode, e)
						}
						else if (line.substr(0, 1) === "#") {
							editor.summernote("formatH3")
							selection.anchorNode.parentNode.innerText = selection.anchorNode.parentNode.innerText.toString().replace(/^[#\s]*/g, "")
							setCursorAfterElement(selection.anchorNode.parentNode, e)
						}
					}
				}
			}
		}
	})
})

/**
 * Place le curseur après l'élément voulu en utilisant une méthode d'insertion
 * de balise, de déplacement de curseur, et de suppression de la balise.
 * @param {*} ele Element après lequel le curseur doit être inseré
 * @param {*} e Evenement type clavier
 */
function setCursorAfterElement(ele, e) {
	var dummyElement; // Élement fictif crée après ele
	if (!ele.nextElementSibling) { // Si il n'éxiste pas déjà un élément suivant, on le crée
		dummyElement = document.createElement('p')
		dummyElement.appendChild(document.createTextNode('\u00A0'))
		ele.parentNode.appendChild(dummyElement)
	}
	var nextElement = ele.nextElementSibling // Élement suivant
	//nextElement.tabIndex = 0

	// Déplacement du curseur
	nextElement.focus()
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
	const field = document.getElementById("imageByUrlValue");
	insertImg(field.value)
	modalManager.closeAllModal()
	field.value = ""
}

/**
 * Récupère l'URL entrée dans le champ de la modal d'insertion et
 * l'insère dans l'éditeur summernote. Ferme aussi la modal
 */
function insertImageFromFile() {
	const field = document.getElementById("imageByFileValue")
	const files = field.files;
	Array.from(files).forEach(f=>{
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
function extractUrlFromSrc(src) {
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
function refreshImg(url) {
	$images = document.getElementsByClassName('note-editing-area')[0].querySelectorAll("img")
	$images.forEach((i) => {
		// Pour l'instant, applique la MAJ sur toutes les images (pour simplifier le code)
		i.src = extractUrlFromSrc(i.src) + "?" + new Date().getTime();
	})
	isFileModified = true
}

/**
 * Définit le contenu complet de l'éditeur selon le code "content"
 * @param {String} content Contenu de la note à charger (code html)
 */
function setNoteContent(content) {
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
/***************************************************************************************************
 *                                    INITIALISATION DU SCRIPT                                     *
 ***************************************************************************************************/
// Génération de la liste des fichiers dans "Ouvrir"
generateFileList()

// Remplissage de la todolist
loadTodoFile()

// Enable tab character insertion on default input
generateMatList()


/***************************************************************************************************
 *      ASSOCIATION DES ÉVÈNEMENTS DE L'IPC AUX FONCTIONS DU PROCESSUS GRAPHIQUE (AU DESSUS).      *
 ***************************************************************************************************/
ipcRenderer.on('setNoteTitle', (event, title) => setNoteTitle(title))
ipcRenderer.on('setNoteMatiere', (event, matiere) => setNoteMatiere(matiere))
ipcRenderer.on('callSaveAsNoxuNote', (event) => save_as_noxunote())
ipcRenderer.on('resetIsFileModified', (event) => isFileModified = false)
ipcRenderer.on('updateDb', (event) => { generateFileList(); generateMatList(); generateAssocList() })
ipcRenderer.on('setNoteContent', (event, note) => setNoteContent(note))
ipcRenderer.on('insertDrawing', (event, url) => insertImg(url))
ipcRenderer.on('refreshImg', (event, url) => refreshImg(url))
ipcRenderer.on('electron_request_close', (event) => closeWindow()) // Permet de gérer graphiquement l'alerte de sauvegarde
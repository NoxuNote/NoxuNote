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
const math = require("mathjs")
const parser = require("../../parser.js")
const ModalManager = require("./ModalManager.js")
const EquationManager = require('./EquationManager.js')
var title = "not defined";
var isFileModified = false

const mediaModal = $('#choixMediaModal');
const editor = $('#summernote')


// Manageur de modales
const modalManager = new ModalManager()
const equationManager = new EquationManager(modalManager, editor)

/***************************************************************************************************
 *                                    DÉCLARATION DES FONCTIONS                                    *
 ***************************************************************************************************/

/**
* @param line la ligne sur laquelle le formulaire de modification est envoyée
* Fonction exécutée lors de l'appui sur le bouton Supprimer après edition d'une case
*/
function clicBoutonSupprimer(line) {
	ipc.send('delete_div', line);
}

function clicBoutonModifier(line) {
	ipc.send('entree_texte', line, getFormValue())
}

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
*/
function dessiner() {
	ipc.send('dessiner');
}


/**
 * Enregistre la note au format NoxuNote
 */
function save_as_noxunote() {
	ipc.send('save_as_noxunote', title, getMat(), editor.summernote('code'));
	setTimeout(() => generateFileList(), 200);
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
	ipc.send('load_noxunote', name, isFileModified)
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
		if (f.lastedit) {
			let tooltip = new HTML5TooltipUIComponent;
			tooltip.set({
				animateFunction: "spin",
				color: "slate",
				stickDistance: 20,
				contentText: '<i class="fa fa-clock-o" aria-hidden="true"></i> Dernière modif : ' + f.lastedit,
				stickTo: "right",
				target: innerDiv
			});
			innerDiv.addEventListener('mouseenter', () => tooltip.show());
			innerDiv.addEventListener('mouseleave', () => tooltip.hide());
			tooltip.mount();
		}
		innerDiv.innerHTML = f.nom.replace(".txt", "")
		innerDiv.onclick = () => load_noxunote(f.nom.replace(".txt", ""))
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
 * Appelle le module d'exportation html
 */
function openExport() {
	ipc.send('openExport');
}


/**
 * Commande de création d'une nouvelle note
 */
function newFile() {
	if (isFileModified) {
		var answer = dialog.showMessageBox({
			type: "question",
			buttons: ['Oui', 'Non', 'Annuler'],
			detail: "Si vous quittez sans enregistrer, le contenu ajouté risque d'être perdu.",
			title: "Avertissement",
			message: "Enregistrer les modifications ?"
		})
		if (answer == 0) {
			save_as_noxunote();
		} else if (answer == 2) {
			return
		}
	}
	ipc.send('reset');
	setNoteTitle("");
	isFileModified = false
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
 * Fonction qui enregistre le contenu de la todo list lors de l'appui
 * sur la touche espace.
 */
function toDoKeyPressed(event) {
	var content = document.getElementById("toDoContent").value
	ipc.send('saveToDoContent', content)
}

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
	list.childNodes.forEach(e=>{
		if (e.firstChild.value === matiere) {
			e.firstChild.checked = true
			found = true
		}
		else e.firstChild.checked = false
	})
	if (!found) document.getElementById('matneutre').checked = true
}

function maximizeWindow() {
	ipc.send("maximizeWindow");
}
function minimizeWindow() {
	ipc.send("minimizeWindow");
}
function closeWindow() {
	window.close()
}

/***************************************************************************************************
 *                                   				 SUMMERNOTE      			                                 *
 ***************************************************************************************************/
var MediaButton = function (context) {
  var ui = $.summernote.ui;
  // create button
  var button = ui.button({
    contents: '<i class="fa fa-picture-o"/>',
    tooltip: 'Image, vidéo, dessin',
    click: ()=>{editor.summernote('saveRange'); modalManager.openModal("choixMediaModal")}
  });

  return button.render();   // return button as jquery object
}

var EquationButton = function (context) {
  var ui = $.summernote.ui;
  // create button
  var button = ui.button({
    contents: '<i class="fa fa-calculator"/>',
    tooltip: 'Équation',
    click: ()=>{
			editor.summernote('saveRange')
			modalManager.openModal("equationModal")
			equationManager.refreshHistory()
		}
  });

  return button.render();   // return button as jquery object
}

$(document).ready(function() {
	let words = ipcRenderer.sendSync('db_getAssocList').map(element=>element.output)
  editor.summernote({
		lang: 'fr-FR',
		focus: true,
		hint: {
			words: words,
			match: /\b(\w{1,})$/,
			search: function (keyword, callback) {
				callback($.grep(this.words, function (item) {
					return item.indexOf(keyword) === 0;
				}))
			}
		},
		toolbar: [
			['magic', ['style']],
			['fontsize', ['fontname', 'fontsize', 'color']],
			['style', ['bold', 'italic', 'underline']],
			['para', ['ul', 'ol', 'paragraph']],
			['font', ['superscript', 'subscript']],
			['insert', ['media', 'equation', 'table']]
		],
		buttons: {
			media: MediaButton,
			equation: EquationButton
		}
	})
})

function insertImageFromUrl() {
	const field = document.getElementById("imageByUrlValue");
	editor.summernote('restoreRange')
	editor.summernote('focus')
	editor.summernote('insertImage', field.value, field.value)
	modalManager.closeAllModal()
	field.value = ""
}



const editableRegion = editor.find('[contenteditable]');
$('#editorRoot').click(()=>{editor.summernote('focus')})
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
ipcRenderer.on('callSaveAsNoxuNote', (event) => ipc.send('save_as_noxunote', title))
ipcRenderer.on('resetIsFileModified', (event) => isFileModified = false)
ipcRenderer.on('updateDb', (event) => { generateFileList(); generateMatList(); generateAssocList() })
ipcRenderer.on('setNoteContent', (event, note) => { editor.summernote('reset') ; editor.summernote('code', note) } )
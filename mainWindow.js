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
const parser = require("./parser.js")

var title = "not defined";
var isFileModified = false

let assoc // table des association abbréviation -> mot original
let mainInput // Formulaire principal
let editInput // Formulaire d'édition
let db

/***************************************************************************************************
 *                                    DÉCLARATION DES FONCTIONS                                    *
 ***************************************************************************************************/

/**
* Action lorsqu'une touche est pressée dans le body
*/
function bodyKeyPressed(event) {
	isFileModified = true
	if (event.which == 38) {
		// Appui sur la flèche vers le haut
		if (editInput && editInput.getModifiedLine() - 1 >= 0) {
			ipc.send('edit_div', editInput.getModifiedLine() - 1, getFormValue())
		} else {
			/*
			// Editer la dernière ligne de la note
			var lastElement = document.getElementById('content').lastChild
			// Si le dernier élément est un tableau, alors on sélectionne le dernier tr
			if (lastElement) {
				if (lastElement.nodeName == "TABLE") {
					lastElement = lastElement.lastChild
				}
				ipc.send('edit_div', lastElement.id, "")
			}
			*/
			ipc.send('edit_div', 0, '')
		}
	} else if (event.which == 40) {
		// Appui sur la flèche vers le bas
		ipc.send('edit_div', editInput.getModifiedLine() + 1, getFormValue())
	} else if (event.which == 32) {
		// Appui sur la touche espace, on extrait le dernier mot tapé
		let form = getActualForm()
		let posCursor = form.textarea.selectionStart
		let cutIn = form.value.slice(0, posCursor)
		let lastWord = /[\S]*?$/g.exec(cutIn)
		if (lastWord[0]) {
			// Maintenant que nous avons extrait le dernier mot, regardons s'il est dans la liste des abbréviations
			let query = assoc.find((e)=>e['input'] == lastWord[0])
			if (query) {
				event.preventDefault()
				let cutOut = form.value.slice(posCursor, form.value.length)
				let newCutIn = cutIn.replace(/[\S]*?$/, query.output.replace(/\$/g, '$\$$'))
				form.value = newCutIn + ' ' + cutOut
				form.textarea.selectionStart = newCutIn.length+1
				form.textarea.selectionEnd = newCutIn.length+1
			}
		}
	}
}

/**
* @param el l'élément que l'on veut modifier
* Ajoute la fonction de TAB sur un input/textarea
* source : https://jsfiddle.net/2wAzx/13/
*/
function enableTab(el) {
	el.onkeydown = function (e) {
		if (e.keyCode === 9) { // tab was pressed
			// get caret position/selection
			var val = this.value,
				start = this.selectionStart,
				end = this.selectionEnd;
			// set textarea value to: text before caret + tab + text after caret
			this.value = val.substring(0, start) + '\t' + val.substring(end);
			// put caret at right position again
			this.selectionStart = this.selectionEnd = start + 1;
			// prevent the focus lose
			return false;
		}
	};
}

/** 
 * @return le formulaire qui édite actuelement
*/
function getActualForm() {
	console.log(editInput || mainInput);
	return editInput || mainInput
}

/**
* @return le contenu du formulaire d'édition
*/
function getFormValue() {
	return getActualForm().value
}

/**
 * Génère une TR a partir d'une note brute type /a/b/c//
 * @param index {number} le numero de la tr
 * @param content {string} le contenu de la tr
 */
function parseTR(index, content) {
	console.log('parsing', content);
	return parser.parseTR(index, content)
}

/**
* @param index le numero de la div à ajouter
* @param content le contenu de la div
* Ajoute une balise de numero index et de contenu content à la fin des div child de "content"
*/
function addDiv(index, content) {
	// Si on reçoit un tableau
	console.log(content);
	if (content.substr(0, 1) == "/" && content.length > 3) {
		console.log('adding TR');
		var innerTR = parseTR(index, content)
		// Si l'élément précédent est une <tr></tr> alors on ajoute le innerTR à cette table précédente
		try {
			if (document.getElementById(index - 1).nodeName == "TR") {
				document.getElementById(index - 1).parentElement.appendChild(innerTR)
			} else { throw Error }
		}
		// Dans le cas contraire, on créee une table
		catch (e) {
			var innerTable = document.createElement('table')
			document.getElementById('content').appendChild(innerTable)
			innerTable.appendChild(innerTR)
		}
	} else {
		// Création et indexation de la nouvelle div
		var innerDiv = document.createElement('div');
		innerDiv.id = index;
		innerDiv.className = "line";
		innerDiv.onclick = function () { ipc.send('edit_div', index, getFormValue()) };
		document.getElementById("content").appendChild(innerDiv);
		// Remplissage de la div
		innerDiv.innerHTML = content;
	}

	// Insertion d'une balise d'insertion avant l'element
	var elt = document.getElementById(index)
	var insertDiv = document.createElement('div')
	insertDiv.id = index + "insertBefore"
	insertDiv.className = "insert_text"
	insertDiv.onclick = () => { clickInserter(index) }

	elt.innerHTML = "<div class=\"insert\"></div>" + elt.innerHTML
	elt.parentNode.insertBefore(insertDiv, elt)

	MathJax.Hub.Queue(["Typeset", MathJax.Hub, content]);
	PR.prettyPrint();
}


/**
 * @param line la ligne SUIVANT le curseur
 * Fonction qui insère un input au DESSUS d'une ligne line
 */
function clickInserter(line) {
	var actualFormContent = getFormValue()
	ipc.send('inserterClicked', line, actualFormContent)
}

/**
* @param index l'index de la div à modifier
* @param ancien_contenu 
* Masque le formulaire 'form_new' et remplace la div index par un textArea rempli par 'ancien contenu', (note NON PARSÉE)
*/
function moveForm(index, ancien_contenu) {
	// Cacher l'ancien formulaire
	mainInput.hide()
	// Form
	editInput = new NoxuInput(true, index, ipc, ancien_contenu)
	// Modif button
	boutonM = document.createElement("button")
	boutonM.id = 'edit'
	boutonM.onclick = () => { ipc.send('entree_texte', index, getFormValue()) }
	boutonM.innerHTML = "Modifier"
	// Delete button
	boutonS = document.createElement("button")
	boutonS.id = 'delete'
	boutonS.onclick = () => { ipc.send('delete_div', index) }
	boutonS.innerHTML = "Supprimer"
	// Insertion des elements dans la div
	var edited_div = document.getElementById(index);
	edited_div.innerHTML = ""
	edited_div.onclick = null
	edited_div.appendChild(editInput)
	edited_div.appendChild(boutonM)
	edited_div.appendChild(boutonS)
	editInput.setFocus()
}

/**
 * Réceptionnaire de l'évènement onKeyPressed lors de l'édition d'une ligne
 * @param event {event} evenement de frappe
 */
function inputKeyPressed(event) {
	if (event.which == 13) ipc.send('entree_texte', parseInt(event.target.id), event.target.value)
}


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
* @param {number} line ligne de la div à éditer
* @param {string} content nouveau contenu de la div
* Modification du contenu de la DIV et réécriture du déclencheur onClick.
*/
function setDivContent(line, content) {
	// Si on reçoit un tableau
	console.log('entree');
	if (content.substr(0, 1) == "/" && content.length > 3) {
		var innerTR = parseTR(line, content)
		console.log('ECHEC');

		// On supprime la div actuelle
		var toDel = document.getElementById(line)
		toDel.parentNode.removeChild(toDel)

		// On mémorise les éléments précédents et suivants s'ils existent
		var prec;
		var suiv;
		try { prec = document.getElementById(line - 1) } catch (e) { prec = null }
		try { suiv = document.getElementById(line + 1) } catch (e) { suiv = null }


		/* L'extrait de code si dessous est un peu laborieux,
		 * mais il permet de traiter tous les cas possibles de modification de tableaux sans avoir à
		 * recharger toute la page (à éviter !!). Si la modification est trop complexe pour etre réalisée ici, 
		 * comme une fusion/séparation de <table>, alors on recharge la page
		 *
		if ( (prec!=null && prec.nodeName == "TR") && ( (suiv!=null && suiv.nodeName!="TR") || suiv==null ) ) {
			// Si l'élément précédent est une <tr></tr> mais pas le suivant alors on ajoute le innerTR après cet élément
			// On ajoute la notre à la fin
			var prec = document.getElementById(line-1)
			if (prec.nextSibling) { // Si il éxiste un élément après l'élément précédent, on l'insère avant
				prec.parentNode.insertBefore(innerTR, prec.nextSibling)
			} else {
				prec.parentNode.appendChild(innerTR)
			}
		} else if ( ( (prec!=null && prec.nodeName != "TR") || prec==null) && (suiv!=null && suiv.nodeName=="TR") ) {
			// Si l'élément suivant est une <tr></tr> mais pas le précédent alors on ajoute le innerTR au début de la table
			var suiv = document.getElementById(line+1)
			console.log(line)
			suiv.parentNode.insertBefore(innerTR, suiv)
			console.log(suiv)
		} else if ( (prec!=null && prec.nodeName != "TR") && (suiv!=null && suiv.nodeName!="TR") ) {
			// Si aucun des éléments a coté n'est une tr
			var innerTable = document.createElement('table')
			document.getElementById('content').appendChild(innerTable)
			// On ajoute la TR a notre table
			innerTable.appendChild(innerTR)
			// On ajoute notre table avant l'element suivant
			suiv.parentNode.insertBefore(innerTable, suiv) 
		} else {
			// Si l'élément est situé entre deux tableaux, il faut les fusionner ou les séparer
			// On regénère la page.
			ipc.send('reloadContent');
		}*/
		ipc.send('reloadContent');

	} else {
		var oldElt = document.getElementById(line)
		// Si l'élément était une div, alors on met juste à jour son contenu
		if (oldElt.nodeName == "DIV") {
			oldElt.innerHTML = content;
			oldElt.onclick = function () { ipc.send('edit_div', line, getFormValue()) }
		} else {
			// Si l'élément était une ligne de tableau, en ultime recours, on regénère la page.
			// Nécessaire car trop compliqué à traiter si l'élément romp un tableau.
			ipc.send('reloadContent');
		}

	}
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, document.getElementById(line)]);
	PR.prettyPrint();
}

/**
* Fait réapparaître le formulaire initial form.
*/
function restoreMainForm() {
	mainInput.show()
	mainInput.setFocus()
	editInput = null
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
	ipc.send('save_as_noxunote', title, getMat());
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
		matDiv.title = f.matiere
		matDiv.style.color = f.color
		listFilesDiv.appendChild(matDiv)

		// Création du texte
		var innerDiv = document.createElement('div')
		innerDiv.style.display = "inline"
		innerDiv.id = "file"
		innerDiv.title = f.matiere
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
		files.filter(e => e['matiere'] === m.nom).forEach(f => addFile(f))
	})

	// Affichage des éléments non inscrits
	addCategory("Non triés")
	files.filter(e => !shownFiles.includes(e.nom)).forEach(f => addFile(f))
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

/**
 * Charge le contenu de la base de données des associations
 */
function generateAssocList() {
	assoc = ipcRenderer.sendSync('db_getAssocList')
}

/***************************************************************************************************
 *                                    INITIALISATION DU SCRIPT                                     *
 ***************************************************************************************************/
// Génération de la liste des fichiers dans "Ouvrir"
generateFileList()

// Remplissage de la todolist
loadTodoFile()

// Enable tab character insertion on default input
generateMatList()

// Generate association table
generateAssocList()

mainInput = new NoxuInput(false, -1, ipc)
document.getElementById("contentbot").appendChild(mainInput)


/***************************************************************************************************
 *      ASSOCIATION DES ÉVÈNEMENTS DE L'IPC AUX FONCTIONS DU PROCESSUS GRAPHIQUE (AU DESSUS).      *
 ***************************************************************************************************/
ipcRenderer.on('changeInput', (event, field_content) => mainInput.value = field_content)
ipcRenderer.on('addDiv', (event, index, content) => addDiv(index, content))
ipcRenderer.on('moveForm', (event, index, ancien_contenu) => moveForm(index, ancien_contenu))
ipcRenderer.on('setDivContent', (event, line, content) => setDivContent(line, content))
ipcRenderer.on('restoreMainForm', (event) => restoreMainForm())
ipcRenderer.on('clearContent', (event) => clearContent())
ipcRenderer.on('setNoteTitle', (event, title) => setNoteTitle(title))
ipcRenderer.on('setNoteMatiere', (event, matiere) => setNoteMatiere(matiere))
ipcRenderer.on('callSaveAsNoxuNote', (event) => ipc.send('save_as_noxunote', title))
ipcRenderer.on('resetIsFileModified', (event) => isFileModified = false)
ipcRenderer.on('updateDb', (event) => { generateFileList(); generateMatList(); generateAssocList() })
let regex = {
	fluo: 		/\*\*[\s\S]*?\*\*/g,
	souligne: 	/\_\_[\s\S]*?\_\_/g,
	italique: 	/\:\:[\s\S]*?\:\:/g,
	gras: 		/\+\+[\s\S]*?\+\+/g,
	math: 		/\$\$[_]*/g,
	title1: 	/^([\#]{1})[^\#]/g,
	title2: 	/^([\#]{2})[^\#]/g,
	title3: 	/^([\#]{3})[^\#]/g
}

/**
 * Compilateur ligne par ligne NOXUNOTE -> HTML
 * Convertit tout sauf les tableaux qui sont transmis sous forme brute et les balises image
 * @param {string} texte une chaîne de caractère au format NoxuNote entrée par l'utilisateur.
 * @return la chaîne compilée au format HTML visible dans le processur graphique. 
 */
function noteToHtml(texte) {

	try {
		// Suppression des espaces inutiles.
		texte = texte.trim();
		original = texte

		// Remplacement des $$ en ` pour les formules mathématiques
		texte = texte.replace(regex.math, "`");

		// Les tableaux sont générés à part
		if (texte.substr(0, 1) == "/") {
			return texte
		}
		texte = texte.replace(regex.fluo, (x) => { return "<em>" + x.slice(2, -2) + "</em>" });
		texte = texte.replace(regex.souligne, (x) => { return "<u>" + x.slice(2, -2) + "</u>" });
		texte = texte.replace(regex.italique, (x) => { return "<i>" + x.slice(2, -2) + "</i>" });
		texte = texte.replace(regex.gras, (x) => { return "<b>" + x.slice(2, -2) + "</b>" });
		
		if (texte.search(regex.title1) != -1) {
			return "<h3>" + texte.replace('#', '') + "</h3>";
		}
		else if (texte.search(regex.title2) != -1) {
			return "<HR size='1px' width='20%'><h2>" + texte.replace('##', '') + "</h2>";
		}
		else if (texte.search(regex.title3) != -1) {
			return "<HR><br><h1>" + texte.replace('###', '') + "</h1>";
		}
		else if (texte.substr(0, 4) == "img=") {
			return "<img src=\"" + texte.substr(4).trim() + "\">";
		}
		else if (texte.substr(0, 5) == "img =") {
			return "<img src=\"" + texte.substr(5).trim() + "\">";
		}
		else if (texte.substr(0, 6) == "image=") {
			return "<img src=\"" + texte.substr(6).trim() + "\">";
		}
		else if (texte.substr(0, 7) == "image =") {
			return "<img src=\"" + texte.substr(7).trim() + "\">";
		}
		else if (texte.substr(0, 1) == "[") {
			return "<span class='encadre'>" + texte.substr(1).trim() + "</span>";
		}
		else if (texte.substr(0, 1) == "!") {
			return "<span id='important'><i class='fa fa-exclamation-triangle' aria-hidden='true'></i> " + texte.substr(1).trim() + "</span>";
		}
		else if (texte.substr(0, 1) == "(") {
			return "<span id='optionnal'>(" + texte.substr(1).trim().replace(')', '') + ")</span>";
		}
		else if (texte.substr(0, 1) == ">") {
			return '<xmp class="prettyprint">' + original.substr(1).replace(/\t/g, '    ') + "</xmp>";
			// Les balises code sont maintenant générées dans mainWindow.js dans la fonction addDiv et editDiv
			// 1return texte
		}
		else if (texte == "") {
			return '<br>';
		} else if (texte.substr(0,4) == "<img") {
			return texte
		} else {
			return "<span class='flat_text'>" + texte + "</span>";
		}

	} catch (e) {
		console.log('Erreur conversion note vers HTML :');
		console.log(e);
		return texte;
	}
}

/**
 * Génère une TR a partir d'une note brute type /a/b/c//
 * @param index {number} le numero de la tr
 * @param content {string} le contenu de la tr
 */
function parseTR(index, content) {
	// On remplace les slash situés dans des balises math par {NoxuSlash} pour ne pas interférer avec les tableaux
	content = content.replace(/\`[\s\S]*?.\`/g, (x) => { return x.replace(/\//g, '{NoxuSlash}')})

	// Effacement de la première slash
	content = content.substr(1)
	// Division du texte en groupes de forme [ 'a /', 'b c //', 'd /', 'e ///', 'f /' ]
	var groups = content.match(/[\s\S]*?\/{1,}/g)
	// Compteur de / pour chaque groupe
	var groupsColSpan = new Array(groups.length)
	// Comptage des / et suppression
	for (var i = 0; i < groups.length; i++) {
		groupsColSpan[i] = /(\/){1,}/g.exec(groups[i])[0].length
		groups[i] = groups[i].replace(/\//g, "").trim()
	}

	// On construit le <tr>
	var innerTR = document.createElement("tr")
	innerTR.id = index
	innerTR.onclick = function() { ipc.send('edit_div', index, getFormValue()) }

	// Pour chaque cellule/groupe, on insère un TD de taille correspondante
	for (var i = 0; i < groups.length; i++) {
		var cell = innerTR.insertCell(-1)
		cell.colSpan 	= groupsColSpan[i]
		cell.innerHTML 	= groups[i]
	}

	// Remplacement des balises NoxuNote
	innerTR.innerHTML = innerTR.innerHTML.replace(/{NoxuSlash}/g, '/')
	innerTR.innerHTML = innerTR.innerHTML.replace(regex.fluo, (x) => { return "<em>" + x.slice(2, -2).trim() + "</em>" });
	innerTR.innerHTML = innerTR.innerHTML.replace(regex.souligne, (x) => { return "<u>" + x.slice(2, -2).trim() + "</u>" });
	innerTR.innerHTML = innerTR.innerHTML.replace(regex.gras, (x) => { return "<b>" + x.slice(2, -2).trim() + "</b>" });

	return innerTR
}

exports.noteToHtml 		= noteToHtml
exports.parseTR			= parseTR
// Importing and creating electron aliases
const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const ipc = require('electron').ipcRenderer
const { ipcRenderer } = require('electron')
const effecteur = require('./Effecter.js')
const parser = require("./parser.js")
const { StylePreset } = require('./StylePreset.js')

function makeExport() {
    ipcRenderer.send("makePreview", customStyle.preset.format, customStyle.generateCss())
    document.getElementById("exportButton").className = "waves-effect waves-light btn disabled"
}

ipcRenderer.on('mainOutputWindowClosed', () => {
    document.getElementById("exportButton").className = "waves-effect waves-light btn"
})

/***************************************************************************************************
 *                                  REDIMENSIONNEMENT DE LA PAGE                                   *
 ***************************************************************************************************/
function updateDim() {
    let ref = 900
    let x = (window.innerWidth / ref) - 0.32
    if (x > 1) x = 1
    document.getElementById('page').style.transform = `scale(${x}, ${x})`
    let w = window.innerWidth - 300
    document.getElementById('rightPart').style.width = w + 'px'
    document.getElementById('leftPart').style.height = window.innerHeight + 8 + 'px'
}
window.addEventListener('resize', () => updateDim())
updateDim()


/***************************************************************************************************
 *                                      CHARGEMENT DE LA NOTE                                      *
 ***************************************************************************************************/

/**
* @param content le contenu de la div
* Ajoute une balise de contenu content à la fin des div child de "content"
*/
function addDiv(content, index) {
    // Si on reçoit un tableau
    if (content.substr(0, 1) == "/") {

        // On le divise en 2 arrays, l'un contenant le textes des cellules(groupes), l'autre le colspan des cellules
        // On a un texte de la forme
        //     / texte / texte /
        //     / texte //
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
        //innerTR.onclick = function () { ipc.send('edit_div', index, document.getElementById('form').value) }

        // Pour chaque cellule/groupe, on insère un TD de taille correspondante
        for (var i = 0; i < groups.length; i++) {
            var cell = innerTR.insertCell(-1)
            cell.colSpan = groupsColSpan[i]
            cell.innerHTML = groups[i]
        }

        // Si l'élément précédent est une <tr></tr> alors on ajoute le innerTR à cette table précédente
        try {
            if (document.getElementById(index - 1).nodeName == "TR") {
                document.getElementById(index - 1).parentElement.appendChild(innerTR)
            } else {
                // Sinon on créee une table
                var innerTable = document.createElement('table')
                document.getElementById('content').appendChild(innerTable)
                innerTable.appendChild(innerTR)
            }
        }
        // Dans le cas contraire, on créee une table
        catch (e) {
            var innerTable = document.createElement('table')
            document.getElementById('content').appendChild(innerTable)
            innerTable.appendChild(innerTR)
        }

    } else {
        // Création et indexation de la nouvelle div
        var innerDiv = document.createElement('div')
        innerDiv.id = index
        innerDiv.className = "line"
        document.getElementById("content").appendChild(innerDiv)
        // Remplissage de la div
        innerDiv.innerHTML = content
    }

    MathJax.Hub.Queue(["Typeset", MathJax.Hub, content])
    PR.prettyPrint()
}

// Quand le main.js à envoyé tous les éléments de la note, on attend que MathJax ait fini le rendu et on
// Envoie l'ordre d'imprimer
function onUploadedContent() {
    MathJax.Hub.Register.StartupHook("End", function () {
        var images = document.querySelectorAll('img')
        Array.from(images).forEach((image) => {
            if (image.className != "schema") {
                effecteur.whiteTransformation(image)
                    .then((result) => {
                        image.src = result
                    })
            }

        })
        // Méthode à modifier ! : On laisse 200ms au programme pour modifier toutes les images
        //setTimeout(()=>ipc.send('outputReady'), 1000)
    })
}

ipcRenderer.on('setNote', (event, note) => {
    for (var i = 1; i < note.length; i++) {
        addDiv(parser.noteToHtml(note[i]), i)
    }
    onUploadedContent()
})

/***************************************************************************************************
*                               SYNTHÈSE DES DONNÉES DU FORMULAIRE                                *
***************************************************************************************************/
customStyle = new StylePreset()

function getSelectedValue(query) {
    return $(query).val()
}
function setSelectedValue(query, value) {
    // Ancienne méthode
    // $(query).find(`option[value="${value}"]`).prop('selected', true);
    let el = $(query)
    el.val(value)
    el.formSelect()
}
function setRangeValue(query, value) {
    $(query).val(value)
}


function loadPreset(preset) {
    let s = preset.jcss
    // Format
    setSelectedValue('#format', preset.format)
    // Page
    setRangeValue('#pagePaddingTop', s.general.paddingTop)
    setRangeValue('#pagePaddingLeft', s.general.paddingLeft)
    setRangeValue('#pagePaddingRight', s.general.paddingRight)
    // h3
    setSelectedValue('#policeTitre3', s.h3.fontFamily)
    setRangeValue('#sizeTitre3', s.h3.fontSize)
    setSelectedValue('#alignTitre3', s.h3.textAlign)
    setRangeValue('#marginLeftTitre3', s.h3.marginLeft)
    setRangeValue('#marginTopTitre3', s.h3.marginTop)
    // h2
    setSelectedValue('#policeTitre2', s.h2.fontFamily)
    setRangeValue('#sizeTitre2', s.h2.fontSize)
    setSelectedValue('#alignTitre2', s.h2.textAlign)
    setRangeValue('#marginLeftTitre2', s.h2.marginLeft)
    setRangeValue('#marginTopTitre2', s.h2.marginTop)
    // h1
    setSelectedValue('#policeTitre1', s.h1.fontFamily)
    setRangeValue('#sizeTitre1', s.h1.fontSize)
    setSelectedValue('#alignTitre1', s.h1.textAlign)
    setRangeValue('#marginLeftTitre1', s.h1.marginLeft)
    setRangeValue('#marginTopTitre1', s.h1.marginTop)
    // Corps de texte
    setSelectedValue('#policeCorps', s.p.fontFamily)
    setRangeValue('#sizeCorps', s.p.fontSize)
    setSelectedValue('#alignCorps', s.p.textAlign)
    setRangeValue('#marginLeftCorps', s.p.marginLeft)
    setRangeValue('#marginTopCorps', s.p.marginTop)
    setRangeValue('#marginRightCorps', s.p.marginRight)
    // Tableau
    setSelectedValue('#policeTableau', s.table.fontFamily)
    setSelectedValue('#alignCellulesTableau', s.table.textAlign)
    setRangeValue('#sizeTableau', s.table.fontSize)
    setRangeValue('#paddingCellulesTableau', s.table.padding)
    setRangeValue('#epaisseurLignesTableau', s.table.borderLength)
    setRangeValue('#alignTableau', s.table.alignTable)
    setRangeValue('#marginLeftTableau', s.table.marginLeft)
    setRangeValue('#marginTopTableau', s.table.marginTop)
    setRangeValue('#marginBottomTableau', s.table.marginBottom)

    onFormChange()
}

function onFormChange() {
    let s = customStyle.preset.jcss
    // Format
    customStyle.preset.format = getSelectedValue('#format')
    // Page
    s.general.paddingTop = getSelectedValue('#pagePaddingTop')
    s.general.paddingLeft = getSelectedValue('#pagePaddingLeft')
    s.general.paddingRight = getSelectedValue('#pagePaddingRight')
    // h3
    s.h3.fontFamily = getSelectedValue('#policeTitre3')
    s.h3.fontSize = getSelectedValue('#sizeTitre3')
    s.h3.textAlign = getSelectedValue('#alignTitre3')
    s.h3.marginLeft = getSelectedValue('#marginLeftTitre3')
    s.h3.marginTop = getSelectedValue('#marginTopTitre3')
    // h2
    s.h2.fontFamily = getSelectedValue('#policeTitre2')
    s.h2.fontSize = getSelectedValue('#sizeTitre2')
    s.h2.textAlign = getSelectedValue('#alignTitre2')
    s.h2.marginLeft = getSelectedValue('#marginLeftTitre2')
    s.h2.marginTop = getSelectedValue('#marginTopTitre2')
    // h1
    s.h1.fontFamily = getSelectedValue('#policeTitre1')
    s.h1.fontSize = getSelectedValue('#sizeTitre1')
    s.h1.textAlign = getSelectedValue('#alignTitre1')
    s.h1.marginLeft = getSelectedValue('#marginLeftTitre1')
    s.h1.marginTop = getSelectedValue('#marginTopTitre1')
    // Corps de texte
    s.p.fontFamily = getSelectedValue('#policeCorps')
    s.p.fontSize = getSelectedValue('#sizeCorps')
    s.p.textAlign = getSelectedValue('#alignCorps')
    s.p.marginLeft = getSelectedValue('#marginLeftCorps')
    s.p.marginTop = getSelectedValue('#marginTopCorps')
    s.p.marginRight = getSelectedValue('#marginRightCorps')
    // Tableau
    s.table.fontFamily = getSelectedValue('#policeTableau')
    s.table.textAlign = getSelectedValue('#alignCellulesTableau')
    s.table.fontSize = getSelectedValue('#sizeTableau')
    s.table.padding = getSelectedValue('#paddingCellulesTableau')
    s.table.borderLength = getSelectedValue('#epaisseurLignesTableau')
    s.table.alignTable = getSelectedValue('#alignTableau')
    s.table.marginLeft = getSelectedValue('#marginLeftTableau')
    s.table.marginTop = getSelectedValue('#marginTopTableau')
    s.table.marginBottom = getSelectedValue('#marginBottomTableau')
    applyRawCss(customStyle.generateCss())
}

function applyRawCss(css) {
    // On récupère l'élément de style
    let style = document.getElementById('customStyle')
    // On supprime tous les noeuds enfants
    while (style.firstChild) {
        style.removeChild(style.firstChild);
    }
    // On ajoute notre style au noeud
    style.appendChild(document.createTextNode(css))
}

// Sliders
$("#sizeTitre3").on("input", function(){onFormChange()});
$("#marginLeftTitre3").on("input", function(){onFormChange()});
$("#marginTopTitre3").on("input", function(){onFormChange()});
$("#sizeTitre2").on("input", function(){onFormChange()});
$("#marginLeftTitre2").on("input", function(){onFormChange()});
$("#marginTopTitre2").on("input", function(){onFormChange()});
$("#sizeTitre1").on("input", function(){onFormChange()});
$("#marginLeftTitre1").on("input", function(){onFormChange()});
$("#marginTopTitre1").on("input", function(){onFormChange()});
$("#sizeCorps").on("input", function(){onFormChange()});
$("#marginLeftCorps").on("input", function(){onFormChange()});
$("#marginRightCorps").on("input", function(){onFormChange()});
$("#marginTopCorps").on("input", function(){onFormChange()});
$("#sizeTableau").on("input", function(){onFormChange()});
$("#paddingCellulesTableau").on("input", function(){onFormChange()});
$("#epaisseurLignesTableau").on("input", function(){onFormChange()});
$("#alignTableau").on("input", function(){onFormChange()});
$("#marginLeftTableau").on("input", function(){onFormChange()});
$("#marginTopTableau").on("input", function(){onFormChange()});
$("#marginBottomTableau").on("input", function(){onFormChange()});
$("#pagePaddingTop").on("input", function(){onFormChange()});
$("#pagePaddingLeft").on("input", function(){onFormChange()});
$("#pagePaddingRight").on("input", function(){onFormChange()});

loadPreset(customStyle.preset)
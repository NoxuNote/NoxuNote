// Importing and creating electron aliases
const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const ipc = require('electron').ipcRenderer
const { ipcRenderer } = require('electron')
const effecteur = require('./Effecter.js')
const parser = require("./parser.js")

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
 *                                         STYLE DYNAMIQUE                                         *
 ***************************************************************************************************/
// Ajout du style manuel pour les hover
let css = ` div#content {
                margin: 1.2cm;
                font-size: 1.0em;
            }
            h3 {
                margin-top: 25px;
                margin-bottom: 5px;
            }
            h2 {
                margin-left: auto;
            }
            h1 {
                text-align: center;
            }
            em {
                color: #16150B;
                background-color: rgba(229, 234, 65, 0.89);
                padding: 0.1em;
                font-style: normal;
            }
            span#important {
                background-color: #C95705;
                border-radius: 3px;
                color: #FFFFFF;
                padding: 5px;
                display: inline-block;
                margin-top: 3px;
            }
            span#optionnal {
                display: block;
                text-align: right;
                font-size: 0.8em;
                color: #9FA2A1;
            }
            img {
                max-width: 100%;
                margin-left: auto;
                margin-right: auto;
            }
            .encadre {
                border: 2px solid #121212;
                padding: 1px;
            }
            table {
                border-collapse: collapse;
                margin-bottom: 12px;
                margin-top: 6px;
                margin-left: auto;
                margin-right: auto;
            }
            td, tr {
                border: 1px solid #000000;
                padding: 5px;
                background-color: #e9f2f7;
                text-align: center;
            }
            .flat_text {
                margin-left: 3%;
            }`
let style = document.createElement('style')
style.appendChild(document.createTextNode(css));
document.getElementsByTagName('head')[0].appendChild(style);


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
        innerTR.onclick = function () { ipc.send('edit_div', index, document.getElementById('form').value) }

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

function getSelectedValue(query) {
    return $(query).val()
}
function setSelectedValue(query, value) {
    $(query).find(`option[value="${value}"]`).prop('selected', true);
}
function setRangeValue(query, value) {
    $(query).val(value)
}

var preset = {
    format: 'PDF',
    titres: {
        titre3: {
            fontFamily: 'Arial',
            fontSize: 50
        },
        titre2: {
            fontFamily: 'FlatLight',
            fontSize: 25
        },
        titre1: {
            fontFamily: 'FlatBold',
            fontSize: 12
        }
    },
    paragraphes: {
        fontFamily: 'Arial',
        fontSize: 12,
        textAlign: 'left',
    },
    tableaux: {
        border: '1px solid black',
        fontSize: 12,
        textAlign: 'left',
        backgroundColor: '#FFFFFF',
        color: 'black,'
    }
}

function loadPreset(preset) {
    setSelectedValue('#format', preset.format)
    setSelectedValue('#policeTitre3', preset.titres.titre3.fontFamily)
    setRangeValue('#sizeTitre3', preset.titres.titre3.fontSize)
    setSelectedValue('#policeTitre2', preset.titres.titre2.fontFamily)
    setRangeValue('#sizeTitre2', preset.titres.titre2.fontSize)
    setSelectedValue('#policeTitre1', preset.titres.titre1.fontFamily)
    setRangeValue('#sizeTitre1', preset.titres.titre1.fontSize)
}

loadPreset(preset)
console.log($('#policeTitre3').val())
// Importing and creating electron aliases
const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const ipc = require('electron').ipcRenderer
const { ipcRenderer } = require('electron')
const effecteur = require('../mainDrawWindow/Effecter.js')
const parser = require("../../parser.js")
const fontList = require('font-list')

import { StylePreset } from './StylePreset'
import { CSSPreset } from './CSSPreset';
type $ = any

const content = document.getElementById("content")

function makeExport() {
    ipcRenderer.send("makePreview", customStyle.preset.format, customStyle.generateCss(), content.innerHTML)
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


// Quand le main.js à envoyé tous les éléments de la note, on attend que MathJax ait fini le rendu et on
// Envoie l'ordre d'imprimer
function onUploadedContent() {
    let images = document.querySelectorAll('img')
    Array.from(images).forEach((image: HTMLImageElement) => {
        if (image.classList.contains('schema')) {
            effecteur.whiteTransformation(image)
                .then((result: string) => {
                    image.src = result
                })
        }

    })
}

ipcRenderer.on('setNote', (event: any, note: string) => {
    content.innerHTML = note
    onUploadedContent()
})

/***************************************************************************************************
*                               SYNTHÈSE DES DONNÉES DU FORMULAIRE                                *
***************************************************************************************************/
let customStyle: StylePreset = new StylePreset()

function getSelectedValue(query: string) {
    return $(query).val()
}
function setSelectedValue(query: string, value: any) {
    // Ancienne méthode
    // $(query).find(`option[value="${value}"]`).prop('selected', true);
    let el: any = $(query) // type "any" because formSelect not in jQuery but in MaterializeCSS
    el.val(value)
    el.formSelect()
}
function setRangeValue(query: string, value: string | number) {
    $(query).val(value)
}


function loadPreset(preset: { format: string, jcss: CSSPreset }) {
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
    customStyle.preset.format = <string>getSelectedValue('#format')
    // Page
    s.general.paddingTop = <number>getSelectedValue('#pagePaddingTop')
    s.general.paddingLeft = <number>getSelectedValue('#pagePaddingLeft')
    s.general.paddingRight = <number>getSelectedValue('#pagePaddingRight')
    // h3
    s.h3.fontFamily = <string>('#policeTitre3')
    s.h3.fontSize = <number>getSelectedValue('#sizeTitre3')
    s.h3.textAlign = <string>getSelectedValue('#alignTitre3')
    s.h3.marginLeft = <number>getSelectedValue('#marginLeftTitre3')
    s.h3.marginTop = <number>getSelectedValue('#marginTopTitre3')
    // h2
    s.h2.fontFamily = <string>getSelectedValue('#policeTitre2')
    s.h2.fontSize = <number>getSelectedValue('#sizeTitre2')
    s.h2.textAlign = <string>getSelectedValue('#alignTitre2')
    s.h2.marginLeft = <number>getSelectedValue('#marginLeftTitre2')
    s.h2.marginTop = <number>getSelectedValue('#marginTopTitre2')
    // h1
    s.h1.fontFamily = <string>getSelectedValue('#policeTitre1')
    s.h1.fontSize = <number>getSelectedValue('#sizeTitre1')
    s.h1.textAlign = <string>getSelectedValue('#alignTitre1')
    s.h1.marginLeft = <number>getSelectedValue('#marginLeftTitre1')
    s.h1.marginTop = <number>getSelectedValue('#marginTopTitre1')
    // Corps de texte
    s.p.fontFamily = <string>getSelectedValue('#policeCorps')
    s.p.fontSize = <number>getSelectedValue('#sizeCorps')
    s.p.textAlign = <string>getSelectedValue('#alignCorps')
    s.p.marginLeft = <number>getSelectedValue('#marginLeftCorps')
    s.p.marginTop = <number>getSelectedValue('#marginTopCorps')
    s.p.marginRight = <number>getSelectedValue('#marginRightCorps')
    // Tableau
    s.table.fontFamily = <string>getSelectedValue('#policeTableau')
    s.table.textAlign = <string>getSelectedValue('#alignCellulesTableau')
    s.table.fontSize = <number>getSelectedValue('#sizeTableau')
    s.table.padding = <number>getSelectedValue('#paddingCellulesTableau')
    s.table.borderLength = <number>getSelectedValue('#epaisseurLignesTableau')
    s.table.alignTable = <string>getSelectedValue('#alignTableau')
    s.table.marginLeft = <number>getSelectedValue('#marginLeftTableau')
    s.table.marginTop = <number>getSelectedValue('#marginTopTableau')
    s.table.marginBottom = <number>getSelectedValue('#marginBottomTableau')
    applyRawCss(customStyle.generateCss())
}

function applyRawCss(css: string) {
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
$("#sizeTitre3").on("input", function () { onFormChange() });
$("#marginLeftTitre3").on("input", function () { onFormChange() });
$("#marginTopTitre3").on("input", function () { onFormChange() });
$("#sizeTitre2").on("input", function () { onFormChange() });
$("#marginLeftTitre2").on("input", function () { onFormChange() });
$("#marginTopTitre2").on("input", function () { onFormChange() });
$("#sizeTitre1").on("input", function () { onFormChange() });
$("#marginLeftTitre1").on("input", function () { onFormChange() });
$("#marginTopTitre1").on("input", function () { onFormChange() });
$("#sizeCorps").on("input", function () { onFormChange() });
$("#marginLeftCorps").on("input", function () { onFormChange() });
$("#marginRightCorps").on("input", function () { onFormChange() });
$("#marginTopCorps").on("input", function () { onFormChange() });
$("#sizeTableau").on("input", function () { onFormChange() });
$("#paddingCellulesTableau").on("input", function () { onFormChange() });
$("#epaisseurLignesTableau").on("input", function () { onFormChange() });
$("#alignTableau").on("input", function () { onFormChange() });
$("#marginLeftTableau").on("input", function () { onFormChange() });
$("#marginTopTableau").on("input", function () { onFormChange() });
$("#marginBottomTableau").on("input", function () { onFormChange() });
$("#pagePaddingTop").on("input", function () { onFormChange() });
$("#pagePaddingLeft").on("input", function () { onFormChange() });
$("#pagePaddingRight").on("input", function () { onFormChange() });

/***************************************************************************************************
 *                                              FONTS                                              *
 ***************************************************************************************************/
let fonts: string[] = []

function applyFonts() {
    // let idsFormSelectors = ["policeTitre3"]
    // // Suppression de tous les enfants
    // idsFormSelectors.forEach(id => {
    //     let form = document.getElementById(id)
    //     while (form.firstChild) {
    //         form.removeChild(form.firstChild)
    //     }
    // })
    // Ajout des enfants

    // setup listener for custom event to re-initialize on change

    // initialize

    const selectorIds = ['#policeTitre3', '#policeTitre2', '#policeTitre1', '#policeCorps', '#policeTableau']
    const selectors = selectorIds.map(id => $(id))
    fonts.forEach(font => {
        selectors.forEach((s: any) => {
            let $newOpt = $(`<option style='font-family: ${font}; color: black'>`).attr("value", font).text(font.replace(/"/g, ''))
            s.append($newOpt)
            s.formSelect();
        })
    })
}

function loadFontList() {
    fontList.getFonts()
        .then((availableFonts: string[]) => {
            fonts = availableFonts
            applyFonts()
        })
        .catch((err: any) => {
            console.log(err)
        })


}

loadPreset(customStyle.preset)
loadFontList()
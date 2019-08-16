
// Importation des librairies electron du processus de rendu
const { ipcRenderer } = require('electron')
const eprompt = require('electron-prompt')
const homedir = require('os').homedir();
import { ColorPicker } from './ColorPicker'
import { Matiere } from '../../types';
import { StringPrompt } from '../../components/StringPrompt';
import { ConfirmationPrompt } from '../../components/ConfirmationPrompt';
import * as $ from "jquery";
import { stringify } from 'querystring';


// Mise a jour du contenu de la page lors du clic sur une catégorie
var page = document.getElementById("page")
function show(content: string) {
  page.innerHTML = document.getElementById(content.trim()).innerHTML
  switch (content.trim()) {
    case "Matières":
      loadTableMatieres()
      break
    case "Dactylographie":
      loadTableAssoc()
      break
  }
}

document.getElementById("path").innerHTML = homedir + '/NoxuNote/'

// Réception des ordres de l'IPC qui demandent de switch vers un onglet (key)
ipcRenderer.on('switch', (event: any, key: string) => show(key))

/***************************************************************************************************
 *                                            MATIÈRES                                             *
 ***************************************************************************************************/
let colorPicker;
let matList: Matiere[];
let colors: string[] = ipcRenderer.sendSync('db_getColors')

function editMatName(mat: Matiere) {
  let sp = new StringPrompt("Changer le nom", "", {label: "Nom", placeholder: "Ma matière", value: mat.name})
  sp.getPromise().then(r=>{
    let trimmed = r.trim()
    if (trimmed.length>0) {
      matList = ipcRenderer.sendSync('db_matieres_setProperty', 'name', r, mat.id)
      loadTableMatieres()
    }
  })
}

/**
 * Crée un colorpicker
 * @param event MousevEvent : Permet de récupérer la position du clic pour positionner le ColorPicker
 * @param target Element parent dans lequel sera inseré le colorpicker
 * @param mat Matiere à editer
 */
function editMatColor(event: MouseEvent, target: HTMLElement, mat: Matiere) {
  // Création du colorpicker et récupération de son element crée
  let colorPicker: HTMLElement = new ColorPicker(colors, mat, target).element
  // placement de l'élement du colorpicker
  colorPicker.style.top = event.pageY.toString()
  colorPicker.style.left = event.pageX.toString()
  // Lors de l'appui sur une case, on modifie la couleur
  colorPicker.addEventListener('colorClicked', (e: CustomEvent) => {
    ipcRenderer.sendSync('db_matieres_setProperty', 'color', e.detail.color, e.detail.matiereId)
    loadTableMatieres()
  })
  target.appendChild(colorPicker)
}

function deleteMat(mat: Matiere) {
  let cp = new ConfirmationPrompt('Supprimer une matière', `Êtes vous sûr de vouloir supprimer <b>${mat.name}</b>`)
  cp.getPromise().then(()=>{
    matList = ipcRenderer.sendSync('db_matieres_removeMat', mat.id)
    loadTableMatieres()
  })
}

function loadTableMatieres() {
  matList = ipcRenderer.sendSync('db_matieres_getMatieres')
  var tableMatieres = document.getElementById("tableMatieres")
  // clearing table
  var maTRs = tableMatieres.childNodes
  while (maTRs.length > 2) {
    tableMatieres.removeChild(tableMatieres.lastChild)
    maTRs = tableMatieres.childNodes
  }

  matList.forEach(matiere => {
    var innerTR = document.createElement('tr')
    let innerTD1 = document.createElement('td')
    innerTD1.innerText = matiere.name
    innerTD1.className = "editable large"
    innerTD1.addEventListener("click", ()=>editMatName(matiere), false)


    var innerTD2 = document.createElement('td')
    innerTD2.className = "clicable large"
    innerTD2.innerHTML = "<i class='fas fa-paint-brush' style='color: " + matiere.color + "'></i>"
    innerTD2.addEventListener("click", function (e) {
      if (e.target instanceof HTMLElement) {
        // Si on n'a pas cliqué sur un colorpicker déjà ouvert
        if (!e.target.classList.contains('colorpicker')) {
          // On en crée un
          editMatColor(e, e.target.parentElement, matiere)
          // if (e.target.nodeName == "I") editMatColor(e, e.target.parentElement, matiere)
          // else editMatColor(e, e.target, matiere)
        }
      }
    }, false)

    var innerTD3 = document.createElement('td')
    innerTD3.className = "editable large"
    innerTD3.innerHTML = "<center><i id='" + i + "' class='fas fa-trash red clicable'></i></center>"
    innerTD3.addEventListener("click", function (e) {
      deleteMat(matiere)
    }, false)

    innerTR.appendChild(innerTD1)
    innerTR.appendChild(innerTD2)
    innerTR.appendChild(innerTD3)

    tableMatieres.appendChild(innerTR)
  })
  for (var i = 0; i < matList.length; i++) {
    
  }
}

function ajouterMatiere() {
  let sp = new StringPrompt('Ajouter une matière', '', {label: 'Nom', placeholder: 'Physique'})
  sp.getPromise().then(r => {
    let trimmed = r.trim()
    if (trimmed.length>0) {
      matList = ipcRenderer.sendSync('db_matieres_addMat', trimmed, 'grey')
      loadTableMatieres()
    }
  })
}

/***************************************************************************************************
 *                                         DACTYLOGRAPHIE                                          *
 ***************************************************************************************************/
var assoc = ipcRenderer.sendSync('db_getAssocList')

function deleteAssoc(mot: string) {
  let cp = new ConfirmationPrompt('Supprimer un raccourci', `Êtes vous sûr de vouloir supprimer le raccourci <b>${mot}</b>`)
  cp.getPromise().then(()=>{
    assoc = ipcRenderer.sendSync('db_removeAssoc', mot)
    loadTableAssoc()
  })
}

function loadTableAssoc() {
  assoc = ipcRenderer.sendSync('db_getAssocList')
  let tableAssoc = document.getElementById('tableAssoc')
  // Nettoyage du tableau
  let noTRs = tableAssoc.childNodes
  while (noTRs.length > 2) {
    tableAssoc.removeChild(tableAssoc.lastChild)
    noTRs = tableAssoc.childNodes
  }
  // Complétion du tableau
  assoc.forEach( (assoc: {input:string, output: string})=>{
    var innerTR = document.createElement('tr')
    var innerTD2 = document.createElement('td')
    var innerTD3 = document.createElement('td')

    // Plus besoin de raccourci depuis la maj summernote
    // innerTD1.innerHTML = assoc[i].input
    innerTD2.innerHTML = assoc.input
    innerTD3.className = "editable large"
    innerTD3.innerHTML = "<center><i class='fas fa-trash red clicable'></i></center>"
    innerTD3.addEventListener("click", () => {
      deleteAssoc(assoc.input)
    }, false)

    innerTR.appendChild(innerTD2)
    innerTR.appendChild(innerTD3)
    tableAssoc.appendChild(innerTR)
  })
}

function ajouterAssoc() {
  let sp = new StringPrompt('Ajouter un mot raccourci', '', {label: 'Mot', placeholder: 'Anticonstitution'})
  sp.getPromise().then(r => {
    let trimmed = r.trim()
    if (trimmed.length>0) {
      assoc = ipcRenderer.sendSync('db_addAssoc', trimmed, trimmed) // Pour l'instant, le mot est associé à lui même.
      loadTableAssoc()
    }
  })
}


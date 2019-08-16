
// Importation des librairies electron du processus de rendu
const { ipcRenderer } = require('electron')
const eprompt = require('electron-prompt')
const homedir = require('os').homedir();
import { ColorPicker } from './ColorPicker'
import { Matiere } from '../../types';

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
  eprompt.prompt({
    title: 'Modifier "' +mat.name + '"',
    label: 'Nouveau nom :',
    value: mat.name,
    inputAttrs: { // attrs to be set if using 'input'
      type: 'text'
    },
  })
    .then((r: string) => {
      if (r && r.trim().length) {
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

function deleteMat(i: number) {
  eprompt.prompt({
    title: 'Confirmation',
    label: 'Supprimer définitivement ' + matList[i].name + ' ?',
    type: 'select', // 'select' or 'input, defaults to 'input'
    selectOptions: { // select options if using 'select' type
      '1': 'Supprimer et conserver les notes',
      '3': 'Ne rien faire',
    }
  })
    .then((r: string) => {
      if (r && r != "3") {
        matList = ipcRenderer.sendSync('db_matieres_removeMat', matList[i].id)
        loadTableMatieres()
      }
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
      deleteMat(i)
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
  eprompt.prompt({
    title: 'Ajouter une matière',
    label: 'Nom :',
    value: '',
    inputAttrs: { // attrs to be set if using 'input'
      type: 'text'
    },
  })
    .then((r: string) => {
      if (r && r.trim().length) {
        matList = ipcRenderer.sendSync('db_matieres_addMat', r, 'grey')
        loadTableMatieres()
      }
    })
}

/***************************************************************************************************
 *                                         DACTYLOGRAPHIE                                          *
 ***************************************************************************************************/
var assoc = ipcRenderer.sendSync('db_getAssocList')

function deleteAssoc(id: number) {
  eprompt.prompt({
    title: 'Confirmation',
    label: 'Supprimer définitivement ' + assoc[id]['input'] + ' ?',
    type: 'select', // 'select' or 'input, defaults to 'input'
    selectOptions: { // select options if using 'select' type
      '1': 'Supprimer',
      '2': 'Ne rien faire',
    }
  })
    .then((r: string) => {
      if (r && r != "2") {
        assoc = ipcRenderer.sendSync('db_removeAssoc', assoc[id]['input'])
        loadTableAssoc()
      }
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
  for (var i = 0; i < assoc.length; i++) {
    var innerTR = document.createElement('tr')
    var innerTD1 = document.createElement('td')
    var innerTD2 = document.createElement('td')
    var innerTD3 = document.createElement('td')

    // Plus besoin de raccourci depuis la maj summernote
    // innerTD1.innerHTML = assoc[i].input
    innerTD1.innerHTML = "(Aucun)"
    innerTD2.innerHTML = assoc[i].output
    innerTD3.className = "editable large"
    innerTD3.innerHTML = "<center><i id='" + i + "' class='fas fa-trash red clicable'></i></center>"
    innerTD3.addEventListener("click", () => {
      deleteAssoc(i)
    }, false)

    innerTR.appendChild(innerTD1)
    innerTR.appendChild(innerTD2)
    innerTR.appendChild(innerTD3)
    tableAssoc.appendChild(innerTR)

  }
}

function ajouterAssoc() {

  // Plus besoin de prompt r1 depuis la maj summernote
  const r1 = "(Aucun)"

  // prompt({
  //     title: 'Ajouter une abbréviation',
  //     label: 'Abbréviation :',
  //     value: '',
  //     inputAttrs: { // attrs to be set if using 'input'
  //         type: 'text'
  //     },
  // })
  //     .then((r1) => {
  if (r1 && r1.trim().length) {
    eprompt.prompt({
      title: 'Ajouter une abbréviation',
      label: 'Mot original :',
      value: '',
      inputAttrs: { // attrs to be set if using 'input'
        type: 'text'
      },
    })
      .then((r2: string) => {
        if (r2 && r2.trim().length) {
          assoc = ipcRenderer.sendSync('db_addAssoc', r1, r2)
          loadTableAssoc()
        }
      })
  }
  // })
}


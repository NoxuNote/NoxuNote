import { NoxunotePlugin, NoteMetadata, Matiere, Note } from "../../../types";
import { IpcRenderer, TouchBarButton, Input } from "electron";
import { isNull } from "util";
import $ = require("jquery");

export type BrowseElements = {
  menu: HTMLElement,
  triggers: HTMLElement[],
  allMat: HTMLElement,
  allMatNotesCount: HTMLElement,
  matList: HTMLElement,
  filesList: HTMLElement,
  fileLookup: HTMLElement,
  fileTextSearch: HTMLInputElement,
}

export class BrowsePlugin implements NoxunotePlugin {

  public noteList: NoteMetadata[]
  public matieres: Matiere[]

  /**
   * Image de la variable loadedNote de mainWindow.js
   * mise à jour grace à la fonction setLoadedNote() présente dans mainWindow.js
   * qui appelle la méthode de cette classe.
   */
  private loadedNote: Note

  /**
   * ID de la note visible dans "Aperçu" sur laquelle on vient de cliquer dans l'arborescence
   */
  private clickedNoteId: string;

  /**
   * ID de la matiere a filtrer dans les notes
   */
  private clickedMatiereId: string;
  
  constructor(public elts: BrowseElements, public ipc: IpcRenderer) {
    this.init()
    // this.elts.triggers.forEach( (e: HTMLElement) => {
    //   e.addEventListener('click', )
    // })
  }
  
  init() {
    // Mise a jour de la liste des notes
    this.noteList = this.ipc.sendSync('db_notes_getNoteList')
    // Si un note est cliquée dans l'arborescence et qu'elle éxiste encore dans la liste des notes
    // /!\ Suppose que this.noteList est à jour avec la BDD.
    if (this.clickedNoteId && this.noteList.map(nl=>nl.id).includes(this.clickedNoteId)) {
      // On met a jour l'affichage lookup sur les données de cette note
      this.renderLookup(this.clickedNoteId)
    } else {
      // Sinon on n'affiche rien
      this.clickedNoteId = null
      this.elts.fileLookup.innerHTML = ""
    }
    // Lors de la modification du champ de recherche de fichier, MAJ l'affichage
    this.elts.fileTextSearch.addEventListener('keyup', ()=>this.renderFiles())
    // Lors du clic sur "Toutes les notes", reset le filtre de matiere
    this.elts.allMat.addEventListener('click', ()=>{
      this.clickedMatiereId = null
      this.renderMatieres()
      this.renderFiles()
    })
    this.renderFiles()
    this.renderMatieres()
  }

  loadNote(id: string) {
    let note: Note = this.ipc.sendSync('db_notes_getNote', id)
    this.ipc.send('loadNote', note)
  }

  /**
   * Génère la vue des fichiers
   * @param updateNoteList Synchronise la liste des notes avec la BDD
   * @param selectedMatiereId Optionnel - Id de la matière à filtrer
   * @param orderBy Optionnel - Paramètre de tri
   */
  renderFiles(updateNoteList: boolean = false, selectedMatiereId?: string, orderBy?: string) {
    console.debug('Génération de la liste des notes (Browse)')
    if (updateNoteList) this.noteList = this.ipc.sendSync('db_notes_getNoteList')
    // clean allfiles node on document
    var child = this.elts.filesList.lastElementChild;  
    while (child) { 
        this.elts.filesList.removeChild(child); 
        child = this.elts.filesList.lastElementChild;  
    } 
    // Filter notes to display
    let displayedNotes: NoteMetadata[] = this.noteList.filter(n=> {
      let titleCondition = n.title.toLowerCase().includes(this.elts.fileTextSearch.value.toLowerCase())
      let matiereCondition = this.clickedMatiereId==null? true : n.matiere==this.clickedMatiereId
      return titleCondition && matiereCondition
    })
    // create node for each filesList
    console.debug(`Génération d'un élément HTML pour la liste de notes ${JSON.stringify(displayedNotes.map(n=>n.title))}`)
    displayedNotes.forEach( (n: NoteMetadata) => {
      this.elts.filesList.appendChild(this.generateFileElement(n))
    })
  }

  /**
   * Génère la vue de l'onglet Aperçu
   * @param noteId iD de la note à afficher
   */
  renderLookup(noteId: string) {
    if (!this.noteList.map(nl=>nl.id).includes(noteId)) {
      console.error(`BrowsePlugin.renderLookup(${noteId}) a été call avec l'id ${noteId} qui n'éxiste plus !`)
      return
    }
    this.elts.fileLookup.innerHTML = ""
    let note: Note = this.ipc.sendSync('db_notes_getNote', noteId)
    // Table d'informations
    let rechMat: Matiere = this.matieres.find(m=>m.id==note.meta.matiere)
    let data: Array<{a:string, b:string|HTMLElement}> = [
      {
        a: "Titre",
        b: this.generateTitreInput(note.meta)
      },
      {
        a: "Matière",
        b: this.generateMatiereSelector(note.meta)
      },
      {
        a: "Favoris",
        b: this.generateIsFavoriteCheckbox(note.meta)
      },
      {
        a: "Dernière modif.",
        b: note.meta.lastedit
      },
      {
        a: "Id",
        b: note.meta.id
      },
      {
        a: "Fichier",
        b: note.meta.filename
      }
    ]
    let table = this.generateTable(data)
    table.classList.add('fileDetailsTable')
    this.elts.fileLookup.appendChild(table)
    // Titre
    let previewTitle = document.createElement('h4')
    previewTitle.innerText = "Contenu"
    this.elts.fileLookup.appendChild(previewTitle)
    // Preview
    let preview = document.createElement('div')
    preview.innerHTML = note.content
    preview.classList.add('notePreview')
    this.elts.fileLookup.appendChild(preview)
    // Load button
    let button = document.createElement('button')
    button.classList.add("btn", "btn-secondary", "float-right", "mt-0")
    button.innerHTML = '<i class="fas fa-pen"></i> Ouvrir'
    button.addEventListener('click', ()=>this.ipc.send('loadNote', note))
    this.elts.fileLookup.appendChild(button)
    // Delete button
    let deleteButton = document.createElement('button')
    deleteButton.classList.add("btn", "btn-danger", "float-right", "mt-0")
    deleteButton.innerHTML = '<i class="fas fa-pen"></i> Supprimer'
    deleteButton.addEventListener('click', ()=>{
      if (confirm('Voulez vous vraiment supprimer cette note ?')) {
        // Si la note correspond à celle ouverte, on demande un reset de l'interface
        if (this.loadedNote && this.loadedNote.meta.id == note.meta.id) this.ipc.sendSync('forceReset')
        console.debug('Envoi commande suppression')
        this.ipc.sendSync('db_notes_deleteNote', note.meta.id)
        console.debug('réinitialisation du browser de notes')
        this.init()
      }
    })
    this.elts.fileLookup.appendChild(deleteButton)
  }

  /**
   * Génère un selecteur de matière pour changer la matière liée à une note
   * @param meta Metadata de la note
   */
  private generateMatiereSelector(meta: NoteMetadata): HTMLSelectElement {
    let selectEl = document.createElement('select')
    selectEl.classList.add('form-control')
    let options: HTMLOptionElement[] = []
    // Crée une option pour chaque matiere
    let optDefault = document.createElement('option') 
    optDefault.value = '-1'
    optDefault.innerText = '(Aucune)'
    optDefault.selected = true
    optDefault.addEventListener('click', (e: MouseEvent) => {
      
    })
    options.push(optDefault)
    this.matieres.forEach((m: Matiere) => {
      let opt = document.createElement('option')
      opt.value = m.id
      opt.style.backgroundColor = m.color
      opt.innerText = m.name
      if (meta.matiere && meta.matiere == m.id) {
        opt.selected = true
        optDefault.selected = false
      }
      options.push(opt)
    })
    // Ajout des options au selecteur
    options.forEach(o=>selectEl.appendChild(o))
    // Bind du clic sur un element
    let that = this
    selectEl.onchange = function (e: any) {
      // db_notes_setProperty > property: string, value: (string|number|boolean), id: string
      let value = $(this).val()
      that.ipc.sendSync('db_notes_setProperty', 'matiere', value, meta.id)
      that.init()
    }
    return selectEl
  }

  private generateIsFavoriteCheckbox(meta: NoteMetadata): HTMLElement {
    let input = document.createElement('i')
    input.classList.add( meta.isfavorite? 'fas' : 'far', 'fa-star', 'isFavorite')
    input.onclick = ()=>{
      this.ipc.sendSync('db_notes_setProperty', 'isfavorite', !meta.isfavorite, meta.id)
      this.init()
    }
    return input
  }

  /**
   * Génère un input pour modifier le nom de la note
   * @param meta Métadata de la note
   */
  private generateTitreInput(meta: NoteMetadata): HTMLDivElement {
    /*
      <div class="input-group">
        <input class="form-control" value="TITRE" type="text">
        <div class="input-group-append">
          <span class="input-group-button">
            <button class="btn btn-secondary"><i class="fas fa-save"></i></button>  
          </span>
        </div>
      </div>
     */
    let mainDiv = document.createElement('div')
    mainDiv.classList.add('input-group')

    let input = document.createElement('input')
    input.classList.add('form-control')
    input.value = meta.title
    input.type = "text"
    mainDiv.appendChild(input)

    let subDiv = document.createElement('div')
    subDiv.classList.add('input-group-append')
    mainDiv.appendChild(subDiv)

    let span = document.createElement('span')
    span.classList.add('input-group-button')
    subDiv.appendChild(span)

    let button = document.createElement('button')
    button.classList.add('btn', 'btn-secondary')
    button.innerHTML = `<i class="fas fa-save"></i>`
    button.onclick = () => {
      if (input.value.trim().length > 0) {
        this.ipc.sendSync('db_notes_setProperty', 'title', input.value.trim(), meta.id)
        this.init()
      } else {
        input.value = meta.title
      }
    }
    span.appendChild(button)

    return mainDiv
  }

  /**
   * Génère une table de deux colonnes avec les données fournies
   * @param data Un tableau bidimensionnel à deux colonnes qui décrit le contenu de la table
   */
  private generateTable(data: Array<{a:string|HTMLElement, b:string|HTMLElement}>): HTMLTableElement {
    let table: HTMLTableElement = document.createElement('table')
    data.forEach( (data: {a:string|HTMLElement, b:string|HTMLElement}) => {
      let tr = document.createElement('tr')
      if (data.a instanceof HTMLElement) {
        tr.appendChild(data.a)
      } else {
        let tda = document.createElement('td')
        tda.classList.add('tableMainColumn')
        tda.innerHTML = data.a
        tr.appendChild(tda)
      }
      if (data.b instanceof HTMLElement) {
        tr.appendChild(data.b)
      } else {
        let tdb = document.createElement('td')
        tdb.innerHTML = data.b
        tr.appendChild(tdb)
      }
      table.appendChild(tr)
    })
    return table
  }

  /**
   * Génère un élément note cliquable dans la liste des Notes du navigateur.
   * @param meta Metadata de la note
   */
  private generateFileElement(meta: NoteMetadata): HTMLDivElement {
    let el = document.createElement('div')
    el.classList.add('file')
    if (this.loadedNote && this.loadedNote.meta.id == meta.id) {
      console.debug(`generateFileElement > this.loadedNote trouvé dans les notes et vaut ${JSON.stringify(this.loadedNote.meta)}`)
      el.classList.add('file-loaded')
    }
    if (this.clickedNoteId && this.clickedNoteId == meta.id) {
      el.classList.add('file-clicked')
    }
    let title = document.createElement('div')
    let star:string = meta.isfavorite ? '<i class="fas fa-star" style="color:#ffd767"></i> ' : ''
    title.innerHTML = star + meta.title
    el.appendChild(title)
    let subEl = document.createElement('div')
    subEl.classList.add('lastEdit')
    subEl.innerText = meta.lastedit
    el.appendChild(subEl)
    // Handle click
    el.addEventListener('click', (event: MouseEvent) => {
      this.clickedNoteId = meta.id
      this.renderFiles(true)
      this.renderLookup(meta.id)
    })
    // Bouton ouvrir
    let button = document.createElement('button')
    button.classList.add('fileQuickLoadButton', 'btn', 'btn-sm', 'btn-secondary')
    // button.setAttribute('data-tooltip', "Ouvrir")
    button.innerHTML = '<i class="fas fa-pen"></i>'
    button.addEventListener('click', ()=>this.loadNote(meta.id))
    el.appendChild(button)
    return el
  }

  /**
   * Génère la vue de la liste des matières
   */
  renderMatieres() {
    console.debug('Génération de la liste des matières (Browse)')
    this.matieres = this.ipc.sendSync('db_matieres_getMatieres')
    // clean allfiles node
    var child = this.elts.matList.lastElementChild;  
    while (child) { 
        this.elts.matList.removeChild(child); 
        child = this.elts.matList.lastElementChild;  
    } 
    // create node for each filesList
    this.matieres.forEach( (m: Matiere) => {
      this.elts.matList.appendChild(this.generateMatiereElement(m))
    })
    // set allMatNoteCount to number of notes
    this.elts.allMatNotesCount.innerText = `(${this.noteList.length})`
    // Si aucune matiere n'est sélectionnée, on sélectionne "toutes les notes"
    if (!this.clickedMatiereId) this.elts.allMat.classList.add('matiere-selected')
    else this.elts.allMat.classList.remove('matiere-selected')
  }

  /**
   * Génère un élément matière cliquable à afficher dans la liste des matières.
   * @param m La matière
   */
  private generateMatiereElement(m: Matiere): HTMLDivElement {
    let el = document.createElement('div')
    el.classList.add('matiere')
    if (m.id == this.clickedMatiereId) el.classList.add('matiere-selected')
    let subEl = document.createElement('i')
    subEl.classList.add('fa', 'fa-folder-open')
    subEl.style.color = m.color
    el.appendChild(subEl)
    el.appendChild(document.createTextNode(' ' + m.name))
    // Note counter
    const noteCount: string = this.noteList.filter(n => n.matiere==m.id).length.toString()
    let noteCountElement = document.createElement('div')
    noteCountElement.classList.add('float-right')
    noteCountElement.innerText = `(${noteCount})`
    el.appendChild(noteCountElement)
    // onClick
    el.addEventListener('click', ()=>{
      this.clickedMatiereId = m.id
      this.renderMatieres()
      this.renderFiles()
    })
    return el
  }

  /**
   * Définit dans cet objet uniquement la valeur loadedNote
   * Appelé dans la fonction setLoadedNote de **mainWindow.ts**
   * @param note nouvelle note chargée
   */
  public setLoadedNote(note: Note): void {
    console.debug(`setLoadedNote(${note})`)
    this.loadedNote = note
  }

}
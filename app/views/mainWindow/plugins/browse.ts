import { NoxunotePlugin, NoteMetadata, Matiere, Note } from "../../../types";
import { IpcRenderer, TouchBarButton } from "electron";

export type BrowseElements = {
  menu: HTMLElement,
  triggers: HTMLElement[],
  allMat: HTMLElement,
  allMatNotesCount: HTMLElement,
  matList: HTMLElement,
  filesList: HTMLElement,
  fileLookup: HTMLElement
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
  
  constructor(public elts: BrowseElements, public ipc: IpcRenderer) {
    this.init()
    // this.elts.triggers.forEach( (e: HTMLElement) => {
    //   e.addEventListener('click', )
    // })
  }
  
  init() {
    this.renderFiles()
    this.renderMatieres()
    // Si un note est chargée dans l'editeur
    if (this.loadedNote) {
      // On met a jour l'affichage lookup sur les données de cette note
      this.renderLookup(this.loadedNote.meta.id)
    } else {
      // Sinon on n'affiche rien
      this.elts.fileLookup.innerHTML = ""
    }
  }

  loadNote(id: string) {
    // VERIFI
    let note: Note = this.ipc.sendSync('db_notes_getNote', id)
    this.ipc.send('loadNote', note)
  }

  renderFiles(selectedMatiereId?: string, orderBy?: string) {
    this.noteList = this.ipc.sendSync('db_notes_getNoteList')
    // clean allfiles node
    var child = this.elts.filesList.lastElementChild;  
    while (child) { 
        this.elts.filesList.removeChild(child); 
        child = this.elts.filesList.lastElementChild;  
    } 
    // create node for each filesList
    this.noteList.forEach( (n: NoteMetadata) => {
      this.elts.filesList.appendChild(this.generateFileElement(n))
    })
  }

  renderLookup(noteId: string) {
    this.elts.fileLookup.innerHTML = ""
    let note: Note = this.ipc.sendSync('db_notes_getNote', noteId)
    // Table d'informations
    let rechMat: Matiere = this.matieres.find(m=>m.id==note.meta.matiere)
    let data: Array<{a:string, b:string}> = [
      {
        a: "Titre",
        b: note.meta.title
      },
      {
        a: "Dernière modif.",
        b: note.meta.lastedit
      },
      {
        a: "Favoris",
        b: note.meta.isfavorite? "Oui" : "Non"
      },
      {
        a: "Id",
        b: note.meta.id
      },
      {
        a: "Fichier",
        b: note.meta.filename
      },
      {
        a: "Matière",
        b: rechMat? rechMat.name : "(aucune)"
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
    deleteButton.classList.add("btn", "btn-warn", "float-right", "mt-0")
    deleteButton.innerHTML = '<i class="fas fa-pen"></i> Supprimer'
    deleteButton.addEventListener('click', ()=>{
      if (confirm('Voulez vous vraiment supprimer cette note ?')) {
        // Si la note correspond à celle ouverte, on demande un reset de l'interface
        if (this.loadedNote && this.loadedNote.meta.id == note.meta.id) this.ipc.sendSync('forceReset')
        this.ipc.sendSync('db_notes_deleteNote', note.meta.id)
        this.init()
      }
    })
    this.elts.fileLookup.appendChild(deleteButton)
  }

  private generateTable(data: Array<{a:string, b:string}>): HTMLTableElement {
    let table: HTMLTableElement = document.createElement('table')
    data.forEach( (data: {a:string, b:string}) => {
      let tr = document.createElement('tr')
      let tda = document.createElement('td')
      let tdb = document.createElement('td')
      tda.classList.add('tableMainColumn')
      tda.innerHTML = data.a
      tdb.innerHTML = data.b
      tr.appendChild(tda)
      tr.appendChild(tdb)
      table.appendChild(tr)
    })
    return table
  }

  private generateFileElement(meta: NoteMetadata): HTMLDivElement {
    let el = document.createElement('div')
    el.classList.add('file')
    if (this.loadedNote && this.loadedNote.meta.id == meta.id) {
      el.classList.add('file-selected')
    }
    el.appendChild(document.createTextNode(meta.title))
    let subEl = document.createElement('div')
    subEl.classList.add('lastEdit')
    subEl.innerText = meta.lastedit
    el.appendChild(subEl)
    // Handle click
    el.addEventListener('click', (event: MouseEvent) => {
      this.renderLookup(meta.id)
    })
    // Bouton ouvrir
    let button = document.createElement('button')
    button.classList.add('fileQuickLoadButton', 'btn', 'btn-sm', 'btn-secondary')
    button.setAttribute('data-tooltip', "Ouvrir")
    button.innerHTML = '<i class="fas fa-pen"></i>'
    button.addEventListener('click', ()=>this.loadNote(meta.id))
    el.appendChild(button)
    return el
  }

  renderMatieres() {
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
  }

  private generateMatiereElement(m: Matiere): HTMLDivElement {
    let el = document.createElement('div')
    el.classList.add('matiere')
    let subEl = document.createElement('i')
    subEl.classList.add('fa', 'fa-folder-open')
    subEl.style.color = m.color
    el.appendChild(subEl)
    el.appendChild(document.createTextNode(' ' + m.name))
    // Note counter
    const noteCount: string = this.noteList.filter((n:NoteMetadata) => {
      return n.matiere? n.matiere==m.id : false
    }).length.toString()
    let noteCountElement = document.createElement('div')
    noteCountElement.classList.add('float-right')
    noteCountElement.innerText = `(${noteCount})`
    el.appendChild(noteCountElement)
    return el
  }

  /**
   * Définit dans cet objet uniquement la valeur loadedNote
   * Appelé dans la fonction setLoadedNote de **mainWindow.ts**
   * @param note nouvelle note chargée
   */
  public setLoadedNote(note: Note): void {
    if (note == null) this.loadNote = undefined
    else this.loadedNote = note
  }

}
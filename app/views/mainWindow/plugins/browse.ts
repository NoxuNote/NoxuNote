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
  
  constructor(public elts: BrowseElements, public ipc: IpcRenderer) {
    this.init()
    // this.elts.triggers.forEach( (e: HTMLElement) => {
    //   e.addEventListener('click', )
    // })
  }
  
  init() {
    this.renderFiles()
    this.renderMatieres()
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
    // Load button
    let button = document.createElement('button')
    button.classList.add("btn", "btn-primary", "mb-4", "mt-4")
    button.innerText = "Ouvrir"
    this.elts.fileLookup.appendChild(button)
    // Informations
    let informations = document.createElement('h4')
    informations.innerText = "Informations"
    this.elts.fileLookup.appendChild(informations)
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
    // FICHIER :  <div class="file file-selected">CM1
    //						  <div class="lastEdit">vendredi 6 juin à 13h40</div>
    //            </div>
    let el = document.createElement('div')
    el.classList.add('file')
    el.appendChild(document.createTextNode(meta.title))
    let subEl = document.createElement('div')
    subEl.classList.add('lastEdit')
    subEl.innerText = meta.lastedit
    el.appendChild(subEl)
    // Handle click
    el.addEventListener('click', (event: MouseEvent) => {
      this.renderLookup(meta.id)
    })
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
    // MATIERE : <div class="matiere"><i class="far fa-folder-open"></i> Anglais</div>
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
    console.debug(this.noteList)
    console.debug(noteCount)
    let noteCountElement = document.createElement('div')
    noteCountElement.classList.add('float-right')
    noteCountElement.innerText = `(${noteCount})`
    el.appendChild(noteCountElement)
    return el
  }

}
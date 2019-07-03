import { NoxunotePlugin, NoteMetadata } from "../../../types";
import { IpcRenderer } from "electron";

export type BrowseElements = {
  menu: HTMLElement,
  triggers: HTMLElement[],
  allMat: HTMLElement,
  matList: HTMLElement,
  filesList: HTMLElement
}

export class BrowsePlugin implements NoxunotePlugin {

  public noteList: NoteMetadata[]
  
  constructor(public elts: BrowseElements, public ipc: IpcRenderer) {
    this.init()
  }
  
  init() {
    this.noteList = this.ipc.sendSync('db_notes_getNoteList')
    // clean allfiles node
    var child = this.elts.filesList.lastElementChild;  
    while (child) { 
        this.elts.allMat.removeChild(child); 
        child = this.elts.filesList.lastElementChild;  
    } 
    // create node for each filesList
    this.noteList.forEach( (n: NoteMetadata) => {
      let fileNode = document.createElement('div')
      fileNode.innerText = n.title
      this.elts.filesList.appendChild(fileNode)
    })
  }

}
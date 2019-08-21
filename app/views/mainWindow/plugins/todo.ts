import { NoxunotePlugin } from "../../../types";
import { IpcRenderer } from "electron";
const homedir		= require('os').homedir()
const fs        = require('fs-extra')

export type TodoElements = {
  triggers: HTMLElement[],
  menu: HTMLElement,
  content: HTMLInputElement
}

export class TodoPlugin implements NoxunotePlugin {

  public static filePath: string = homedir + '/NoxuNote/todo.txt';
  
  constructor(public elts: TodoElements) {
    this.init()
  }
  
  init() {
    // Opens the toDo block
    this.elts.triggers.forEach( (e:HTMLElement) => {
      e.addEventListener('click', ()=>this.toggle())
    })
    // Handle keyup -> save()
    this.elts.content.addEventListener('keyup', () => this.saveContent())
    // Loads todofile content
    this.loadContent()
  }

  toggle() {
    this.elts.menu.classList.toggle("appear")
  }

  loadContent() {
    let fileContent: string
    try {
      fileContent = fs.readFileSync(homedir + "/NoxuNote/todo.txt").toString();
    } catch (e) {
      fileContent = "ERREUR: Impossible de lire le fichier todo.txt, vérifiez qu'il éxiste dans le répertoire de NoxuNote ou contactez le développeur."
    }
    this.elts.content.value = fileContent
  }

  saveContent() {
    try { fs.writeFileSync(TodoPlugin.filePath, this.elts.content.value) }
    catch (e) { console.log('Failed to save the toDo file !' + e); }
  }

}
import { EventEmitter } from "events";
import { fabric } from "fabric";
import { CanvasGrid } from "./CanvasGrid";

export class History extends EventEmitter {

  /**
   * Stores all modifications with a random id,
   * sorted by date, last element = most recent update
   */
  private history: {id: string, canvas: string, date: string}[] = []

  /**
   * Current history node id
   */
  private currentId: string = ''

  private static UNDO_LIMIT: number = 25

  constructor(private canvas: fabric.Canvas, private canvasGrid: CanvasGrid) {
    super()
    this.canvas.on('object:modified', ()=>this.push())
    this.canvas.on('object:scaled', ()=>this.push())
    this.canvas.on('object:rotated', ()=>this.push())
    this.canvas.on('object:skewed', ()=>this.push())
  }

  /**
   * Saves the current canvas state to the history
   */
  public push() {
    // delete all history modifications AFTER actual node
    // imagine doing a -> b -> c -> d -> #UNDO# -> #UNDO# (we are in b) -> e (new delete every node after b before add e)
    const currentNodeIndex = this.history.findIndex(n=>n.id == this.currentId)
    const lastNodeIndex = this.history.length-1
    if (currentNodeIndex != lastNodeIndex) {
      this.history.splice(currentNodeIndex+1, lastNodeIndex-currentNodeIndex) // deletes all nodes after currentNodeIndex+1
    }
    // save new node
    const newId = this.randomId()
    this.history.push({id: newId, canvas: this.canvas.toJSON(['selectable']), date: (new Date()).toJSON()})
    this.currentId = newId
    // delete older nodes
    while (this.history.length > History.UNDO_LIMIT) {
      this.history.splice(0, 1)
    }
  } 

  public undo() {
    const actualNodeIndex = this.history.findIndex(n=>n.id==this.currentId)
    if (actualNodeIndex-1>=0) {
      const ancientId = this.history[actualNodeIndex-1].id
      this.restoreNode(ancientId)
      this.currentId = ancientId
      this.canvasGrid.updateGrid()
      this.emit('undo')

    }
    this.emit('impossible_undo')
  }
  
  public redo() {
    const actualNodeIndex = this.history.findIndex(n=>n.id==this.currentId)
    if (actualNodeIndex+1<this.history.length) {
      const newerId = this.history[actualNodeIndex+1].id
      this.restoreNode(newerId)
      this.currentId = newerId
      this.canvasGrid.updateGrid()
      this.emit('redo')
    }
    this.emit('impossible_redo')
  }

  public restoreNode(id: string) {
    this.canvas.clear().renderAll()
    this.canvas.loadFromJSON(this.history.find(n=>n.id==id).canvas, this.canvas.renderAll.bind(this.canvas))
  }
  
  /**
   * Generates an hexadecimal short id like '7cab5ab6'
   */
  private randomId(): string {
    return 'xxxxxxxx'.replace(/[xy]/g, (c) => {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  public getHistory() {
    return this.history
  }
}
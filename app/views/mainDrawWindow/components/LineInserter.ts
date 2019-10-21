import { fabric } from "fabric";
import { EventEmitter } from "events";
import { History } from "./History";

export class LineInserter extends EventEmitter {
  
  private x1: number
  private y1: number

  private x2: number
  private y2: number

  private handleFirstClick = (e: fabric.IEvent) => {
    this.x1 = e.absolutePointer.x
    this.y1 = e.absolutePointer.y
    this.canvas.on('mouse:down', this.handleSecondClick)
    this.emit('querySecondClick')
    this.canvas.off('mouse:down', this.handleFirstClick)
  }
  private handleSecondClick = (e: fabric.IEvent) => {
    this.x2 = e.absolutePointer.x
    this.y2 = e.absolutePointer.y
    this.drawLine()
    this.canvas.off('mouse:down', this.handleSecondClick)
    this.emit('done')
  }

  constructor(public canvas: fabric.Canvas, private history: History) {
    super()
  }
  
  public insert() {
    this.canvas.on('mouse:down', this.handleFirstClick)
    this.emit('queryFirstClick')
  }

  private drawLine() {
    const line = new fabric.Line([this.x1, this.y1, this.x2, this.y2], {
      stroke: '#FFFFFF', 
      strokeWidth: 4, 
      strokeUniform: true, 
      selectable: true}
      )
    this.canvas.add(line)
    this.history.push()
  }

}
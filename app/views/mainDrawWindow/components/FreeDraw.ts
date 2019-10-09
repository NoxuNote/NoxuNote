
import { fabric } from "fabric"
import { History } from "./History";

export class FreeDraw {

  constructor(public canvas: fabric.Canvas, enterFreeDraw: boolean = false, history: History) {
    if (enterFreeDraw) this.enable()
    canvas.on('mouse:up', ()=>{
      if (canvas.isDrawingMode) history.push()
    })
  }

  public enable() {
    this.canvas.isDrawingMode = true
    this.canvas.freeDrawingBrush.color = "#FFFFFF"
    this.canvas.freeDrawingBrush.width = 4
  }

  public disable() {
    this.canvas.isDrawingMode = false
  }

}
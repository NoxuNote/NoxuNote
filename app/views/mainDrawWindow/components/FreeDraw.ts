
import { fabric } from "fabric"

export class FreeDraw {

  constructor(public canvas: fabric.Canvas, enterFreeDraw: boolean = false) {
    if (enterFreeDraw) this.enable()
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

import { fabric } from "fabric"

export class FreeDraw {

  constructor(public canvas: fabric.Canvas, enterFreeDraw: boolean = false) {
    if (enterFreeDraw) this.enable()
  }

  public enable() {
    this.canvas.isDrawingMode = true

  }
  public disable() {
    this.canvas.isDrawingMode = false
  }


}
import { fabric } from "fabric"

/**
 * Enables the canvas to be resized when screen size is changed
 * @param canvas Fabric js canvas instance
 */
export function enableCanvasResize(canvas: fabric.Canvas) {
  canvas.setWidth(window.innerWidth)
  canvas.setHeight(window.innerHeight)
  window.onresize = () => {
    canvas.setWidth(window.innerWidth)
    canvas.setHeight(window.innerHeight)
  }
}
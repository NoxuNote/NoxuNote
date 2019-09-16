import { fabric } from "fabric"
import { enableZoom } from "./canvasZoom"
import { enableCanvasResize } from './canvasResize'

// Static page elements
let elements = {
  zoomFactor: document.getElementById('zoomFactor'),
  zoomFactorMessage: document.getElementById('zoomFactorMessage')
}

// Fabric canvas instance 
let canvas = new fabric.Canvas('canvas')

// Fabric canvas initialization
enableZoom(canvas).on('zoom', zoom => {
  if (zoom == 1) elements.zoomFactorMessage.classList.add('hidden')
  else elements.zoomFactorMessage.classList.remove('hidden')
  elements.zoomFactor.innerText = Math.trunc(zoom).toString()
}) 
enableCanvasResize(canvas)

// Tests
let rect = new fabric.Rect({
  left: 100,
  top: 100,
  fill: 'red',
  width: 20,
  height: 20
})
canvas.add(rect)
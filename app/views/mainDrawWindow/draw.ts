import { fabric } from "fabric"
import { enableZoom } from "./canvasZoom"
import { enableCanvasResize } from './canvasResize'
import { CanvasGrid } from "./CanvasGrid";

import { Vue } from "../../../node_modules/vue/dist/vue"
let maVue = new Vue({
  el: '#app',
  data: {
      message: 'Hello Vue.js!'
  }
})

// Static page elements
let elements = {
  zoomFactor: document.getElementById('zoomFactor'),
  zoomFactorMessage: document.getElementById('zoomFactorMessage'),
  enableGrid: document.getElementById('enableGrid'),
  enableGridButton: document.getElementById('enableGridButton'),
  enableSnap: document.getElementById('enableSnap'),
  enableSnapButton: document.getElementById('enableSnapButton'),
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
let canvasGrid = new CanvasGrid(canvas)
elements.enableGridButton.onclick = () => {
  elements.enableGrid.innerText = canvasGrid.toggleGrid() ? 'On' : 'Off'
}
elements.enableSnapButton.onclick = () => {
  elements.enableSnap.innerText = canvasGrid.toggleSnapToGrid() ? 'On' : 'Off'
}
// Tests
let rect = new fabric.Rect({
  left: 100,
  top: 100,
  fill: 'red',
  width: 20,
  height: 20
})
canvas.add(rect)
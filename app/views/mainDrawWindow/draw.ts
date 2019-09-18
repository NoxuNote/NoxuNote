import { fabric } from "fabric"
import { enableZoom } from "./canvasZoom"
import { enableCanvasResize } from './canvasResize'
import { CanvasGrid } from "./CanvasGrid";
import { ShapeInserter } from "./ShapeInserter";
let Vue = require('../../../node_modules/vue/dist/vue.min.js')

let app = new Vue({
  el: '#ui',
  data: {
    ui: {
      zoomFactor: 1,
      controlBars: {
        grid: false,
        objects: false
      }
    },
    grid: {
      snapToGrid: false,
      showGrid: false,
      gridSize: 50
    }
  },
  methods: {
    gridSizeChangeEvt: (evt: any) => canvasGrid.setGridSize(evt.target.value)
  }
})


// Fabric canvas instance 
let canvas = new fabric.Canvas('canvas')

// Fabric canvas initialization
enableZoom(canvas).on('zoom', zoom => app.ui.zoomFactor = zoom) 
enableCanvasResize(canvas)
let canvasGrid = new CanvasGrid(canvas)
canvasGrid.showGridEmitter.on('change', (newValue: boolean) => app.grid.showGrid = newValue)
canvasGrid.snapToGridEmitter.on('change', (newValue: boolean) => app.grid.snapToGrid = newValue)
canvasGrid.gridSizeEmitter.on('change', (newValue: boolean) => app.grid.gridSize = newValue)
let shapeInserter = new ShapeInserter(canvas)

/**
 * Enables the requested 'key' control BarProp.
 * @param key grid, objects, or a bar element
 */
function enableControlBar(key: string) {
  Object.keys(app.ui.controlBars).forEach(keyItem=>app.ui.controlBars[keyItem] = keyItem==key)
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
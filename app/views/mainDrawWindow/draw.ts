import { fabric } from "fabric"
import { enableZoom } from "./canvasZoom"
import { enableCanvasResize } from './canvasResize'
import { CanvasGrid } from "./CanvasGrid";
import { ShapeInserter, ObjProps, PropType } from "./ShapeInserter";
import { i18n } from "./plugins/i18n";
const Vue = require('../../../node_modules/vue/dist/vue.min.js')

// Fabric canvas instance 
let canvas = new fabric.Canvas('canvas')
canvas.preserveObjectStacking = true

let app = new Vue({
  i18n,
  el: '#ui',
  data: {
    ShapeInserter: ShapeInserter,
    selected: [],
    ui: {
      zoomFactor: 1,
      controlBars: {
        grid: false,
        objects: true
      }
    },
    grid: {
      snapToGrid: true,
      showGrid: true,
      gridSize: 50
    }
  },
  methods: {
    gridSizeChangeEvt: (evt: any) => canvasGrid.setGridSize(evt.target.value),
  }
})

// Events
function updateSelectedObjs() {
  app.selected = canvas.getActiveObjects()
}
updateSelectedObjs()

// Fabric canvas initialization
enableZoom(canvas).on('zoom', zoom => app.ui.zoomFactor = zoom)
enableCanvasResize(canvas)
let canvasGrid = new CanvasGrid(canvas)
canvasGrid.showGridEmitter.on('change', (newValue: boolean) => app.grid.showGrid = newValue)
canvasGrid.snapToGridEmitter.on('change', (newValue: boolean) => app.grid.snapToGrid = newValue)
canvasGrid.gridSizeEmitter.on('change', (newValue: boolean) => app.grid.gridSize = newValue)
let shapeInserter = new ShapeInserter(canvas)
shapeInserter.on('insert', () => updateSelectedObjs())

canvas.on('selection:created', () => updateSelectedObjs())
canvas.on('selection:updated', () => updateSelectedObjs())
canvas.on('selection:cleared', () => updateSelectedObjs());

function handlePropertyChange(evt: any, props: ObjProps, object: fabric.Object) {
  let newValue: any = evt.target.value
  if (props.type == PropType.StrokeWidth) newValue = parseInt(newValue)
  object.set({ [props.name]: newValue })
  canvas.renderAll()
}
function addObjToSelection(o: fabric.Object) {
  let sel = new fabric.ActiveSelection([o, ...canvas.getActiveObjects()]);
  canvas.setActiveObject(sel)
  updateSelectedObjs()
}

/**
 * Enables the requested 'key' control BarProp.
 * @param key grid, objects, or a bar element
 */
function enableControlBar(key: string) {
  Object.keys(app.ui.controlBars).forEach(keyItem => app.ui.controlBars[keyItem] = keyItem == key)
}
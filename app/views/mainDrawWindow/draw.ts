import { fabric } from "fabric"
import { enableZoom } from "./components/canvasZoom"
import { enableCanvasResize } from './components/canvasResize'
import { CanvasGrid } from "./components/CanvasGrid";
import { ShapeInserter, ObjProps, PropType } from "./components/ShapeInserter";
import { i18n } from "./plugins/i18n";
import { FreeDraw } from "./components/FreeDraw";
import { Duplicate } from "./components/Duplicate";
import { LineInserter } from "./components/LineInserter";
import { History } from "./components/History";
import { EnableShortcuts } from "./components/enableShortcuts";
const Vue = require('../../../node_modules/vue/dist/vue.min.js')
const fontList = require('font-list')

let fonts: String[] = []
// Load fonts
fontList.getFonts().then((availableFonts: string[]) => fonts = availableFonts).catch((err: any)=>console.log(err))

// Fabric canvas instance 
let canvas = new fabric.Canvas('canvas')
canvas.preserveObjectStacking = true
let freeDraw: FreeDraw

let app = new Vue({
  i18n,
  el: '#ui',
  data: {
    ShapeInserter: ShapeInserter,
    selected: [],
    ui: {
      zoomFactor: 1,
      message: '',
      controlBars: {
        cursor: false,
        grid: false,
        objects: false,
        freeDraw: true,
        text: false,
        chart: false
      }
    },
    grid: {
      snapToGrid: true,
      showGrid: true,
      gridSize: 50
    }
  },
  methods: {
    gridSizeChangeEvt: (evt: any) => canvasGrid.setGridSize(evt.target.value)
  },
  watch: {
    ui: {
      handler(val: any) {
        val.controlBars.freeDraw ? freeDraw.enable() : freeDraw.disable()
      },
      deep: true
    }
  }
})

// Events
function updateSelectedObjs() {
  app.selected = canvas.getActiveObjects()
}
updateSelectedObjs()

// Init zoom & resize
enableZoom(canvas).on('zoom', zoom => app.ui.zoomFactor = zoom)
enableCanvasResize(canvas)
// Init canvas grid
let canvasGrid = new CanvasGrid(canvas)
// Init History
let history = new History(canvas, canvasGrid)
history.push()
canvasGrid.showGridEmitter.on('change', (newValue: boolean) => app.grid.showGrid = newValue)
canvasGrid.snapToGridEmitter.on('change', (newValue: boolean) => app.grid.snapToGrid = newValue)
canvasGrid.gridSizeEmitter.on('change', (newValue: boolean) => app.grid.gridSize = newValue)
// Init line insertion
let lineInserter = new LineInserter(canvas, history)
lineInserter.on('queryFirstClick', ()=>app.ui.message="Cliquez pour définir le point de départ.")
lineInserter.on('querySecondClick', ()=>app.ui.message="Cliquez pour définir le point d'arrivée")
lineInserter.on('done', ()=>app.ui.message="")
// Init shape insertion
let shapeInserter = new ShapeInserter(canvas)
shapeInserter.on('insert', () => {updateSelectedObjs(); history.push()})
// Init Selection helper
canvas.on('selection:created', () => updateSelectedObjs())
canvas.on('selection:updated', () => updateSelectedObjs())
canvas.on('selection:cleared', () => updateSelectedObjs());
// Init freeDraw mode
freeDraw = new FreeDraw(canvas, true, history)
// Init Duplicate tool
let duplicate = new Duplicate(canvas, history)
let shortcuts = new EnableShortcuts(canvas, history)

function handlePropertyChange(evt: any, props: ObjProps, object: fabric.Object) {
  let newValue: any = evt.target.value
  if (props.type == PropType.StrokeWidth) newValue = parseInt(newValue)
  object.set({ [props.name]: newValue })
  history.push()
  canvas.requestRenderAll()
}



/**
 * Enables the requested 'key' control BarProp.
 * @param key grid, objects, or a bar element
 */
function enableControlBar(key: string) {
  Object.keys(app.ui.controlBars).forEach(keyItem => app.ui.controlBars[keyItem] = keyItem == key)
}
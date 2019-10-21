import { fabric } from "fabric"
import { EventEmitter } from "events"
import { History } from "./History";

export class CanvasGrid {

  private canvas: fabric.Canvas
  private snapToGrid: boolean = false
  public snapToGridEmitter = new EventEmitter()
  private isGridShown: boolean = false
  public showGridEmitter = new EventEmitter()
  private gridSize: number = 50
  public gridSizeEmitter = new EventEmitter()
  private grid: fabric.Line[] = []
  private objectMovingHandler = (options: any) => {
    let obj: fabric.Object = options.target
    let topLeftX = obj.left 
    let topLeftY = obj.top
    if (Math.round(topLeftX / this.gridSize * 6) % 6 == 0 &&
      Math.round(topLeftY / this.gridSize * 6) % 6 == 0) {
      obj.set({
        left: Math.round(topLeftX / this.gridSize) * this.gridSize,
        top: Math.round(topLeftY / this.gridSize) * this.gridSize
      }).setCoords();
    }
    let topRightX = obj.left+obj.scaleX
    if (Math.round(topRightX / this.gridSize * 6) % 6 == 0 &&
      Math.round(topLeftY / this.gridSize * 6) % 6 == 0) {
      obj.set({
        left: Math.round(topRightX / this.gridSize) * this.gridSize,
        top: Math.round(topLeftY / this.gridSize) * this.gridSize
      }).setCoords();
    }
  }

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas
    this.showGrid()
    this.setSnapToGrid(true)
    window.addEventListener('resize', () => this.setGridSize(this.gridSize))
  }

  /**
   * Enables or disables the snap to grid option
   * @param snap should snap to grid ?
   */
  public setSnapToGrid(snap: boolean) {
    this.snapToGrid = snap
    // Deletes handler function and re-binds it
    this.canvas.off('object:moving', this.objectMovingHandler)
    if (snap) this.canvas.on('object:moving', this.objectMovingHandler);
    // Informs changes
    this.snapToGridEmitter.emit('change', this.snapToGrid)
  } 

  /**
   * Actives ou deactives the snapToGrid option
   */
  public toggleSnapToGrid() {
    this.setSnapToGrid(!this.snapToGrid)
  }

  public setGridSize(s: number) {
    this.gridSize = s
    // Deep clean grid clean
    this.canvas.getObjects().forEach(o=>{
      if (o.type == "line" && !o.selectable) {
        this.canvas.remove(o)
      }
    })
    if (this.isGridShown) this.showGrid()
    // Informs changes
    this.gridSizeEmitter.emit('change', this.gridSize)
  }

  /**
   * (re)Generates the grid elements array and add it to local this.grid property
   * Updates new setSnatpToGrid handlers
   */
  private regenerateGrid() {
    this.grid = []
    for (var i = 0; i < (window.innerWidth / this.gridSize); i++) {
      this.grid = [
        new fabric.Line([i * this.gridSize, 0, i * this.gridSize, window.innerHeight], {
          stroke: 'rgba(255, 255, 255, 0.2)',
          selectable: false
        }),
        ...this.grid
      ]
    }
    for (var i = 0; i < (window.innerHeight / this.gridSize); i++) {
      this.grid = [
        new fabric.Line([0, i * this.gridSize, window.innerWidth, i * this.gridSize], {
          stroke: 'rgba(255, 255, 255, 0.2)',
          selectable: false,
        }), 
        ...this.grid
      ]
    }
    this.setSnapToGrid(this.snapToGrid)
  }

  public hideGrid() {
    this.isGridShown = false
    // Deep clean grid clean
    this.canvas.getObjects().forEach(o=>{
      if (o.type == "line" && !o.selectable) {
        this.canvas.remove(o)
      }
    })
    // Informs changes
    this.showGridEmitter.emit('change', this.isGridShown)
  }

  public showGrid() {
    this.isGridShown = true
    this.regenerateGrid()
    this.grid.forEach(l=>{this.canvas.add(l); this.canvas.sendToBack(l)})
    // Informs changes
    this.showGridEmitter.emit('change', this.isGridShown)
  }

  /**
   * Deletes background lines and regenerate them
   */
  public updateGrid() {
    // Deep clean grid clean
    this.canvas.getObjects().forEach(o=>{
      if (o.type == "line" && !o.selectable) {
        this.canvas.remove(o)
      }
    })
    if (this.isGridShown) this.showGrid()
  }

  public toggleGrid() {
    if (this.isGridShown) this.hideGrid()
    else this.showGrid()
  }

}
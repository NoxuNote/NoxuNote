import { fabric } from "fabric"

export class CanvasGrid {

  private canvas: fabric.Canvas
  private snapToGrid: boolean = false
  private gridSize: number = 50
  private grid: fabric.Line[] = []

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas
    this.generateGrid()
  }

  /**
   * Enables or disables the snap to grid option
   * @param snap should snap to grid ?
   */
  public setSnapToGrid(snap: boolean) {
    this.canvas.on('object:moving', options => {
      if (Math.round(options.target.left / this.gridSize * 4) % 4 == 0 &&
        Math.round(options.target.top / this.gridSize * 4) % 4 == 0) {
        options.target.set({
          left: Math.round(options.target.left / this.gridSize) * this.gridSize,
          top: Math.round(options.target.top / this.gridSize) * this.gridSize
        }).setCoords();
      }
    });
    this.snapToGrid = snap
  } 

  public setGridSize(s: number) {
    this.gridSize = s
    this.generateGrid()
  }

  /**
   * Generates a grid and add it to local this.grid property
   * Updates new setSnatpToGrid handlers
   */
  private generateGrid() {
    this.grid = []
    for (var i = 0; i < (600 / this.gridSize); i++) {
      this.grid = [
        new fabric.Line([i * this.gridSize, 0, i * this.gridSize, 600], {
          stroke: '#ccc',
          selectable: false
        }),
        new fabric.Line([0, i * this.gridSize, 600, i * this.gridSize], {
          stroke: '#ccc',
          selectable: false
        }), 
        ...this.grid
      ]
    }
    this.setSnapToGrid(this.snapToGrid)
  }

  /**
   * Hides grid from canvas
   */
  public hideGrid() {
    this.grid.forEach(l=>this.canvas.remove(l))
  }

  public showGrid() {
    this.generateGrid()
    this.grid.forEach(l=>this.canvas.add(l))
  }

}
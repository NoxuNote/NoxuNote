import { fabric } from "fabric";

export class LineHandler {

  private circleA: fabric.Circle
  private circleB: fabric.Circle
  private line: fabric.Line

  constructor(public canvas: fabric.Canvas) {

    // canvas.on('selection:created', () => {
    //   let obj = canvas.getActiveObject()
    //   if (obj.type == 'line') {
        
    //   }
    // });

    // canvas.on('selection:cleared', this.removeCircles)

    this.canvas.on('object:moving', (e) => {
      const obj = e.target
      if (obj.type == 'circle') {
        if (obj == this.circleA) {
          this.line.set({
            x1: obj.left,
            y1: obj.top
          })
        } else if (obj == this.circleB) {
          this.line.set({
            x2: obj.left,
            y2: obj.top
          })
        }
      }
    })

    this.canvas.on('mouse:up', (e) => {
      // Si on est en mode edition
      if (this.line) {
        const obj: fabric.Object = e.target
        if (!(obj==this.circleA) && !(obj==this.circleB) && !(obj==this.line)) {
          this.removeCircles()
        }
      }
    })

  }

  public handleLineClick(obj: fabric.Line) {
    this.removeCircles()
    // generate handles
    this.line = obj
    const circles = this.generateCircles(obj as fabric.Line)
    this.circleA = circles[0]
    this.circleB = circles[1]
    this.canvas.add(this.circleA).add(this.circleB)
  }


  private generateCircles(obj: fabric.Line): fabric.Circle[] {
    const commonProperties: fabric.ICircleOptions = {
      fill: 'red',
      radius: 6,
      hasControls: false,
      hasBorders: false,
      strokeWidth: 0,
      opacity: 0.5,
      originX: 'center',
      originY: 'center'
    }
    console.log(obj.left, obj.top, obj.x1, obj.y1, obj.x2, obj.y2)
    return [
      new fabric.Circle({left: obj.getBoundingRect().left, top: obj.getBoundingRect().top, ...commonProperties}),
      new fabric.Circle({left: obj.getBoundingRect().left+obj.getBoundingRect().width, top: obj.getBoundingRect().top+obj.getBoundingRect().height, ...commonProperties}),
    ]
  }

  private removeCircles() {
    if (this.circleA) { 
      this.canvas.remove(this.circleA)
      this.circleA = null
    }
    if (this.circleB) { 
      this.canvas.remove(this.circleB)
      this.circleB = null
    }
    if (this.line) this.line = null
  }

}
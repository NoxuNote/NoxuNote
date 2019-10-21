import { fabric } from "fabric"

export class SelectHelper {

  constructor(public canvas: fabric.Canvas) { }

  public toggleSelection(obj: fabric.Object) {
    let activeObjs: fabric.Object[] = this.canvas.getActiveObjects()
    if (activeObjs.includes(obj)) {
      // If object already selected, deselect it
      activeObjs.splice(activeObjs.indexOf(obj), 1)
      switch (activeObjs.length) {
        case 0:
          this.canvas.discardActiveObject()
          break;
        case 1:
          this.canvas.setActiveObject(activeObjs[0])
          break;
        default:
          let sel = new fabric.ActiveSelection(activeObjs, {canvas: this.canvas});
          this.canvas.setActiveObject(sel)
          break;
      }
    } else {
      // If not already selected
      if (activeObjs.length == 0) {
        // If no obj. is selected, just select it
        this.canvas.setActiveObject(obj) 
      } else {
        let sel = new fabric.ActiveSelection([obj, ...activeObjs], {canvas: this.canvas});
        this.canvas.setActiveObject(sel)
      }
    }
    this.canvas.requestRenderAll()
  }
  
  /**
   * Flatten an object to avoid having an activeSelection inside
   */
  public getObjectsRecursive(obj: fabric.Object): fabric.Object[] {
    if (obj.type != 'activeSelection') return [obj]
    // obj is an ActiveSelection, let's extract
    let output: fabric.Object[] = []
    let as: fabric.ActiveSelection = <fabric.ActiveSelection> obj
    as.getObjects().forEach(o=>output = [...output, ...this.getObjectsRecursive(o)])
    return output
  }

}
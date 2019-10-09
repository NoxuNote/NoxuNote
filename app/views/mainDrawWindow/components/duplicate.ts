import { fabric } from "fabric"
import { History } from "./History";

export class Duplicate {

  constructor(private canvas: fabric.Canvas, private history: History) { }

  public cloneInstance(obj: fabric.Object) {
    let newObj = fabric.util.object.clone(obj)
    newObj.set("top", obj.top+5)
    newObj.set("left", obj.left+5)
    this.canvas.add(newObj)
    this.history.push()
  }

  public cloneObject(obj: fabric.Object) {
    obj.clone(function(c: fabric.Object) {
      this.canvas.add(c.set({ left: obj.left+5, top: obj.top+5 }))
    })
    this.history.push()
  }

}
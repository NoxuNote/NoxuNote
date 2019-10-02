import { fabric } from "fabric"

export function cloneInstance(canvas: fabric.Canvas, obj: fabric.Object) {
  let newObj = fabric.util.object.clone(obj);
  newObj.set("top", obj.top+5);
  newObj.set("left", obj.left+5);
  canvas.add(newObj);
}

export function cloneObject(canvas: fabric.Canvas, obj: fabric.Object) {
  obj.clone(function(c: fabric.Object) {
    canvas.add(c.set({ left: obj.left+5, top: obj.top+5 }));
  });
}
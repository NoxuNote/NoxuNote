import { fabric } from "fabric"
import { EventEmitter } from "events";

/**
 * Handles wheel zoom in and zoom out
 * @param canvas Fabric js canvas instance
 * @emits zoom {number} - When new zoom Factor
 */
export function enableZoom(canvas: fabric.Canvas): EventEmitter {
  let emitter = new EventEmitter()
  canvas.on('mouse:wheel', function (opt) {
    let wheelEvent: WheelEvent = (<WheelEvent>opt.e)
    wheelEvent.preventDefault()
    wheelEvent.stopPropagation()
    let delta = - wheelEvent.deltaY;
    let pointer = canvas.getPointer(opt.e);
    let zoom = canvas.getZoom();
    zoom = zoom + delta / 200;
    if (zoom > 20) zoom = 20;
    if (zoom < 1) zoom = 1;
    let point = new fabric.Point(wheelEvent.offsetX, wheelEvent.offsetY)
    canvas.zoomToPoint(point, zoom);
    let vpt = canvas.viewportTransform;
    const canvasRealWidth = canvas.getWidth() * canvas.getZoom()
    const canvasRealHeight= canvas.getHeight() * canvas.getZoom()
    const outOfCanvasX = canvas.getWidth() + Math.abs(canvas.viewportTransform[4]) - canvasRealWidth
    const outOfCanvasY = canvas.getHeight() + Math.abs(canvas.viewportTransform[5]) - canvasRealHeight
    if (vpt[4] >= 0) {
      vpt[4] = 0;
    } else if (outOfCanvasX > 0) {
      // On dépasse a droite du canvas de outOfCanvasX
      vpt[4] -= -outOfCanvasX
    }
    if (vpt[5] >= 0) {
      vpt[5] = 0;
    } else if (outOfCanvasY > 0) {
      // On dépasse a droite du canvas de outOfCanvasX
      vpt[5] -= -outOfCanvasY
    }
    emitter.emit('zoom', canvas.getZoom())
  });
  return emitter
}
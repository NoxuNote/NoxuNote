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
    let vpt = this.viewportTransform;
    if (zoom < 400 / 1000) {
      this.viewportTransform[4] = 200 - 1000 * zoom / 2;
      this.viewportTransform[5] = 200 - 1000 * zoom / 2;
    } else {
      if (vpt[4] >= 0) {
        this.viewportTransform[4] = 0;
      } else if (vpt[4] < canvas.getWidth() - 1000 * zoom) {
        this.viewportTransform[4] = canvas.getWidth() - 1000 * zoom;
      }
      if (vpt[5] >= 0) {
        this.viewportTransform[5] = 0;
      } else if (vpt[5] < canvas.getHeight() - 1000 * zoom) {
        this.viewportTransform[5] = canvas.getHeight() - 1000 * zoom;
      }
    }
    emitter.emit('zoom', canvas.getZoom())
  });
  return emitter
}
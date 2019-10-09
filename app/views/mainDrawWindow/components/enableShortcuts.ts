import { History } from "./History";

export class EnableShortcuts {

  private _clipboard: any

  constructor(private canvas: fabric.Canvas, private history: History) {
    document.addEventListener('keydown', (ev: KeyboardEvent) => {
      // CONTROL SHORTCUTS
      if (ev.ctrlKey) {
        if (ev.key == 'c') this.copy()
        else if (ev.key == 'v') this.paste()
        else if (ev.key == 'z') history.undo()
        else if (ev.key == 'y' || (ev.key == 'z' && ev.shiftKey)) history.redo()
        ev.preventDefault()
      }
      if (ev.key == 'Delete' || ev.key == 'Backspace') {
        canvas.getActiveObjects().forEach(o=>canvas.remove(o))
        history.push()
      }
    })
  }

  public copy() {
    if (!this.canvas.getActiveObject()) return
    this.canvas.getActiveObject().clone((cloned: any) => {
      this._clipboard = cloned
    });
  }

  public paste() {
    if (!this._clipboard) return
    // clone again, so you can do multiple copies.
    this._clipboard.clone((clonedObj: any) => {
      this.canvas.discardActiveObject();
      clonedObj.set({
        left: clonedObj.left + 10,
        top: clonedObj.top + 10,
        evented: true,
      });
      if (clonedObj.type === 'activeSelection') {
        // active selection needs a reference to the canvas.
        clonedObj.canvas = this.canvas;
        clonedObj.forEachObject((obj: any) => {
          this.canvas.add(obj);
        });
        // this should solve the unselectability
        clonedObj.setCoords();
      } else {
        this.canvas.add(clonedObj);
      }
      this._clipboard.top += 10;
      this._clipboard.left += 10;
      this.canvas.setActiveObject(clonedObj);
      this.canvas.requestRenderAll();
      this.history.push()
    });
  }
}
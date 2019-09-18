import { fabric } from "fabric"

export class ShapeInserter {
    private canvas: fabric.Canvas
    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas
    }
    insert(shapeStr: string) {
        let shape: fabric.Object
        let commomOptions: fabric.IObjectOptions = {
            fill: 'transparent',
            borderColor: 'white',
            strokeUniform: true,
            stroke: '2px solid white',
            borderScaleFactor: 2,
            left: this.canvas.getWidth()/2,
            top: this.canvas.getHeight()/2
        }
        switch (shapeStr) {
            case "circle":
                shape = new fabric.Circle({radius: 60, ...commomOptions})
                break;
            case "square":
                shape = new fabric.Rect({width: 60, height: 60, ...commomOptions})
            default:
                break;
        }
        this.canvas.add(shape)
    }
}
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
    static getProperties(object: fabric.Object): {name: string, type: string}[] {
        let properties: {name: string, type: string}[] = [
            {name: 'borderColor', type: 'color'},
            {name: 'fill', type: 'color'},
            {name: 'stroke', type: 'border'}
        ]
        switch (object.type) {
            case 'rect':
                properties.push({name: 'radius', type: 'number'})
                break;
            case 'rect':
                properties.push({name: 'width', type: 'number'})
                properties.push({name: 'height', type: 'number'})
            default:
                break;
        }
        return properties
    }

    static getCommonProperties(objects: fabric.Object[]): {name: string, type: string}[] {
        let common: {name: string, type: string}[] = []

        return common
    }

}
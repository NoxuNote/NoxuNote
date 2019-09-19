import { fabric } from "fabric"

export type PropertyList = {name: string, type: string, value: string | number }[]

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
            padding: 0,
            borderScaleFactor: 2,
            left: this.canvas.getWidth() / 2,
            top: this.canvas.getHeight() / 2
        }
        switch (shapeStr) {
            case "circle":
                shape = new fabric.Circle({ radius: 50, ...commomOptions })
                break;
            case "square":
                shape = new fabric.Rect({ width: 100, height: 100, ...commomOptions })
            default:
                break;
        }
        this.canvas.add(shape)
    }
    static getProperties(object: fabric.Object): PropertyList {
        let properties: PropertyList = [
            { name: 'borderColor', type: 'color', value: object.borderColor },
            { name: 'fill', type: 'color', value: object.fill.toString() },
            { name: 'stroke', type: 'border', value: object.stroke }
        ]
        switch (object.type) {
            case 'circle':
                properties.push({ name: 'radius', type: 'number', value: (<fabric.Circle>object).radius})
                break;
            case 'rect':
                properties.push({ name: 'width', type: 'number', value: (<fabric.Rect>object).width})
                properties.push({ name: 'height', type: 'number', value: (<fabric.Rect>object).height})
            default:
                break;
        }
        return properties
    }

    static getCommonProperties(objects: fabric.Object[]): PropertyList {
        let properties: PropertyList[] = []
        let commonProperties: PropertyList = []
        objects.forEach(o => properties.push(ShapeInserter.getProperties(o)))
        function isACommonOption(optionName: string, properties: PropertyList[]): boolean {
            let output = true
            properties.forEach( (pl: PropertyList) => {
                output = output && pl.map(p=>p.name).includes(optionName)
            })
            return output
        }
        properties.forEach( (pl: PropertyList) => {
            pl.forEach(property=>{
                if (!commonProperties.map(p=>p.name).includes(property.name) && isACommonOption(property.name, properties)) {
                    property.value = null
                    commonProperties.push(property)
                }
            })
        })
        return commonProperties
    }
}
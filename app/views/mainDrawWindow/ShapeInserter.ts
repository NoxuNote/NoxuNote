import { fabric } from "fabric"

export enum PropType {
    Number = 0,
    StrokeWidth = 1,
    Opacity = 2,
    Color = 3
}

export type ObjProps = {name: string, type: PropType, value: string | number }

export class ShapeInserter {
    private canvas: fabric.Canvas
    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas
    }
    insert(shapeStr: string) {
        let shape: fabric.Object
        let commomOptions: fabric.IObjectOptions = {
            fill: 'transparent',
            strokeUniform: true,
            padding: 0,
            stroke: '#FFFFFF',
            left: this.canvas.getWidth() / 2,
            top: this.canvas.getHeight() / 2,
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
    static getProperties(object: fabric.Object): ObjProps[] {
        /**
         * type : ['border', 'number', 'color', 'opacity']
         */
        let properties: ObjProps[] = [
            { name: 'opacity', type: PropType.Opacity, value: object.opacity },
            { name: 'fill', type: PropType.Color, value: object.fill.toString() },
            { name: 'stroke', type: PropType.Color, value: object.stroke },
            { name: 'strokeWidth', type: PropType.StrokeWidth, value: object.strokeWidth }
        ]
        switch (object.type) {
            case 'circle':
                properties.push({ name: 'radius', type: PropType.Number, value: (<fabric.Circle>object).radius})
                break;
            case 'rect':
                break;
            default:
                break;
        }
        return properties
    }

    static getCommonProperties(objects: fabric.Object[]): ObjProps[] {
        let properties: ObjProps[][] = []
        let commonProperties: ObjProps[] = []
        objects.forEach(o => properties.push(ShapeInserter.getProperties(o)))
        function isACommonOption(optionName: string, properties: ObjProps[][]): boolean {
            let output = true
            properties.forEach( (pl: ObjProps[]) => {
                output = output && pl.map(p=>p.name).includes(optionName)
            })
            return output
        }
        properties.forEach( (pl: ObjProps[]) => {
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
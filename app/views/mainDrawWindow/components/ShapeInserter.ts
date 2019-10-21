import { fabric } from "fabric"
import { EventEmitter } from "events"

export enum PropType {
    Number = 0,
    StrokeWidth = 1,
    Opacity = 2,
    Color = 3,
    Font = 4
}

export type ObjProps = {name: string, type: PropType, value: string | number }

export class ShapeInserter extends EventEmitter {
    private canvas: fabric.Canvas
    public createdLines: fabric.Line[]
    constructor(canvas: fabric.Canvas) {
        super()
        this.canvas = canvas
    }
    insert(shapeStr: string): fabric.Object {
        let shape: fabric.Object
        let commomOptions: fabric.IObjectOptions = {
            fill: 'transparent',
            strokeUniform: true,
            padding: 0,
            stroke: '#FFFFFF',
            strokeWidth: 4,
            left: this.canvas.getWidth() / 3,
            top: this.canvas.getHeight() / 2,
        }
        switch (shapeStr) {
            case "circle":
                shape = new fabric.Circle({ radius: 50, ...commomOptions })
                break;
            case "square":
                shape = new fabric.Rect({ width: 100, height: 100, ...commomOptions })
                break;
            case "text":
                shape = new fabric.IText('Texte', {...commomOptions, fill: 'white', strokeWidth: 0})
                break;
            // case "line":
            //     shape = new fabric.Line([200, 200, 400, 400], {stroke: '#FFFFFF', strokeWidth: 4, strokeUniform: true, selectable: true})
            //     // shape.on('mousedown', ()=>{this.canvas.discardActiveObject();this.lineHandler.handleLineClick(shape as fabric.Line)})
            //     // this.createdLines.push(shape as fabric.Line)
            //     break;
            default:
                break;
        }
        this.canvas.add(shape)
        this.canvas.bringToFront(shape)
        this.emit('insert')
        return shape
    }
    static getProperties(object: fabric.Object): ObjProps[] {
        /**
         * type : ['border', 'number', 'color', 'opacity']
         */
        let properties: ObjProps[] = [
            { name: 'opacity', type: PropType.Opacity, value: object.opacity },
            { name: 'stroke', type: PropType.Color, value: object.stroke },
            { name: 'strokeWidth', type: PropType.StrokeWidth, value: object.strokeWidth }
        ]
        switch (object.type) {
            case 'circle':
                properties.push({ name: 'radius', type: PropType.Number, value: (<fabric.Circle>object).radius})
                properties.push({ name: 'fill', type: PropType.Color, value: object.fill.toString()})
                break;
            case 'rect':
                properties.push({ name: 'fill', type: PropType.Color, value: object.fill.toString()})    
                break;
            case 'i-text':
                properties.push({ name: 'fill', type: PropType.Color, value: object.fill.toString()})    
                properties.push({ name: 'fontFamily', type: PropType.Font, value: (object as fabric.Text).fontFamily.toString()}) 
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
                    commonProperties.push(property)
                }
            })
        })
        return commonProperties
    }
}
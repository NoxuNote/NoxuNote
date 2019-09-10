import { CSSPreset } from "./CSSPreset";

export class StylePreset {

    preset: { format: string, jcss: CSSPreset }
    css: CSSPreset

    constructor() {
        this.preset = {
            format: 'PDF',
            jcss: {
                general: {
                    factAgrandissement: 1,
                    paddingTop: 12,
                    paddingLeft: 12,
                    paddingRight: 12
                },
                h3: {
                    fontFamily: 'Arial',
                    fontSize: 12,
                    textAlign: 'left',
                    marginLeft: 0,
                    marginTop: 0
                },
                h2: {
                    fontFamily: 'FlatLight',
                    fontSize: 15,
                    textAlign: 'left',
                    marginLeft: 0,
                    marginTop: 0
                },
                h1: {
                    fontFamily: 'FlatLight',
                    fontSize: 32,
                    textAlign: 'center',
                    marginLeft: 0,
                    marginTop: 5
                },
                p: {
                    fontFamily: 'Arial',
                    fontSize: 11,
                    textAlign: 'left',
                    marginLeft: 0,
                    marginRight: 0,
                    marginTop: 0
                },
                table: {
                    fontFamily: 'Arial',
                    borderLength: 1,
                    fontSize: 12,
                    padding: 3,
                    borderEffect: "solid",
                    textAlign: 'left',
                    alignTable: 'left',
                    marginLeft: 0,
                    marginTop: 0,
                    marginBottom: 0,
                    backgroundColor: '#FFFFFF',
                    color: 'black'
                }
            }
        }
        this.css = this.preset.jcss
    }

    generateCss(): string {
        let s = this.preset.jcss
        return `
            h3 {
                page-break-inside:avoid; page-break-after:auto;
                font-family: ${s.h3.fontFamily};
                font-size: ${s.h3.fontSize}px;
                text-align: ${s.h3.textAlign};
                margin-left: ${s.h3.marginLeft}mm;
                margin-top: ${s.h3.marginTop}mm;
            }
            h2 {
                page-break-inside:avoid; page-break-after:auto;
                margin-top: 5mm;
                font-family: ${s.h2.fontFamily};
                font-size: ${s.h2.fontSize}px;
                text-align: ${s.h2.textAlign};
                margin-left: ${s.h2.marginLeft}mm;
                margin-top: ${s.h2.marginTop}mm;
            }
            h1 {
                page-break-inside:avoid; page-break-after:auto;
                font-family: ${s.h1.fontFamily};
                font-size: ${s.h1.fontSize}px;
                text-align: ${s.h1.textAlign};
                margin-left: ${s.h1.marginLeft}mm;
                margin-top: ${s.h1.marginTop}mm;
            }
            table {
                width: auto;
                page-break-inside:avoid; page-break-after:auto;
                border-collapse: collapse;
                border: ${s.table.borderLength}px solid black;
                backgroundColor: ${s.table.backgroundColor};
                color: ${s.table.color};
                margin-left: ${s.table.marginLeft}mm;
                margin-top: ${s.table.marginTop}mm;
                margin-bottom: ${s.table.marginBottom}mm;
            }
            td, tr {
                font-family: ${s.table.fontFamily};
                border: ${s.table.borderLength}px ${s.table.borderEffect} #000000;
                font-size: ${s.table.fontSize}px;
                padding: ${s.table.padding}px;
                background-color: #e9f2f7;
                text-align: ${s.table.textAlign};
            }
            div#content {
                padding-top: ${s.general.paddingTop}mm;
                padding-left: ${s.general.paddingLeft}mm;
                padding-right: ${s.general.paddingRight}mm;
                font-size: ${s.general.factAgrandissement}em;
            }
            em {
                page-break-inside:avoid; page-break-after:auto;
                color: #16150B;
                background-color: rgba(229, 234, 65, 0.89);
                padding: 0.1em;
                font-style: normal;
            }
            span#important {
                background-color: #C95705;
                border-radius: 3px;
                color: #FFFFFF;
                padding: 5px;
                display: inline-block;
                margin-top: 3px;
            }
            span#optionnal {
                display: block;
                text-align: right;
                font-size: 0.8em;
                color: #9FA2A1;
            }
            img {
                page-break-inside:avoid; page-break-after:auto;
                max-width: 100%;
                margin-left: auto;
                margin-right: auto;
            }
            .encadre {
                page-break-inside:avoid; page-break-after:auto;
                border: 2px solid #121212;
                padding: 1px;
            }
            .flat_text {
                display: block;
                margin-left: ${s.p.marginLeft}mm;
                margin-right: ${s.p.marginRight}mm;
                margin-top: ${s.p.marginTop}mm;
                font-size: ${s.p.fontSize}px;
                font-family: ${s.p.fontFamily};
                text-align: ${s.p.textAlign};
            }
            xmp {
                page-break-inside:avoid; page-break-after:auto;
                margin: 0cm;
                margin-left: 0.2cm;
                padding-left: 2px;
                overflow: hidden;
                text-overflow: ellipsis;
                background-color: #f8f8f8;
            }
        `
    }
}

module.exports.StylePreset = StylePreset
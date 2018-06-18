class StylePreset {

    constructor() {
        this.preset = {
            format: 'PDF',
            jcss: {
                h3: {
                    fontFamily: 'Arial',
                    fontSize: '12',
                    textAlign: 'left'
                },
                h2: {
                    fontFamily: 'FlatLight',
                    fontSize: '25',
                    textAlign: 'left'
                },
                h1: {
                    fontFamily: 'FlatBold',
                    fontSize: '50',
                    textAlign: 'center'
                },
                p: {
                    fontFamily: 'Arial',
                    fontSize: '12',
                    textAlign: 'left',
                },
                table: {
                    borderLength: 1,
                    fontSize: '12',
                    textAlign: 'left',
                    backgroundColor: '#FFFFFF',
                    color: 'black'
                }
            }
        }
        this.css = this.preset.jcss
    }

    generateCss() {
        let s = this.preset.jcss
        let css = `
            h3 {
                font-family: ${s.h3.fontFamily};
                font-size: ${s.h3.fontSize}px;
                text-align: ${s.h3.textAlign};
            }
            h2 {
                font-family: ${s.h2.fontFamily};
                font-size: ${s.h2.fontSize}px;
                text-align: ${s.h2.textAlign};
            }
            h1 {
                font-family: ${s.h1.fontFamily};
                font-size: ${s.h1.fontSize}px;
                text-align: ${s.h1.textAlign};
            }
            p {
                font-family: ${s.p.fontFamily};
                font-size: ${s.p.fontSize}px;
                textAlign: ${s.p.textAlign};
            }
            table {
                border: ${s.table.borderLength}px solid black;
                font-size: ${s.table.fontSize}px;
                textAlign: ${s.table.textAlign};
                backgroundColor: ${s.table.backgroundColor};
                color: ${s.table.color};
            }

            div#content {
                margin: 1.2cm;
                font-size: 1.0em;
            }
            em {
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
                max-width: 100%;
                margin-left: auto;
                margin-right: auto;
            }
            .encadre {
                border: 2px solid #121212;
                padding: 1px;
            }
            td, tr {
                border: 1px solid #000000;
                padding: 5px;
                background-color: #e9f2f7;
                text-align: center;
            }
            .flat_text {
                margin-left: 3%;
            }
        `
        return css
    } 
}

module.exports.StylePreset = StylePreset
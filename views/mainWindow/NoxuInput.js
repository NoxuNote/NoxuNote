class NoxuInput extends HTMLElement {

    constructor(isModifier = false, modifiedLine = -1, ipc = null, defaultValue = "") {
        // Initialize superclass
        super()
        // Setting up image button
        this.menuBoutons = document.createElement('div')
        this.appendChild(this.menuBoutons)
        // Adding Image button to menuBoutons
        this.boldButton = document.createElement('div')
        this.boldButton.className = "imageButton"
        this.boldButton.innerHTML = '<i class="fas fa-bold"></i>'
        this.boldButton.onclick = (event) => { NoxuInput.surroundSelection('**') }
        this.menuBoutons.appendChild(this.boldButton)
        // Adding draw button to menuBoutons
        this.underlineButton = document.createElement('div')
        this.underlineButton.className = "imageButton"
        this.underlineButton.innerHTML = '<i class="fas fa-underline"></i>'
        this.underlineButton.onclick = (event) => { NoxuInput.surroundSelection('__') }
        this.menuBoutons.appendChild(this.underlineButton)
        // Adding italic button
        this.italicButton = document.createElement('div')
        this.italicButton.className = "imageButton"
        this.italicButton.innerHTML = '<i class="fas fa-italic"></i>'
        this.italicButton.onclick = (event) => { NoxuInput.surroundSelection('::') }
        this.menuBoutons.appendChild(this.italicButton)
        // Adding math button
        this.mathButton = document.createElement('div')
        this.mathButton.className = "imageButton"
        this.mathButton.innerHTML = '<i class="fas fa-calculator"></i>'
        this.mathButton.onclick = (event) => { NoxuInput.surroundSelection('$$') }
        this.menuBoutons.appendChild(this.mathButton)
        // Separator
        var separator = document.createElement('div')
        separator.innerHTML = "&nbsp;|&nbsp;"
        separator.style.color = "#888888"
        separator.style.float = "left"
        this.menuBoutons.appendChild(separator)
        // Adding title button
        this.titleButton = document.createElement('div')
        this.titleButton.className = "imageButton"
        this.titleButton.innerHTML = '<i class="fas fa-slack"></i>1'
        this.titleButton.onclick = (event) => { NoxuInput.setPrefix('#') }
        this.menuBoutons.appendChild(this.titleButton)
        // Adding title button
        this.titleButton2 = document.createElement('div')
        this.titleButton2.className = "imageButton"
        this.titleButton2.innerHTML = '<i class="fas fa-slack"></i>2'
        this.titleButton2.onclick = (event) => { NoxuInput.setPrefix('##') }
        this.menuBoutons.appendChild(this.titleButton2)
        // Adding title button
        this.titleButton3 = document.createElement('div')
        this.titleButton3.className = "imageButton"
        this.titleButton3.innerHTML = '<i class="fas fa-slack"></i>3'
        this.titleButton3.onclick = (event) => { NoxuInput.setPrefix('###') }
        this.menuBoutons.appendChild(this.titleButton3)
        // Adding encadré button
        this.encadreButton = document.createElement('div')
        this.encadreButton.className = "imageButton"
        this.encadreButton.innerHTML = '<i class="fas fa-square-o"></i>'
        this.encadreButton.onclick = (event) => { NoxuInput.setPrefix('[') }
        this.menuBoutons.appendChild(this.encadreButton)
        // Adding warn button
        this.warnButton = document.createElement('div')
        this.warnButton.className = "imageButton"
        this.warnButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i>'
        this.warnButton.onclick = (event) => { NoxuInput.setPrefix('!') }
        this.menuBoutons.appendChild(this.warnButton)
        // Adding marginal button
        this.marginalButton = document.createElement('div')
        this.marginalButton.className = "imageButton"
        this.marginalButton.innerHTML = '<i class="fas fa-comment"></i>'
        this.marginalButton.onclick = (event) => { NoxuInput.setPrefix('(') }
        this.menuBoutons.appendChild(this.marginalButton)
        // Adding code button
        this.codeButton = document.createElement('div')
        this.codeButton.className = "imageButton"
        this.codeButton.innerHTML = '<i class="fas fa-code"></i>'
        this.codeButton.onclick = (event) => { NoxuInput.setPrefix('>') }
        this.menuBoutons.appendChild(this.codeButton)
        // Adding link button
        this.linkButton = document.createElement('div')
        this.linkButton.className = "imageButton"
        this.linkButton.innerHTML = '<i class="fas fa-link"></i>'
        this.linkButton.onclick = (event) => { NoxuInput.setPrefix('img =') }
        this.menuBoutons.appendChild(this.linkButton)
        // Adding cross button
        this.crossButton = document.createElement('div')
        this.crossButton.className = "imageButton"
        this.crossButton.innerHTML = '<i class="fas fa-times-circle"></i>'
        this.crossButton.onclick = (event) => { NoxuInput.setPrefix('') }
        this.menuBoutons.appendChild(this.crossButton)
        // Setting up textarea
        this.textarea = document.createElement('textarea')
        this.value = defaultValue
        this.textarea.setAttribute("placeholder", "Entrez du texte")
        this.appendChild(this.textarea)

        this.isModifier = isModifier
        this.modifiedLine = modifiedLine
        this.ipc = ipc // Défini plus tard
        this.isMouseIn = false

        this.setStyle()
        this.setInteractions()
    }


    /**
     * Add listeners to element
     */
    setInteractions() {
        // Input listeners
        this.textarea.addEventListener("keydown", (event) => {
            console.log(this.value.length == 0, this.isModifier, this.modifiedLine - 1 > 0)
            console.log(event.which)
            window.location.hash = "#noxuinput"
            // Appui sur la touche entrée
            if (event.which == 13) {
                if (ipc) {
                    if (this.isModifier) this.ipc.send('entree_texte', this.modifiedLine, this.value, true)
                    else this.ipc.send('entree_texte', -1, this.value)
                } else throw Error("Aucun ipc n'est associé au NoxuInput")
            }
            // Appui sur la touche retour
            if (event.keyCode == 8) {
                console.log(this.ipc.sendSync('getNoteLength'))
                if (this.value.length == 0 && this.isModifier && this.modifiedLine - 1 > 0) {
                    this.ipc.send('delete_div', this.modifiedLine)
                    this.ipc.send('edit_div', this.modifiedLine - 1, "")
                }
                else if (this.value.length == 0 && !this.isModifier && this.ipc.sendSync('getNoteLength')>0) {
                    this.ipc.send('edit_div', 0, "")
                }
            }
        })
        this.textarea.addEventListener("click", (event) => {
            if (this.textarea !== document.activeElement) this.setFocus()
        })
        this.textarea.addEventListener("keyup", (event) => {
            NoxuInput.auto_grow(this.textarea)
        })
        this.textarea.addEventListener("focus", (event) => {
            NoxuInput.auto_grow(this.textarea)
        })
        this.addEventListener('mouseenter', (event) => {
            this.isMouseIn = true
            setTimeout(() => this.fadeInOpacity(this.menuBoutons, 0.4), 400)
        })
        this.addEventListener('mouseleave', (event) => {
            this.isMouseIn = false
            this.menuBoutons.style.opacity = 0
        })
    }

    fadeInOpacity(el, duration) {
        if (parseFloat(el.style.opacity) < 1) {
            if (!this.isMouseIn) {
                el.style.opacity = 0
                return
            }
            el.style.opacity = parseFloat(el.style.opacity) + 0.01
            setTimeout(() => this.fadeInOpacity(el, duration), duration / 1000)
        }
    }

    static auto_grow(element) {
        element.style.height = "5px";
        element.style.height = (element.scrollHeight) + "px";
        window.location.hash = "#noxuinput"
    }


    /**
     * Shows the input on the document
     */
    show() {
        this.style.visibility = "visible"
    }

    /**
     * Hides the input on the document
     */
    hide() {
        this.style.visibility = "hidden"
    }

    /**
     * @return true if the input is visible on document
     */
    get isVisible() {
        return this.style.visibility == "visible"
    }

    /**
     * Applique le style Noxu-Input à un élément
     * @param {style} s Un style d'élément
     */
    setStyle() {
        // Ajout du style manuel pour les hover
        var css = ".imageButton {"
        css += "color: #3d3d3d; height: 22px; width: 30px; border-radius: 5px; padding-top: 3px;"
        css += "text-align: center; cursor: pointer; float: left; font-size: 0.8em;}"
        css += ".imageButton:hover { background-color: #999999 }"
        var style = document.createElement('style')
        style.appendChild(document.createTextNode(css));
        this.appendChild(style)
        this.style.marginTop = "1000px"

        // Styles des éléments
        var s = this.textarea.style
        s.display = "block"
        s.margin = "0px"
        s.width = "100%"
        s.border = "none"
        s.color = "white"
        s.backgroundColor = "#282F37"
        s.fontSize = "1.0em"
        s.fontFamily = "Arial, Times, sans-serif"
        s.padding = "5px"
        s.marginTop = "28px"
        if (this.isModifier) s.outline = "3px dashed rgb(62, 140, 166)"

        s = this.menuBoutons.style
        s.borderRadius = "5px"
        s.boxShadow = "1px 1px 5px 0px rgba(0,0,0,0.75)"
        s.height = "25px"
        s.backgroundColor = "#f2f2f2"
        s.opacity = 0
        s.position = 'absolute'
        s.transform = "translate(0px, -25px)"
    }

    /**get value() {
        var value = this.innerHTML.replace(RegExp(String.fromCharCode(160), "g"), " ").trim()
        if (value == this.defaultText) {
            return ""
        } else {
            return value
        } 
    }**/
    get value() {
        return this.textarea.value
    }
    getModifiedLine() {
        return parseInt(this.modifiedLine)
    }
    set value(t) {
        this.textarea.value = t
    }
    setIpc(ipc) {
        this.ipc = ipc
    }
    setFocus() {
        this.textarea.focus()
        this.textarea.selectionStart = this.value.length
    }
    /***************************************************************************************************
     *                                 FONCTIONS DES BOUTONS DE TEXTE                                  *
     ***************************************************************************************************/
    static surroundSelection(exp) {
        var noxuInput = getActualForm()
        // Returns a range object
        var start = noxuInput.textarea.selectionStart
        var end = noxuInput.textarea.selectionEnd
        var firstPart = noxuInput.value.substring(0, start)
        var selection = noxuInput.value.substring(start, end)
        var endPart = noxuInput.value.substring(end, noxuInput.value.length)
        noxuInput.value = firstPart + exp + selection + exp + endPart
    }

    static setPrefix(exp) {
        var noxuInput = getActualForm()
        var value = noxuInput.value
        // Clearing flags
        value = value.replace(/^[\s]*[\#]{1,}/g, '')
        value = value.replace(/^[\[]/g, '')
        value = value.replace(/^[\!]/g, '')
        value = value.replace(/^[\(]/g, '')
        value = value.replace(/^[\>]/g, '')
        value = value.replace(/^[\s]*((img)|(image))[\s]*[\=]/g, '')
        var space = " "
        if (exp == "") space = ""
        noxuInput.value = exp + space + value.trim()
    }

}

// When importing this class you need to register noxu-input as a new HTMLElement.
window.customElements.define('noxu-input', NoxuInput)
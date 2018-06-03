/***************************************************************************************************
 *                                        COLOR PICKER CSS                                         *
 ***************************************************************************************************/
/*

 div.colorpicker {
    width: 100px;
    background-color: rgba(93, 96, 102, 0.6);
    border-radius: 9px;
    padding: 3px;
    position: absolute;
    z-index: 2;
    box-shadow: 1px 3px 4px 0px rgba(0, 0, 0, 0.38);
    transform: translate(0px, 8px);
}
.colorbutton {
    width: 14px;
    height: 12px;
    border: none;
    margin: 3px;
    box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.24);
    border-radius: 5px;
    cursor: pointer;
}
.arrow-up {
    width: 0;
    height: 0px;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 8px solid rgba(93, 96, 102, 0.6);
    position: absolute;
    top: -8px;
    left: 48px;
}

*/
class ColorPicker extends HTMLElement {
    constructor(colors, id, parent) {
        // Inisialisation
        super()
        this.className = "colorpicker"
        this.parent = parent
        this.id = id
        // Ajout d'une flèche en haut
        var arrow = document.createElement('div')
        arrow.className = "arrow-up"
        this.appendChild(arrow)
        // Ajout des carrés de couleur
        for (var i = 0; i < colors.length; i++) {
            var cb = document.createElement('button')
            cb.className = 'colorbutton'
            cb.style.backgroundColor = colors[i]
            // Quand on cliquera sur une case, créee un Event 'colorClicked' contenant la couleur
            cb.addEventListener('click', (event)=>{
                var detail = {  // On créee un objet détail qui contient la couleur
                    detail: {  // et l'id de l'objet qui est modifié
                        "color" : event.target.style.backgroundColor,
                        "id" : event.target.parentNode.id
                    }
                }
                this.dispatchEvent(
                    new CustomEvent('colorClicked', detail)
                )
            })
            this.appendChild(cb)
        }
        setImmediate(()=>{ // Après que le navigateur ait terminé l'affichage de l'élément
            var that = this // On stoque l'objet dans une autre variable pour ne pas interférer
            document.addEventListener('click', function _colorPicker(event) {
                if (that !== event.target) { // Si le clic n'est pas sur cet élément, on le supprime
                    that.parent.removeChild(that)
                    document.removeEventListener('click', _colorPicker) // On supprime le listener
                }
            })
        })        
    }
}

// When importing this class you need to register noxu-input as a new HTMLElement.
window.customElements.define('color-picker', ColorPicker)
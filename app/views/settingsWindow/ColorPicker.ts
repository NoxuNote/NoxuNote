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
import { Matiere } from '../../types'

export class ColorPicker {
    public parent: HTMLElement
    public element: HTMLElement
    constructor(colors: string[], mat: Matiere, parent: HTMLElement) {
        // Inisialisation
        this.element = document.createElement('div')
        this.element.className = "colorpicker"
        // Ajout d'une flèche en haut
        var arrow = document.createElement('div')
        arrow.className = "arrow-up"
        this.element.appendChild(arrow)
        // Ajout des carrés de couleur
        colors.forEach(color => {
            let cb = document.createElement('button')
            cb.className = 'colorbutton'
            cb.style.backgroundColor = color
            // Quand on cliquera sur une case, créee un Event 'colorClicked' contenant la couleur
            cb.addEventListener('click', (event)=>{
                let detail;
                if (event.target instanceof HTMLElement) {
                    detail = {  // On créee un objet détail qui contient la couleur
                        detail: {  // et l'id de l'objet qui est modifié
                            "color" : color,
                            "matiereId" : mat.id
                        }
                    }
                }
                this.element.dispatchEvent(
                    new CustomEvent('colorClicked', detail)
                )
            })
            this.element.appendChild(cb)
        })
        setImmediate(()=>{ // Après que le navigateur ait terminé l'affichage de l'élément
            var that = this // On stoque l'objet dans une autre variable pour ne pas interférer
            document.addEventListener('click', function _colorPicker(event) {
                if (that.element !== event.target) { // Si le clic n'est pas sur cet élément, on le supprime
                    that.element.parentElement.removeChild(that.element)
                    document.removeEventListener('click', _colorPicker) // On supprime le listener
                }
            })
        })   
        parent.appendChild(this.element)
    }

}
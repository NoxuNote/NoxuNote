import { ModalManager } from "./ModalManager"

export class EquationManager {
  equationPreviewNode: HTMLElement;
  $historyNode: JQuery<HTMLElement>;
  $equationValueNode: JQuery<HTMLElement>;
  $equationPreset: JQuery<HTMLElement>;
  modalManager: ModalManager;
  editor: JQuery<HTMLElement>;
  history: { code: string, node: Node }[];
  presets: { key: string; code: string; }[];

  editingMathNode: HTMLSpanElement;

  constructor(modalManager: ModalManager, editor: JQuery) {
    var equationHistory = []
    this.equationPreviewNode = document.getElementById('equation¨Preview')
    this.$historyNode = $('#equationHistory')
    this.$equationValueNode = $('#equationValue')
    this.$equationPreset = $('#equationPreset')
    this.modalManager = modalManager
    this.editor = editor
    // Historique des commandes [ {code: string, node: HTMLElement}, ... ]
    this.history = []
    this.presets = [
      {
        key: "default",
        code: ""
      },
      {
        key: "limit",
        code: "lim_(x->oo) f(x)"
      },
      {
        key: "sum",
        code: "sum_(k=0)^oo k^2"
      },
      {
        key: "integral",
        code: "int_a^b f(x)dx"
      },
      {
        key: "vector",
        code: "vec u"
      },
      {
        key: "columnvector",
        code: "( (u_1), (u_2) ) "
      },
      {
        key: "matrix2x2",
        code: "[ [a,b], [c,d] ] "
      },
      {
        key: "matrix3x3",
        code: "[ [a,b,c], [d,e,f], [g,h,i] ] "
      },
      {
        key: "system",
        code: "{ (a,+,b,=,c) , (a,-,c,=,d) :} "
      },
      {
        key: "accsup",
        code: 'obrace(1+2+3+4)^("addition") '
      },
      {
        key: "accinf",
        code: 'ubrace(1+2+3+4)_("addition") '
      }
    ]
  }

  onKeyUp($event: KeyboardEvent) {
    if ($event.keyCode === 13) this.insertEquation()
    else this.updateEquationPreview()
  }

  chosenModel(event: any) {
    this.setEquationInput(this.presets.find(e=>this.$equationPreset.val()==e.key).code)
  }

  disableEditingMode() {
    this.editingMathNode = null
  }

  /**
   * Met a jour l'affichage de preview d'équation en fonction des données entrées
   * dans le champ du modal "Insérer une équation"
   */
  updateEquationPreview() {
    this.equationPreviewNode.innerHTML = '`' + this.$equationValueNode.val() + '`'
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.equationPreviewNode])
  }
  
  /**
   * Ajoute l'équation du modal "Insérer une équation" dans l'éditeur.
   */
  insertEquation() {
    const inputVal: string = this.$equationValueNode.val().toString()
    if (inputVal.length === 0) return
    // Création de l'élément HTML
    let wrapperNode = document.createElement('span')
    wrapperNode.contentEditable = 'true'

    // stoque la formule brute au format texte.
    let equationScriptNode = document.createElement('span') 
    equationScriptNode.style.opacity = '0'
    equationScriptNode.style.fontSize = '0em' // can't hide element or not copied to clipboard (chrome optimisation probably)
    equationScriptNode.classList.add('equationScript')
    equationScriptNode.innerText = inputVal
    
    // Insertion de la formule dans l'élement
    let mathNode = document.createElement('span')
    mathNode.classList.add('mathNode')
    mathNode.contentEditable = 'false'
    mathNode.style.display = 'inline-block'
    mathNode.innerHTML = "`" + inputVal + "`"
    mathNode.appendChild(equationScriptNode)
    mathNode.addEventListener('click', (e: MouseEvent) => {
      this.editMathNode(<HTMLElement> mathNode)
      e.stopPropagation()
    })
    wrapperNode.appendChild(mathNode)

    // Insertion d'un caractère après la formule pour aider le curseur à se repérer
    let afterNode = document.createElement('span')
    afterNode.innerHTML = '&zwnj;'
    wrapperNode.appendChild(afterNode)

    this.editor.summernote('restoreRange')
    // Insert generated to document
    if (this.editingMathNode)
      this.editingMathNode.parentElement.replaceChild(mathNode, this.editingMathNode)
    else
      this.editor.summernote('pasteHTML', wrapperNode);
    // Add equation to history
    if (this.history.filter(h=>h.code == inputVal).length == 0) {
      if (this.history.length > 10) this.history.shift()
      this.history.push({
        'code': inputVal,
        'node': mathNode.cloneNode(true)  
      })
    }
    // update, Close and clean modal
    this.modalManager.closeAllModal()
    this.$equationValueNode.val('')
    // Call MatJax
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, mathNode])
    // Clean the preview window
    this.equationPreviewNode.innerHTML = ""
    this.editor.summernote('focus')
  }
  
  /**
   * Met à jour l'équation en cours d'adition dans la modale
   * @param {string} code La nouvelle équation 
   */
  setEquationInput(code: string) {
    this.$equationValueNode.val(code)
    this.updateEquationPreview()
  }
  
  /**
   * Regénère l'historique des équations tapées dans la modale
   */
  refreshHistory() {
    this.$historyNode.empty()
    this.history.forEach(h=>{
      // Création du bouton suppression historique
      var del = document.createElement('div')
      del.classList.add('historyDeleteButton')
      del.innerHTML = '<i class="fas fa-times"></i>'
      del.addEventListener('click', ((e: MouseEvent)=>{
        e.stopPropagation()
        // Delete element from list
        var index = this.history.indexOf(h);
        if (index !== -1) this.history.splice(index, 1);
        // Refresh history
        this.refreshHistory()
      }))
      // Création de l'élément d'historique
      var el = document.createElement('div')
      el.appendChild(del)
      el.appendChild(h.node)
      el.classList.add('historyEquation') 
      el.addEventListener('click', (()=>this.setEquationInput(h.code)))
      // Ajout de l'élément d'historique à l'historique
      this.$historyNode.append(el)
    })
    // Call MatJax to render the node
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.$historyNode.get()])
  }

  editMathNode(mathNode: HTMLElement) {
    this.refreshHistory()
    this.editingMathNode = mathNode
    this.modalManager.openModal("equationModal")
    let math: string = (<HTMLSpanElement>mathNode.querySelector('span.equationScript')).innerText
    this.$equationValueNode.val(math)
    this.updateEquationPreview()
  }

}
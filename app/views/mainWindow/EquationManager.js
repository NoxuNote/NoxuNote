class EquationManager {

  constructor(modalManager, editor) {
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
        code: "( (a), (b) ) "
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

  onKeyUp($event) {
    if ($event.keyCode === 13) this.insertEquation()
    else this.updateEquationPreview()
  }

  chosenModel(event) {
    this.setEquationInput(this.presets.find(e=>this.$equationPreset.val()==e.key).code)
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
    const field = document.getElementById("equationValue");
    if (field.value.trim().length === 0) return
    this.editor.summernote('restoreRange')
    this.editor.summernote('focus')
    // Création de l'élément HTML
    var node = document.createElement('span')
    node.style.display = 'inline'
    node.contentEditable = true
    node.innerHTML = "`" + field.value + "`"
    this.editor.summernote('insertNode', node);
    this.editor.summernote('editor.pasteHTML', '&zwnj;')
    // Add equation to history
    if (this.history.filter(h=>h.code == field.value).length == 0) {
      if (this.history.length > 10) this.history.shift()
      this.history.push({
        'code': field.value,
        'node': node.cloneNode(true)
      })
    }
    // Close and clean modal
    modalManager.closeAllModal()
    field.value = ""
    // Call MatJax
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, node])
    // Clean the preview window
    this.equationPreviewNode.innerHTML = ""
    this.editor.summernote('focus')
  }
  
  /**
   * Met à jour l'équation en cours d'adition dans la modale
   * @param {string} code La nouvelle équation 
   */
  setEquationInput(code) {
    this.$equationValueNode.val(code)
    this.updateEquationPreview()
  }
  
  /**
   * Regénère l'historique des équations tapées dans la modale
   */
  refreshHistory() {
    var that = this
    this.$historyNode.empty()
    this.history.forEach(h=>{
      // Création du bouton suppression historique
      var del = document.createElement('div')
      del.classList.add('historyDeleteButton')
      del.innerHTML = '<i class="fas fa-times"></i>'
      del.addEventListener('click', (($event)=>{
        $event.stopPropagation()
        // Delete element from list
        var index = that.history.indexOf(h);
        if (index !== -1) that.history.splice(index, 1);
        // Refresh history
        that.refreshHistory()
      }))
      // Création de l'élément d'historique
      var el = document.createElement('div')
      el.appendChild(del)
      el.appendChild(h.node)
      el.classList.add('historyEquation') 
      el.addEventListener('click', (()=>that.setEquationInput(h.code)))
      // Ajout de l'élément d'historique à l'historique
      this.$historyNode.append(el)
    })
    // Call MatJax to render the node
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.$historyNode.get()])
  }

}

module.exports = EquationManager
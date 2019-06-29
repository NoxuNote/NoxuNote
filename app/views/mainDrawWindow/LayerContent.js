class LayerContent {
    /**
     * LayerContent peut contenir un nombre infini de canvas numérotés dans l'ordre
     * croissant. Cela permet de créer un système de calques superposés
     * ou de stoquer des canvas pour sauvegarde par exemple.
     * @param {div} layersDiv Une div vide qui stoque les canvas
     * @param {Number} width Largeur
     * @param {Number} height Hauteur
     */
    constructor(layersDiv, width, height) {
        this.width = width
        this.height = height
        // Div qui contient les layers
        this.layersDiv = layersDiv
        // Ici on stoque tous les canvas "calques"
        this.layers = new Array()
        this.layers.push(null) // Faire commencer l'indexation à 1
    }

    /** 
     * Copie le contenue d'un canevas sur un autre canvas
     * @param {Canvas} input Canevas à copier
     * @param {Canvas} output Canevas à écrire
     */
    static drawCanvas(input, output) {
        var destCtx = output.getContext('2d')
        var oldMode = destCtx.globalCompositeOperation
        destCtx.globalCompositeOperation = "source-over"
        destCtx.drawImage(input, 0, 0)
        destCtx.globalCompositeOperation = oldMode
    }

    /** 
     * Réattribue un z-index et un id correct à chaque layer 
     */
    reconstructLayersIds() {
        for (var i=1; i<this.layers.length; i++) {
            this.layers[i].id = i
            this.layers[i].style.zIndex = i
        }
    }

    /** 
     * Créee un nouveau layer 
     */
    addNewLayer() {
        var inputLayer = document.createElement('canvas')
        inputLayer.width = this.width
        inputLayer.height = this.height
        inputLayer.id = this.layers.length
        inputLayer.style.visibility = "hidden"
        this.layers.push(inputLayer)
        this.layersDiv.appendChild(inputLayer)
    }

    
    /**
     * Supprime le layer n
     * @param {number} n Un index de layer
     */
    removeLayer(n) {
        if (n>0 && n<this.layers.length) {
            this.layersDiv.removeChild(this.layers[n])
            this.layers.splice(n, 1)
            this.reconstructLayersIds()
        } else { 
            throw Error("Numéro entré invalide : " + n)
        }
    }

    /** 
     * Supprime le dernier layer
     */
    removeLastLayer() {
        if (this.layers.length>0) this.removeLayer(this.layers.length-1)
    }

    /**
     * Accesseurs
     */
    get lastCtx() {
        return this.layers[this.layers.length-1].getContext('2d')
    }
    get lastCanvas() {
        return this.layers[this.layers.length-1]
    }
    get length() {
        return this.layers.length-1
    }
}

module.exports.LayerContent = LayerContent
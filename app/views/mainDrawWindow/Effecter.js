/**
 * Cette classe, contenant majoritairement des méthodes statiques fournit un kit d'outils
 * pour modifier les images du canvas de l'outil de dessin, attention les méthodes ne retournent
 * pas toujours le même type de donnée. Parfois un canvas, parfois une image, parfois des dimensions
 */
class Effecter {

    /**
     * Applique une rotation à une image, renvoie une source
     * @param {HTMLImageElement} image Une image
     * @param {number} deg Un angle de rotation (en degrés)
     * @return La nouvelle image
     */
    static rotateImgBy90(image) {
        var tempCanvas = document.createElement('canvas')
        tempCanvas.width = image.height
        tempCanvas.height = image.width
        var tempCtx = tempCanvas.getContext('2d')
        tempCtx.rotate(90 * Math.PI / 180)
        tempCtx.translate(0, -image.height)
        tempCtx.drawImage(image, 0, 0)
        return tempCanvas
    }

    /**
     * Redimensionne en rognant des pixels
     * @param canvas Le canvas à découper
     * @param x1 coord du point supérieur gauche
     * @param y1 coord du point supérieur gauche
     * @param x2 coord du point inférieur droit
     * @param y2 coord du point inférieur droit
     * @return Le canvas redimensionné.
     */
    static cropCanvas(canvas, x1, y1, x2, y2) {
        var tempCanvas = document.createElement("canvas"),
            tCtx = tempCanvas.getContext("2d");
        tempCanvas.width = x2 - x1;
        tempCanvas.height = y2 - y1;
        tCtx.drawImage(canvas, 0, 0);
        return tempCanvas;
    }

    /**
     * Redimensionne une image sans perdre d'information
     * @param {HTMLImageElement} img l'image à modifier
     * @param {HTMLImageElement} original l'original de cette image pour ne pas perdre en qualité
     * @param {boolean} isImageFlipped indique si l'image est au format pivoté à 90°
     * @param {number} x un facteur X
     * @param {number} y un facteur Y
     * @return La nouvelle image
     */
    // TO DO - Conserver la rotation de l'image de base
    static resizeImg(img, original, x, y) {
        if (img.width < original.width / 50 && x < 1) return img
        var tempCanvas = document.createElement("canvas")
        var tempCtx = tempCanvas.getContext('2d')
        tempCanvas.width = img.width * x
        tempCanvas.height = img.height * y
        tempCtx.drawImage(original, 0, 0, img.width * x, img.height * y)
        return tempCanvas
    }

    /**
     * Transforme les pixels blancs en pixels noirs
     * @param {HTMLImageElement} img Une image à rendre négative
     * @return {Promise} l'URL de l'image modifiée
     */
    static whiteTransformation(innerImg) {
        return new Promise((resolve) => {
            /* On crée une nouvelle image car innerImg a potentiellement
             été redimensionnée par chromium. */
            var img = new Image()
            img.src = innerImg.src
            img.onload = ()=> {
                // On génère un canvas de l'image pour récupérer les pixels
                var tempCanvas = document.createElement("canvas")
                tempCanvas.width = img.width
                tempCanvas.height = img.height
                var tempCtx = tempCanvas.getContext("2d")
                tempCtx.drawImage(img, 0, 0, img.width, img.height)
                var imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
                var pixels = imageData.data
                for (var i = 0; i < pixels.length; i += 4) {
                    // Transforming white pixels to dark ones.
                    if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 700) {
                        pixels[i] = 30
                        pixels[i + 1] = 30
                        pixels[i + 2] = 30
                    }
                }
                // Reecriture du canvas de base avec les nouveaux pixels
                tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
                tempCtx.putImageData(imageData, 0, 0)
                // On resoud la promesse en envoyant la nouvelle URL source. 
                resolve(tempCanvas.toDataURL())
            }
        })
    }

    /**
     * Fonction qui permet lors du chargement d'une image de déterminer les dimensions
     * correctes pour la faire rentrer dans la fenetre de dessin
     * @param {HTMLImageElement} img L'image à faire rentrer dans un canvas
     * @param {number} x La largeur du canvas
     * @param {number} y La hauteur du canvas
     * @return Un tableau contenant la largeur et la hauteur nécessaire
     */
    static fitImgToRect(img, x, y) {
        var rapportImg = img.width / img.height
        var targetWidth = 0
        var targetHeight = 0
        // Si l'image est horizontalement trop grande 
        if (img.width > x && img.height < y) {
            targetWidth = x
            targetHeight = x / rapportImg
        }
        // Si l'image est verticalement trop grande 
        else if (img.width < x && img.height > y) {
            targetWidth = y * rapportImg
            targetHeight = y
        }
        // Si l'image est trop grande en largeur et en hauteur
        else if (img.width > x && img.height > y) {
            var rapportCanvas = x / y
            // Si l'image est trop grande et trop large
            if (rapportImg > rapportCanvas) {
                targetWidth = x
                targetHeight = x / rapportImg
                // L'image est trop grande et trop haute
            } else {
                targetWidth = y * rapportImg
                targetHeight = y
            }
        }
        // Si l'image rentre dans le canvas
        else {
            targetWidth = img.width
            targetHeight = img.height
        }
        targetWidth = Math.trunc(targetWidth)
        targetHeight = Math.trunc(targetHeight)
        return { targetWidth, targetHeight }
    }

}

module.exports = Effecter
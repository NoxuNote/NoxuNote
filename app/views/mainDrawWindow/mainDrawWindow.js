// Importing and creating electron aliases
const ipc = require('electron').ipcRenderer
const { ipcRenderer } = require('electron')
const { dialog } = require('electron')
const fs = require('fs')
const homedir = require('os').homedir()
const path = require('path')
const prompt = require('electron-prompt')
const math = require("mathjs")
const noxuCanvas = require('./LayerContent.js')
const effecteur = require('./Effecter.js')

const mkdirSync = function (dirPath) {
    try {
        fs.mkdirSync(dirPath)
    } catch (err) {
        if (err.code !== 'EEXIST') throw err
    }
}


// Taille
/**
 * anciennement 650 x 400
 */
var canWidth = 950
var canHeight = 560

var mouseX = 0
var mouseY = 0

// vaut -1 s'il s'agit d'un nouveau dessin
// vaus n s'il on édite la div n.
var edit = -1;
// Valeurs extremes du tracés, utilisé pour découpage à l'exportation
var maxX = 0;
var maxY = 0;
var mode = "color" // importImage, color, eraser, segment

// Stoque l'image en cours d'importation pour aperçu
let importedImage
let originalImportedImage

// Stoque le texte entré lors de l'appui sur le bouton "Texte"
var inputText = ""

// Détermine si le clic est enfoncé ou non
var clickPressed = false

// Mémorise les points de départ et d'arrivée du segment
let segBeginX
let segBeginY
let segEndX
let segEndY

// Nom du fichier importé
var oldFileName = "";

/* Début des fonctions issues de StackOverflow */

var canvas, ctx, flag = false,
    prevX = 0,
    currX = 0,
    prevY = 0,
    currY = 0,
    dot_flag = false;
var fillColor = "white",
    y = 2;

function initDrawer() {
    // Canvas "can"
    canvas = document.getElementById('can');
    ctx = canvas.getContext("2d");
    w = canvas.width;
    h = canvas.height;

    // Canvas "canTop"
    canvasTop = document.getElementById('canTop')
    ctxTop = canvasTop.getContext("2d")

    canvasTop.addEventListener("mousemove", function (e) {
        findxy('move', e)
    }, false);
    canvasTop.addEventListener("mousedown", function (e) {
        findxy('down', e)
    }, false);
    canvasTop.addEventListener("mouseup", function (e) {
        findxy('up', e)
    }, false);
    canvasTop.addEventListener("mouseout", function (e) {
        findxy('out', e)
    }, false);
}

/**
 * Fixe la couleur du pinceau
 * @param {Element} obj Un élément HTML dont l'id est un code couleur
 */
function color(obj) {
    mode = "color"
    fillColor = obj.id
}

function gomme() {
    mode = "eraser"
}

function draw() {
    if (mode == "color") {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = fillColor;
        ctx.lineWidth = y;
    } else if (mode == "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = ("rgba(255,255,255,255)");
        ctx.lineWidth = 30;
    }
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.stroke();
    ctx.closePath();
}

function findxy(res, e) {
    // Si le mode n'est pas gomme on est en écriture du canvas
    if (mode != "eraser") ctx.globalCompositeOperation = "source-over"

    // Mémorisation de l'état du click
    if (res == 'up' || res == "out") clickPressed = false
    if (res == 'down') clickPressed = true

    // On définit des variables de position du curseur (locales à la fonction)
    mouseX = e.clientX - canvas.offsetLeft
    mouseY = e.clientY - canvas.offsetTop

    // Si la touche shift est pressée (mode segment)
    if (mode == 'segment') {
        if (res == 'down') {
            // On mémorise que le click est enfoncé et les coordonnées de départ
            segBeginX = e.clientX - canvas.offsetLeft;
            segBeginY = e.clientY - canvas.offsetTop;
        } else if (res == 'up') {
            // Le clic n'est plus pressé, on mémorise les coordonnées d'arrivée
            segEndX = e.clientX - canvas.offsetLeft;
            segEndY = e.clientY - canvas.offsetTop;
            // On nettoie le context Top
            ctxTop.clearRect(0, 0, canvasTop.width, canvasTop.height)
            // On trace une ligne
            drawLine(ctx, segBeginX, segBeginY, segEndX, segEndY, false)
        } else if (res == 'move') {
            // Si le clic est maintenu, on trace un aperçu du segment sur le ctxTop
            if (clickPressed) {
                ctxTop.clearRect(0, 0, canvasTop.width, canvasTop.height)
                drawLine(ctxTop, segBeginX, segBeginY, mouseX, mouseY, true)
            }
        }
        return
    } else if (mode == "text") {
        if (res == 'down') {
            // On nettoie le contexte supérieur
            ctxTop.clearRect(0, 0, canvasTop.width, canvasTop.height)
            // On écrit le texte à l'emplacement prévu
            ctx.font = "17px Arial"
            ctx.fillStyle = "lightblue"
            ctx.fillText(inputText, mouseX, mouseY)
            // Pour un texte, on augmente la taille au maximum
            if (canWidth > maxX) maxX = canWidth
            if (mouseY + 25 > maxY) maxY = mouseY + 25
            if (maxY > canHeight) maxY = canHeight
            // On repasse en mode coloration
            mode = "color"
        } else if (res == 'move') {
            ctxTop.clearRect(0, 0, canvasTop.width, canvasTop.height)
            ctxTop.font = "17px Arial"
            ctxTop.fillStyle = "lightblue"
            ctxTop.fillText(inputText, mouseX, mouseY)
        }
    } else if (mode == "importImage") {
        if (res == 'down') {
            // On nettoie le contexte supérieur
            ctxTop.clearRect(0, 0, canvasTop.width, canvasTop.height)
            // On écrit l'image à l'emplacement de la souris
            ctx.drawImage(importedImage, mouseX - importedImage.width / 2, mouseY - importedImage.height / 2)
            // On informe que les dimensions maximales ont changé
            if (canWidth > maxX) maxX = canWidth
            if (mouseY + importedImage.height/2 > maxY) maxY = mouseY + importedImage.height/2
            if (maxY > canHeight) maxY = canHeight
            // On repasse en mode coloration
            mode = "color"
        } else if (res == 'move') {
            ctxTop.clearRect(0, 0, canvasTop.width, canvasTop.height)
            ctxTop.drawImage(importedImage, mouseX - importedImage.width / 2, mouseY - importedImage.height / 2)
        }
    }
    else {
        if (res == 'down') {
            prevX = currX;
            prevY = currY;
            currX = e.clientX - canvas.offsetLeft;
            currY = e.clientY - canvas.offsetTop;
            flag = true;
            dot_flag = true;
            if (dot_flag) {
                if (mode == "color") {
                    ctx.beginPath();
                    ctx.fillStyle = fillColor;
                    ctx.fillRect(currX, currY, 2, 2);
                    ctx.closePath();
                    dot_flag = false;
                }
            }
        }
        if (res == 'up' || res == "out") {
            flag = false;
            if (res == 'up') { saveCanvas() }
        }
        if (res == 'move') {
            if (flag) {
                prevX = currX;
                prevY = currY;
                currX = e.clientX - canvas.offsetLeft;
                currY = e.clientY - canvas.offsetTop;
                if (currX > maxX) maxX = currX;
                if (currY > maxY) maxY = currY;
                draw();
            }
        }
    }
}

/**
 * Fonction exécutée lors de l'appui d'une touche
 * @param {event} event key down
 */
function bodyKeyDown(event) {
    // Si c'est la touche SHIFT et que le click n'est pas pressé
    // On active le mode segment
    if (event.which == 16 && !clickPressed) {
        mode = "segment"
    }
    // Appui sur R
    if (event.which == 82) {
        if (importedImage) {
            // Rotating image
            importedImage = effecteur.rotateImgBy90(importedImage)
            // Updating top
            ctxTop.clearRect(0, 0, canvasTop.width, canvasTop.height)
            setTimeout(() => ctxTop.drawImage(importedImage, mouseX - importedImage.width / 2, mouseY - importedImage.height / 2), 5)
        }
    }
    // Appui sur T (diminue la taille d'une image)
    if (event.which == 84 || event.which == 109) {
        if (importedImage) {
            // Rotating image
            importedImage = effecteur.resizeImg(importedImage, originalImportedImage, 0.9, 0.9)
            // Updating top
            ctxTop.clearRect(0, 0, canvasTop.width, canvasTop.height)
            setTimeout(() => ctxTop.drawImage(importedImage, mouseX - importedImage.width / 2, mouseY - importedImage.height / 2), 5)
        }
    }
    // Appui sur G (augmente la taille d'une image)
    if (event.which == 71 || event.which == 107) {
        if (importedImage) {
            // Rotating image
            importedImage = effecteur.resizeImg(importedImage, originalImportedImage, 1.1, 1.1)
            // Updating top
            ctxTop.clearRect(0, 0, canvasTop.width, canvasTop.height)
            setTimeout(() => ctxTop.drawImage(importedImage, mouseX - importedImage.width / 2, mouseY - importedImage.height / 2), 5)
        }
    }
}


/**
 * Fonction exécutée lorsque l'on relève une touche
 * @param {event} event key down
 */
function bodyKeyUp(event) {
    // Si c'est la touche shift, on désactive le mode segment (color)
    if (event.which == 16) {
        mode = "color"
        ctxTop.clearRect(0, 0, canvasTop.width, canvasTop.height)
    }
}

/**
 * Créee une ligne d'un point à un autre
 */
function drawLine(context, x1, y1, x2, y2, dash) {
    context.beginPath()
    if (dash) {
        context.setLineDash([3, 3])
        context.strokeStyle = '#FFFFFF';
    } else {
        context.strokeStyle = fillColor
    }
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
    context.lineWidth = 2
    context.stroke()
    // Si on écrivait une ligne pleine (canvas principal), on sauvegarde le canvas.
    if (!dash) { saveCanvas() }
    // On met a jour les limites du dessin
    if (x1 > maxX) maxX = x1;
    if (y1 > maxY) maxY = y1;
    if (x2 > maxX) maxX = x2;
    if (y2 > maxY) maxY = y2;
}

/** 
 * Fonction appelée lors de l'appui sur le bouton "Texte"
*/
function text() {
    prompt({
        title: 'Ajouter du texte',
        label: 'Entrez du texte :',
        value: '',
        inputAttrs: { // attrs to be set if using 'input'
            type: 'text'
        },
    })
        .then((r) => {
            if (r) {
                ctxTop.font = "15px Arial"
                ctxTop.fillStyle = "lightblue"
                ctxTop.fillText(r, 80, 80)
                mode = "text"
                inputText = r
            }
        })
}

function mathFunction() {
    prompt({
        title: 'Générer une courbe',
        label: 'f(x)=',
        value: 'sin(5*x) / (5*x)',
        inputAttrs: { // attrs to be set if using 'input'
            type: 'text'
        },
    })
        .then((expr) => {
            if (expr) {
                prompt({
                    title: 'Générer une courbe',
                    label: 'Facteur d\'échelle (Carreaux/Unité) :',
                    value: '1',
                    inputAttrs: {
                        type: 'text'
                    },
                })
                    .then((agrandissement) => {
                        if (agrandissement) {
                            console.log(agrandissement)
                            generateGraph(-284, expr, agrandissement)
                        }
                    })
            }
        })
}

/**
 * Fonction récursive qui construit un graph selon une expression donnée
 * @param {Number} x Entier de départ du graph, (-284 conseillé)
 * @param {String} expr Une expression mathjs
 * @param {Number} agrandissement Facteur d'agrandissement
 */
function generateGraph(x, expr, agrandissement) {
    if (x < 366) {
        pointFromCenter(x, (56 * agrandissement) * math.eval(expr.replace(/\x/g, "(" + (x / (56 * agrandissement)) + ")")))
        generateGraph(x + 0.25, expr, agrandissement)
    } else {
        // Une fois la génération terminée, on sauvegarde le changement
        saveCanvas()
    }
}

function insertImg() {
    // Prompt une image à l'utilisateur, renvoie un évènement 
    setImportedImage(ipc.sendSync("insertLocalImageDrawer"))
}



// Cet objet contient les anciennes versions du dessin
saveLayerContent = new noxuCanvas.LayerContent(document.getElementById("canlayers"), canWidth, canHeight)
/** 
 * Sauvegarde le canvas dans le saveLayerContent
 * la fonction saveCanvas est appelée à chaque modification du "canvas"
 * afin de sauvegarder son état
 * lorsque l'utilisateur appuie sur restaurer (CTRL+Z) la fonction restoreCanvas
 * est exécutée
*/
function saveCanvas() {
    console.log('sauvegarde')
    // On créee un nouveau layer
    saveLayerContent.addNewLayer()
    // On écrit le canvas actuel dessus
    noxuCanvas.LayerContent.drawCanvas(canvas, saveLayerContent.lastCanvas)
}

function restoreCanvas() {
    // Si un fichier à été importé, on ne peut pas supprimer la première sauvegarde
    if (oldFileName != "" && saveLayerContent.length<2) return
    saveLayerContent.removeLastLayer()
    // On restaure le dernier layer sauvegardé sur le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    noxuCanvas.LayerContent.drawCanvas(saveLayerContent.lastCanvas, canvas)
}

function save() {
    var editedImage = oldFileName && oldFileName.length>0
    var imgFeed, fileName;
    // On créee le répertoire s'il n'existe pas
    mkdirSync(homedir + '/NoxuNote');
    mkdirSync(homedir + '/NoxuNote/created_images/');
    // Si on est en mode édition on garde l'ancien nom de fichier
    if (editedImage) {
        fileName = oldFileName.split("?")[0];
    } else {
        imgFeed = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
        fileName = homedir + '/NoxuNote/created_images/noxu_' + imgFeed + '.png';
    }
    var image = effecteur.cropCanvas(canvas, 0, 0, maxX, maxY).toDataURL()
    var data = image.replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer(data, 'base64');
    try { fs.writeFileSync(fileName, buf); }
    catch (e) { alert('Failed to save the file !' + e); }
    // Si on est en mode édition
    if (editedImage) {
        ipc.send('refreshImg', fileName)
    } else {
        ipc.send('newDessin', fileName);
    }
}

/** Charge une image de données "url" sur le canvas
 * @param url le contenu URL de l'image
 * @param pattern true si la fonction est appelée pour invoquer un pattern, false dans les autres cas
 */
function load(url, pattern) {
    console.log("chargement de l'image : " + url);
    var img = new Image();
    img.src = url;
    if (!pattern) {
        oldFileName = url;
    }
    img.onload = () => {
        // Get resize dimensions to fit a larger image than canvas size
        var targetDimensions = effecteur.fitImgToRect(img, canvas.width, canvas.height)
        // Si l'image est verticalement trop grande
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(img, 0, 0, targetDimensions.targetWidth, targetDimensions.targetHeight)
        // On redéfinit les extremes de l'image pour recadrer correctement à l'exportation
        if (targetDimensions.targetWidth > maxX) maxX = targetDimensions.targetWidth
        if (targetDimensions.targetHeight > maxY) maxY = targetDimensions.targetHeight
        saveCanvas()
    }
}

/** 
 * Nettoie le Canvas
 */
function clearDraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    maxX = 0
    maxY = 0
    saveCanvas()
}

function setImportedImage(path) {
    mode = "importImage"
    importedImage = new Image()
    importedImage.src = path
    originalImportedImage = new Image()
    originalImportedImage.src = path
}

function patternImage(folder, x) {
    setImportedImage("./patterns/"+folder+"/"+x+".png")
}

/** Charge un patern donné
* @param x numero du pattern
*/
function loadPattern(x) {
    switch (x) {
        case 0:
            load("./patterns/quadrillage.png", true)
            break;
        case 1:
            load("./patterns/grapheBasGauche.png", true)
            break;
        case 2:
            load("./patterns/grapheCentre.png", true)
            break;
        case 4:
            load("./patterns/quadrillage2.png", true)
            break;
    }
}


/** Puts a green pixel on canvas from graph origin.
* @param x coordX
* @param y coordY
*/
function pointFromCenter(x, y) {
    var id = ctx.createImageData(1, 1); // only do this once per page

    drawX = x + 284
    drawY = -y + 228
    //ctx.putImageData(id, drawX, drawY);  
    ctx.beginPath();
    ctx.strokeStyle = "green";
    ctx.rect(drawX - 1, drawY - 1, 1.5, 1.5)
    ctx.stroke()

    if (drawY > maxY) maxY = drawY
    if (drawX > maxX) maxX = drawX
}


/** Draws math graph to canvas
 * @param x numero du graphe
 */
function drawFunction(x) {
    if (x == 1) {
        for (var x = -283; x < 366; x++) {
            pointFromCenter(x, 113 * Math.sin((1 / 73) * x));
        }
    } else if (x == 2) {
        for (var x = -283; x < 366; x++) {
            pointFromCenter(x, 113 * Math.cos((1 / 73) * x));
        }
    } else if (x == 3) {
        for (var x = -283; x < 366; x++) {
            pointFromCenter(x, 100 * (1 / 5600) * x * x);
        }
    }
    saveCanvas()
}

initDrawer()

// linking ipcRenderer events to local functions calls.
ipcRenderer.on('loadImage', (event, content) => load(content, false))
ipcRenderer.on('setEditState', (event, line) => { edit = line })
ipcRenderer.on('undo', (event) => restoreCanvas())

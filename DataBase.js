const homedir = require('os').homedir()
const fs = require('fs')

const mkdirSync = function (dirPath) {
    try {
        fs.mkdirSync(dirPath)
    } catch (err) {
        if (err.code !== 'EEXIST') throw err
    }
}

/***************************************************************************************************
 *                                          AppSettings                                            * 
 ***************************************************************************************************/
class AppSettings {
    constructor() {
        this.path = homedir + "/NoxuNote/settings.json"
        this.createFile()
        this.loadJson()
    }
    /**
     * Créee le fichier stoquant les données s'il n'existe pas
     */
    createFile() {
        var djson = [
            {
                key: "enableDragNDrop",
                value: false
            },
            {
                key: "enableDevMode",
                value: false
            }
        ]
        if (!fs.existsSync(this.path)) {
            fs.writeFileSync(this.path, JSON.stringify(djson), 'utf8')
        }
    }
    /**
     * Lit le fichier et stoque les données dans l'objet
     */
    loadJson() {
        this.rawJson = JSON.parse(fs.readFileSync(this.path))
    }
    /**
     * Ecrit les données de l'objet dans le fichier
     */
    saveJson() {
        fs.writeFileSync(this.path, JSON.stringify(this.rawJson), 'utf8')
    }
    setValue(key, value) {
        this.assocList.find(assoc=>assoc.keyVal==key).value = value
        this.saveJson()
    }
    get assocList() { 
        return this.rawJson
    }
}

/***************************************************************************************************
 *                                       TABLE DES MATIÈRES                                        *
 ***************************************************************************************************/
/**
 * Cette classe permet d'accéder, de modifier, de lire et de sauvegarder la liste
 * des matières de l'utilisateur.
 * Après une modification ne pas oublier d'exécuter la méthode saveJson().
 */
class Matieres {
    constructor() {
        this.path = homedir + "/NoxuNote/user_matieres.json"
        this.createFile()
        this.loadJson()
    }
    /**
     * Créee le fichier stoquant les données s'il n'existe pas
     */
    createFile() {
        var djson = { "matieres": [{ "nom": "Ma catégorie", "couleur": "#FC8F73" }] }
        if (!fs.existsSync(this.path)) {
            fs.writeFileSync(this.path, JSON.stringify(djson), 'utf8')
        }
    }
    /**
     * Lit le fichier et stoque les données dans l'objet
     */
    loadJson() {
        this.rawJson = JSON.parse(fs.readFileSync(this.path))
    }
    /**
     * Ecrit les données de l'objet dans le fichier
     */
    saveJson() {
        fs.writeFileSync(this.path, JSON.stringify(this.rawJson), 'utf8')
    }
    /**
     * Ajoute une matière à la liste
     * @param {any} name Le nom de la matiere
     * @param {string} colorcode La couleur de la matière
     */
    addMat(name, colorcode) {
        this.matList.push({ "nom": name, "couleur": colorcode })
        return this.matList
    }
    /**
     * Retourne l'index de la matière
     * @param {any} name Le nom de la matiere
     */
    findIndexMat(name) {
        var val = this.matList.find((element) => { return element['nom'] == name })
        return this.matList.indexOf(val)
    }
    /**
     * Supprime une matière
     * @param {any} name Le nom de la matiere
     */
    removeMat(name) {
        this.matList.splice(this.findIndexMat(name), 1);
        return this.matList
    }
    /**
     * Retourne true si le matière existe déjà
     * @param {any} name Nom de la matière
     */
    isMatInList(name) {
        return this.matList.find((element) => { return element['nom'] == name }) !== undefined
    }
    /**
     * Modifie une propriété d'une matière
     * @param {string} property La valeur a modifier
     * @param {any} value Nouvelle valeur
     * @param {any} name Nom de la matiere
     */
    setProperty(property, value, name) {
        var key = this.findIndexMat(name)
        this.matList[key][property] = value
        return this.matList
    }
    /**
     * Renvoie la couleur d'une matière
     */
    getColor(name) {
        var c = this.matList.find((element) => { return element['nom'] == name })
        if (c) return c.couleur
        else return 'white'
    }
    /**
     * Accesseur - Renvoie la référence de l'objet JSON de la liste des matières.
     */
    get matList() {
        return this.rawJson.matieres
    }
}

/***************************************************************************************************
 *                                         TABLE DES NOTES                                         *
 ***************************************************************************************************/
/**
 * CONVENTIONS :
 * - Une note qui n'est pas enregistrée sera renvoyée comme un objet rempli de "undefined"
 * - Une note dont la matière n'a pas été définie (non triée) mais qui est enregistrée renvoie un objet
 *   dont la matière est ""
 */
class Notes {
    constructor() {
        this.path = homedir + "/NoxuNote/user_notes.json"
        this.createFile()
        this.loadJson()
    }
    dotTxt(name) {
        if (/.txt$/g.exec(name)) return name
        return name + '.txt'
    }
    /**
     * Créee le fichier stoquant les données s'il n'existe pas
     */
    createFile() {
        var djson = JSON.parse('[]')
        if (!fs.existsSync(this.path)) {
            fs.writeFileSync(this.path, JSON.stringify(djson), 'utf8')
        }
    }
    /**
     * Lit le fichier et stoque les données dans l'objet
     */
    loadJson() {
        this.rawJson = JSON.parse(fs.readFileSync(this.path))
    }
    /**
     * Ecrit les données de l'objet dans le fichier
     */
    saveJson() {
        fs.writeFileSync(this.path, JSON.stringify(this.rawJson), 'utf8')
    }
    /**
     * Ajoute une matière à la liste
     * @param {any} name Le nom de la matiere
     * @param {string} colorcode La couleur de la matière
     */
    addNote(file, matiere) {
        this.notesList.push({ "filename": this.dotTxt(file), "matiere": matiere, "lastedit": "", "isfavorite": false })
        return this.notesList
    }
    /**
     * Retourne l'index de la matière
     * @param {any} name Le nom de la matiere
     */
    findIndexNote(name) {
        // .find() anciennement
        var val = this.notesList.findIndex((element) => { return element['filename'] == this.dotTxt(name) })
        //return this.notesList.indexOf(val)
    }
    /**
     * Modifie une propriété d'une note
     * @param {string} property La valeur a modifier
     * @param {any} value Nouvelle valeur
     * @param {any} name Nom de la note
     */
    setProperty(property, value, name) {
        if (value == "") value = undefined
        var item = this.getDetails(this.dotTxt(name))
        if (item.filename != undefined) item[property] = value
        else {
            this.addNote(this.dotTxt(name), '')
            this.setProperty(property, value, name)
        }
        return this.notesList
    }
    deleteNote(name) {
        delete this.getDetails(name)
        fs.unlinkSync(homedir + '/NoxuNote/notes/' + this.dotTxt(name))
        return this.notesList
    }
    getDetails(name) {
        let query = this.notesList.find(e => e['filename'] == this.dotTxt(name))
        if (query) return query
        else return { "filename": undefined, "matiere": undefined, "lastedit": undefined, "isfavorite": undefined }
    }
    get notesList() {
        return this.rawJson
    }
}

/***************************************************************************************************
 *                                       PRESETS DE COULEURS                                       *
 ***************************************************************************************************/
class Colors {
    constructor() {
        this.path = homedir + "/NoxuNote/colors.json"
        this.createFile()
        this.loadJson()
    }
    /**
     * Créee le fichier stoquant les données s'il n'existe pas
     */
    createFile() {
        var djson = [
            "#ed8484", "#f7ded4", "#eda884", "#edc884", "#ede984",
            "#d1ed84", "#a1ed84", "#84edd4", "#75d5dd", "#84aaed",
            "#9a84ed", "#cb84ed", "#ed84e2", "#ed8493", "#adadad"
        ]
        if (!fs.existsSync(this.path)) {
            fs.writeFileSync(this.path, JSON.stringify(djson), 'utf8')
        }
    }
    /**
     * Lit le fichier et stoque les données dans l'objet
     */
    loadJson() {
        this.rawJson = JSON.parse(fs.readFileSync(this.path))
    }
    /**
     * Ecrit les données de l'objet dans le fichier
     */
    saveJson() {
        fs.writeFileSync(this.path, JSON.stringify(this.rawJson), 'utf8')
    }
    get colorsList() {
        return this.rawJson
    }
}

/***************************************************************************************************
 *                                          DACTYLOGRAPHIE                                         *
 ***************************************************************************************************/
class Dactylo {
    constructor() {
        this.path = homedir + "/NoxuNote/dactylo.json"
        this.createFile()
        this.loadJson()
    }
    /**
     * Créee le fichier stoquant les données s'il n'existe pas
     */
    createFile() {
        var djson = [
            {
                input: "pos",
                output: "position"
            },
            {
                input: "cat",
                output: "catégorie"
            },
            {
                input: "alpha",
                output: "α"
            }
        ]
        if (!fs.existsSync(this.path)) {
            fs.writeFileSync(this.path, JSON.stringify(djson), 'utf8')
        }
    }
    /**
     * Lit le fichier et stoque les données dans l'objet
     */
    loadJson() {
        this.rawJson = JSON.parse(fs.readFileSync(this.path))
    }
    /**
     * Ecrit les données de l'objet dans le fichier
     */
    saveJson() {
        fs.writeFileSync(this.path, JSON.stringify(this.rawJson), 'utf8')
    }
    /**
     * Ajoute une association dans la table dactylo
     * @param {string} input Le mot raccourci
     * @param {string} output Le mot normal
     */
    addAssoc(input, output) {
        this.assocList.push({'input': input, 'output': output})
        return this.assocList
    }
    /**
     * Supprime une entrée dans la table
     * @param {string} input Le mot raccourci à supprimer
     */
    removeAssoc(input) {
        this.assocList.splice(this.findIndexAssoc(input), 1);
        return this.assocList
    }
    findIndexAssoc(input) {
        return this.assocList.findIndex(e => e['input'] == input)
    }
    get assocList() { 
        return this.rawJson
    }
}

/***************************************************************************************************
 *                               BASE DE DONNÉE, CONTIENT DES TABLES                               *
 ***************************************************************************************************/
class DataBase {
    constructor() {
        this.createNoxuNoteFolder()
        this.notesFolder = homedir + '/NoxuNote/notes/'
        this.matieres = new Matieres()
        this.colors = new Colors()
        this.notes = new Notes()
        this.dactylo = new Dactylo()
    }
    /**
     * Creates the main NoxuNote folder if not exists
     */
    createNoxuNoteFolder() {
        if (!fs.existsSync(homedir+'/NoxuNote/')) {
            mkdirSync(homedir+'/NoxuNote/')
            mkdirSync(homedir+'/NoxuNote/notes')
            mkdirSync(homedir+'/NoxuNote/created_images')
        }
    }
    /**
     * Écrit chaque base de donnée sur le disque.
     */
    saveAllJson() {
        this.matieres.saveJson()
        this.colors.saveJson()
        this.notes.saveJson()
        this.dactylo.saveJson()
    }
    /**
     * Renvoie une liste d'objets contenant chacun les informations d'une note enregistrée.
     */
    getFileList() {
        var json = []
        // On récupère la liste des fichiers
        var files = fs.readdirSync(this.notesFolder)
        // Pour chaque fichier trouvé
        for (var i = 0; i < files.length; i++) {
            // S'il ne commence pas par un point
            if (files[i].substring(0, 1) != ".") {
                // Récupération des données associées à chaque fichier
                var details = this.notes.getDetails(files[i])
                if (details) {
                    json.push({
                        "nom": files[i].replace(/\.txt/g, ''),
                        "matiere": details.matiere,
                        "lastedit": details.lastedit,
                        "isfavorite": details.isfavorite,
                        "color": this.matieres.getColor(details.matiere)
                    })
                    // Si aucune donnée n'est trouvée, on ne renseigne pas l'objet json
                } else {
                    json.push({
                        "nom": files[i].replace(/\.txt/g, ''),
                        "matiere": null,
                        "lastedit": null,
                        "isfavorite": null,
                        "color": null
                    })
                }
            }
        }
        // On renvoie l'objet final
        return json
    }
}

module.exports.DataBase = DataBase
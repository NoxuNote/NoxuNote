const fs = require('fs-extra');
const homedir = require('os').homedir();
/***************************************************************************************************
 *                                       TABLE DES MATIÈRES                                        *
 ***************************************************************************************************/
/**
 * Permet d'accéder, de modifier, de lire et de sauvegarder la liste
 * des matières de l'utilisateur.
 * Après une modification ne pas oublier d'exécuter la méthode saveJson().
 */
class Matieres {
    constructor() {
        this.path = homedir + "/NoxuNote/user_matieres.json";
        this.createFileDB();
        this.loadJson();
    }
    /**
     * Créee le fichier stoquant les données s'il n'existe pas
     */
    createFileDB() {
        const djson = { "matieres": [{ "nom": "Ma catégorie", "couleur": "#FC8F73" }] };
        if (!fs.existsSync(this.path))
            fs.writeJSONSync(this.path, djson);
    }
    /**
     * Lit le fichier et stoque les données dans l'objet
     */
    loadJson() {
        this.rawJson = fs.readJSONSync(this.path);
    }
    /**
     * Ecrit les données de l'objet dans le fichier
     */
    saveJson() {
        fs.writeJSONSync(this.path, this.rawJson);
    }
    /**
     * Ajoute une matière à la liste
     * @param {any} name Le nom de la matiere
     * @param {string} colorcode La couleur de la matière
     */
    addMat(name, colorcode) {
        this.matList.push({ "nom": name, "couleur": colorcode });
        return this.matList;
    }
    /**
     * Retourne l'index de la matière
     * @param {any} name Le nom de la matiere
     */
    findIndexMat(name) {
        var val = this.matList.find((element) => { return element['nom'] == name; });
        return this.matList.indexOf(val);
    }
    /**
     * Supprime une matière
     * @param {any} name Le nom de la matiere
     */
    removeMat(name) {
        this.matList.splice(this.findIndexMat(name), 1);
        return this.matList;
    }
    /**
     * Retourne true si le matière existe déjà
     * @param {any} name Nom de la matière
     */
    isMatInList(name) {
        return this.matList.find((element) => { return element['nom'] == name; }) !== undefined;
    }
    /**
     * Modifie une propriété d'une matière
     * @param {string} property La valeur a modifier
     * @param {any} value Nouvelle valeur
     * @param {any} name Nom de la matiere
     */
    setProperty(property, value, name) {
        var key = this.findIndexMat(name);
        this.matList[key][property] = value;
        return this.matList;
    }
    /**
     * Renvoie la couleur d'une matière
     */
    getColor(name) {
        var c = this.matList.find((element) => { return element['nom'] == name; });
        if (c)
            return c.couleur;
        else
            return 'white';
    }
    /**
     * Accesseur - Renvoie la référence de l'objet JSON de la liste des matières.
     */
    get matList() {
        return this.rawJson.matieres;
    }
}
exports.Matieres = Matieres;

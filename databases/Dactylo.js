const fs = require('fs-extra');
const homedir = require('os').homedir();
/***************************************************************************************************
 *                                          DACTYLOGRAPHIE                                         *
 ***************************************************************************************************/
class Dactylo {
    constructor() {
        this.path = homedir + "/NoxuNote/dactylo.json";
        this.createFileDB();
        this.loadJson();
    }
    /**
     * Créee le fichier stoquant les données s'il n'existe pas
     */
    createFileDB() {
        const djson = [
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
        ];
        if (!fs.existsSync(this.path)) {
            fs.writeJSONSync(this.path, djson);
        }
    }
    /**
     * Lit le fichier et stoque les données dans l'objet
     */
    loadJson() {
        this.rawJson = JSON.parse(fs.readFileSync(this.path));
    }
    /**
     * Ecrit les données de l'objet dans le fichier
     */
    saveJson() {
        fs.writeJSONSync(this.path, this.rawJson);
    }
    /**
     * Ajoute une association dans la table dactylo
     * @param {string} input Le mot raccourci
     * @param {string} output Le mot normal
     */
    addAssoc(input, output) {
        this.assocList.push({ 'input': input, 'output': output });
        return this.assocList;
    }
    /**
     * Supprime une entrée dans la table
     * @param {string} input Le mot raccourci à supprimer
     */
    removeAssoc(input) {
        this.assocList.splice(this.findIndexAssoc(input), 1);
        return this.assocList;
    }
    findIndexAssoc(input) {
        return this.assocList.findIndex(e => e['input'] == input);
    }
    get assocList() {
        return this.rawJson;
    }
}
exports.Dactylo = Dactylo;

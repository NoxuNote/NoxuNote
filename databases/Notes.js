const fs = require('fs-extra');
const homedir = require('os').homedir();
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
        this.path = homedir + "/NoxuNote/user_notes.json";
        this.createFileDB();
        this.loadJson();
    }
    dotTxt(name) {
        if (/.txt$/g.exec(name))
            return name;
        return name + '.txt';
    }
    /**
     * Créee le fichier stoquant les données s'il n'existe pas
     */
    createFileDB() {
        /**
         * Structure des données de la DB :
            [
                {
                    "id": 4675133
                    "filename": "Note 20h41 le 4 juin 2019.txt",
                    "matiereId": "6540321",
                    "lastedit": "20h41 le 4 juin 2019",
                    "isfavorite": false
                },
                ...
            ]
         */
        const djson = JSON.parse('[]');
        if (!fs.existsSync(this.path)) {
            fs.writeJSONSync(this.path, djson);
        }
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
    addNote(file, matiere) {
        this.notesList.push({ "filename": this.dotTxt(file), "matiere": matiere, "lastedit": "", "isfavorite": false });
        return this.notesList;
    }
    /**
     * Retourne l'index de la matière
     * @param {any} name Le nom de la matiere
     */
    findIndexNote(name) {
        // .find() anciennement
        var val = this.notesList.findIndex((element) => { return element['filename'] == this.dotTxt(name); });
        //return this.notesList.indexOf(val)
    }
    /**
     * Modifie une propriété d'une note
     * @param {string} property La valeur a modifier
     * @param {any} value Nouvelle valeur
     * @param {any} name Nom de la note
     */
    setProperty(property, value, name) {
        if (value == "")
            value = undefined;
        var item = this.getNoteMetadata(this.dotTxt(name));
        if (item.filename != undefined)
            item[property] = value;
        else {
            this.addNote(this.dotTxt(name), '');
            this.setProperty(property, value, name);
        }
        return this.notesList;
    }
    deleteNote(name) {
        delete this.getNoteMetadata(name);
        fs.unlinkSync(homedir + '/NoxuNote/notes/' + this.dotTxt(name));
        return this.notesList;
    }
    getNoteMetadata(name) {
        let query = this.notesList.find(e => e['filename'] == this.dotTxt(name));
        if (query)
            return query;
        else
            return { "filename": undefined, "matiere": undefined, "lastedit": undefined, "isfavorite": undefined };
    }
    get notesList() {
        return this.rawJson;
    }
}
exports.Notes = Notes;

const fs = require('fs-extra');
const homedir = require('os').homedir();
import { JSONDataBase } from '../types'
/***************************************************************************************************
 *                                         TABLE DES NOTES                                         *
 ***************************************************************************************************/
/**
 * CONVENTIONS :
 * - Une note qui n'est pas enregistrée sera renvoyée comme un objet rempli de "undefined"
 * - Une note dont la matière n'a pas été définie (non triée) mais qui est enregistrée renvoie un objet
 *   dont la matière est ""
 */
export class Notes extends JSONDataBase {
   constructor() {
       let path: string = homedir + "/NoxuNote/user_notes.json"
       let defaultJson: Object = []
       super(path, defaultJson)
   }

    /**
     * Ajoute .txt a  un nom de note
     * @param name Nom de la note
     */
    dotTxt(name: string) {
        if (/.txt$/g.exec(name))
            return name;
        return name + '.txt';
    }
    /**
     * Ajoute une matière à la liste
     * @param {any} name Le nom de la matiere
     * @param {string} colorcode La couleur de la matière
     */
    addNote(file: string, matiere: string) {
        this.rawJson.push({ "filename": this.dotTxt(file), "matiere": matiere, "lastedit": "", "isfavorite": false });
        return this.rawJson;
    }
    /**
     * Retourne l'index de la matière
     * @param {any} name Le nom de la matiere
     */
    findIndexNote(name: string) {
        return this.rawJson.findIndex((element: any) => element['filename'] == this.dotTxt(name));
    }
    /**
     * Modifie une propriété d'une note
     * @param {string} property La valeur a modifier
     * @param {any} value Nouvelle valeur
     * @param {any} name Nom de la note
     */
    setProperty(property: string | number, value: string, name: any) {
        if (value == "")
            value = undefined;
        var item = this.getNoteMetadata(this.dotTxt(name));
        if (item.filename != undefined)
            item[property] = value;
        else {
            this.addNote(this.dotTxt(name), '');
            this.setProperty(property, value, name);
        }
        return this.rawJson;
    }
    deleteNote(name: string) {
        delete this.rawJson[this.findIndexNote(name)];
        fs.unlinkSync(homedir + '/NoxuNote/notes/' + this.dotTxt(name));
        return this.rawJson;
    }
    getNoteMetadata(name: any) {
        let query = this.rawJson.find((e: { [x: string]: any; }) => e['filename'] == this.dotTxt(name));
        if (query)
            return query;
        else
            return { "filename": undefined, "matiere": undefined, "lastedit": undefined, "isfavorite": undefined };
    }
}
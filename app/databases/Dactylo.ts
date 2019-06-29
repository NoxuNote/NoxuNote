const fs = require('fs-extra');
const homedir = require('os').homedir();
import { JSONDataBase } from '../types'
/***************************************************************************************************
 *                                          DACTYLOGRAPHIE                                         *
 ***************************************************************************************************/
export class Dactylo extends JSONDataBase {
    constructor() {
        let path: string = homedir + "/NoxuNote/dactylo.json";
        let defaultJson: Object = [
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
        super(path, defaultJson)
    }
    /**
     * Ajoute une association dans la table dactylo
     * @param {string} input Le mot raccourci
     * @param {string} output Le mot normal
     */
    addAssoc(input: any, output: any) {
        this.rawJson.push({ 'input': input, 'output': output });
        return this.rawJson;
    }
    /**
     * Supprime une entrée dans la table
     * @param {string} input Le mot raccourci à supprimer
     */
    removeAssoc(input: any) {
        this.rawJson.splice(this.findIndexAssoc(input), 1);
        return this.rawJson;
    }
    findIndexAssoc(input: any) {
        return this.rawJson.findIndex((e: { [x: string]: any; }) => e['input'] == input);
    }
}
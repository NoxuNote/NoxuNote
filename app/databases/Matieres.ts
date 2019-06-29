import { JSONDataBase } from "../types";

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
export class Matieres extends JSONDataBase {
    constructor() { 
        let path: string = homedir + "/NoxuNote/user_matieres.json"
        let defaultJson: Object = { "matieres": [{ "nom": "Ma catégorie", "couleur": "#FC8F73" }] }
        super(path, defaultJson)
    }
    /**
     * Ajoute une matière à la liste
     * @param {any} name Le nom de la matiere
     * @param {string} colorcode La couleur de la matière
     */
    addMat(name: any, colorcode: any) {
        this.matList.push({ "nom": name, "couleur": colorcode });
        return this.matList;
    }
    /**
     * Retourne l'index de la matière
     * @param {any} name Le nom de la matiere
     */
    findIndexMat(name: any) {
        var val = this.matList.find((element: { [x: string]: any; }) => { return element['nom'] == name; });
        return this.matList.indexOf(val);
    }
    /**
     * Supprime une matière
     * @param {any} name Le nom de la matiere
     */
    removeMat(name: any) {
        this.matList.splice(this.findIndexMat(name), 1);
        return this.matList;
    }
    /**
     * Retourne true si le matière existe déjà
     * @param {any} name Nom de la matière
     */
    isMatInList(name: any) {
        return this.matList.find((element: { [x: string]: any; }) => { return element['nom'] == name; }) !== undefined;
    }
    /**
     * Modifie une propriété d'une matière
     * @param {string} property La valeur a modifier
     * @param {any} value Nouvelle valeur
     * @param {any} name Nom de la matiere
     */
    setProperty(property: string | number, value: any, name: any) {
        var key = this.findIndexMat(name);
        this.matList[key][property] = value;
        return this.matList;
    }
    /**
     * Renvoie la couleur d'une matière
     */
    getColor(name: any) {
        var c = this.matList.find((element: { [x: string]: any; }) => { return element['nom'] == name; });
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

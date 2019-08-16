import { JSONDataBase, Matiere } from "../types";

import fs = require('fs-extra');
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

    private parsedJson: Matiere[];

    constructor() { 
        let path: string = homedir + "/NoxuNote/user_matieres.json"
        let defaultJson: Object = { "matieres": [{ "nom": "Ma catégorie", "couleur": "#FC8F73" }] }
        super(path, defaultJson)
    }

    public saveJson(): void { // Override default method
        this.rawJson = this.parsedJson
        fs.writeJSONSync(this.path, this.rawJson);
    }
    public loadJson(): void { // Override default method
        this.rawJson = fs.readJSONSync(this.path);
        // Si l'ancien format est détecté, on convertit
        if (!Array.isArray(this.rawJson)) {
            try {
                this.rawJson = this.rawJson["matieres"]
                this.rawJson.forEach((mat:any)=>{
                    mat.name = mat.nom
                    mat.color = mat.couleur
                })
            }
            catch(e) {
                console.error("(ERREUR) user_matieres.json Ancien format impossible à parser : ", e)
            }
        }
        // Fin conversion
        this.parsedJson = []
        this.rawJson.forEach( (element: any) => {
            // Vérification que l'element est complet
            if (!element.name || !element.color) {
                console.error("(ERREUR) Dans user_matieres.json, objet incorrect " + element.toString())
                return
            }
            // Id de l'element
            let id: string;
            if (element.id) id = element.id // Si id déjà défini on le laisse
            else id = Matieres.generateId()    // Sinon on en génère un nouveau
            // Création Matiere
            let mat: Matiere = {
                id: id,
                name: element.name,
                color: element.color
            }
            this.parsedJson.push(mat)
        })
        this.saveJson()
    }

    public static generateId(): string {
        return Math.floor(Math.random() * Math.floor(99999999)).toString()
    }

    //
    // ─── MAT CREATORS ───────────────────────────────────────────────────────────────
    //

    /**
     * Ajoute une matière à la liste
     * @param {string} name Le nom de la matiere
     * @param {string} colorcode La couleur de la matière
     */
    addMat(name: string, colorcode: string): Matiere[] {
        this.parsedJson.push({
            id: Matieres.generateId(),
            name: name, 
            color: colorcode
        });
        return this.parsedJson;
    }
    //
    // ─── MAT GETTERS ────────────────────────────────────────────────────────────────
    //
    
    getMatList(): Matiere[] {
        return this.parsedJson
    }    

    //
    // ─── MAT EDITORS ────────────────────────────────────────────────────────────────
    //

    /**
     * Supprime une matière
     * @param {any} id Le nom de la matiere
     */
    removeMat(id: string): Matiere[] {
        let index: number = this.parsedJson.findIndex((m:Matiere)=>m.id===id)
        this.parsedJson.splice(index, 1);
        return this.parsedJson;
    }
    /**
     * Modifie une propriété d'une matière
     * ATTENTION : La matière déjà avoir été crée
     * @param {string} property La valeur a modifier
     * @param {any} value Nouvelle valeur
     * @param {any} name Nom de la matiere
     */
    public setProperty(property: string, value: (string|number|boolean), id: string): Matiere {
        // check
        if (!["id", "name", "color"].includes(property)) {
            throw Error(`La propriete ${property} n'appartient pas au type Matiere`)
        }
        // edit metadata property
        let mat: Matiere = this.parsedJson.find((m:Matiere)=>m.id===id)
        Object.defineProperty(mat, property, {value: value, writable: true, configurable: true})
        return mat
    }
}
exports.Matieres = Matieres;

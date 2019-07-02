import { JSONDataBase } from "./types";
import { Notes } from "./databases/Notes";
import { Matieres } from "./databases/Matieres";
import { Dactylo } from "./databases/Dactylo"

const { Colors } = require("./databases/Colors");
const fs = require('fs-extra')
const homedir		= require('os').homedir()
// const mkdirSync = function (dirPath: string) {
//     try {
//         fs.mkdirSync(dirPath)
//     } catch (err) {
//         if (err.code !== 'EEXIST') throw err
//     }
// }

/***************************************************************************************************
 *                               BASE DE DONNÉE, CONTIENT DES TABLES                               *
 ***************************************************************************************************/
export class DataBase {
    
    public notesFolder: string;
    public matieres: Matieres;
    public colors: JSONDataBase;
    public notes: Notes;
    public dactylo: Dactylo;

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
            fs.mkdirSync(homedir+'/NoxuNote/')
            fs.mkdirSync(homedir+'/NoxuNote/notes')
            fs.mkdirSync(homedir+'/NoxuNote/created_images')
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
                var details = this.notes.getNoteMetadata(files[i])
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
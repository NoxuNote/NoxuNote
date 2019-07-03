import fs = require('fs-extra');
const homedir = require('os').homedir();
import { JSONDataBase, Note, NoteMetadata } from '../types'
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

    public static notesPath: string = homedir + '/NoxuNote/notes/'
    
    private parsedJson: NoteMetadata[];

    constructor() {
        let path: string = homedir + "/NoxuNote/user_notes.json"
        let defaultJson: Object = []
        super(path, defaultJson)
    }

    public saveJson(): void { // Override default method
        this.rawJson = this.parsedJson
        fs.writeJSONSync(this.path, this.rawJson);
    }
    public loadJson(): void { // Override default method
        this.rawJson = fs.readJSONSync(this.path);
        // reset parsedJson
        this.parsedJson = []
        this.rawJson.array.forEach((element: any) => {
            // Vérification que l'element est complet
            if (element.filename && element.lastedit && element.isfavorite!=undefined) {
                console.error("(ERREUR) Dans user_notes.json, objet incorrect ", element.toString())
                return
            }
            /**
             * Contenu dans la beta : filename, lastedit, isfavorite
             */

            // Id de l'element
            let id: string;
            if (element.id) id = element.id // Si id déjà défini on le laisse
            else id = Notes.generateId()    // Sinon on en génère un nouveau
            
            // Parse rawjson to Note
            let meta: NoteMetadata = {
                id: id,
                filename: element.filename,
                lastedit: element.lastedit,
                isfavorite: element.isfavorite
            }
            // Ajout de la matiere si présente
            if (element.matiere) meta.matiere = element.matiere
            this.parsedJson.push(meta)
        });
        // Save parsedJson
        this.saveJson()
    }
    public static generateId(): string {
        return Math.floor(Math.random() * Math.floor(99999999)).toString()
    }
    public static getDate(): string {
        const options = { weekday: 'long', month: 'long', day: 'numeric', hour:'numeric', minute:'numeric' };
        const date = (new Date()).toLocaleDateString('fr-FR', options)
        return date
    }

    /**
     * Ajoute .txt a  un nom de note
     * @param name Nom de la note
     */
    public static dotTxt(name: string): string {
        if (/.txt$/g.exec(name))
            return name;
        return name + '.txt';
    }

    // /**
    //  * Ajoute une matière à la liste
    //  * @param {any} name Le nom de la matiere
    //  * @param {string} colorcode La couleur de la matière
    //  */
    // addNote(file: string, matiere: string) {
    //     this.rawJson.push({
    //         filename: Notes.dotTxt(file), 
    //         matiere: matiere, 
    //         lastedit: "", 
    //         isfavorite: false 
    //     });
    //     return this.rawJson;
    // }

    /**
     * Retourne l'index de la note
     * @param {any} name L'id de la note
     */
    private findIndexNote(id: string) {
        return this.parsedJson.findIndex((element: NoteMetadata) => element.id == id);
    }

    
    
    // deleteNote(id: string): NoteMetadata[] {
    //     delete this.parsedJson[this.findIndexNote(id)];
    //     fs.unlinkSync(homedir + '/NoxuNote/notes/' + Notes.dotTxt(name));
    //     this.saveJson()
    //     return this.parsedJson;
    // }


    //
    // ─── NOTE CREATORS ──────────────────────────────────────────────────────────────
    //

    /**
     * Crée une nouvelle note en ayant au moins un **titre** et le **contenu**.
     * @param title Titre de la note
     * @param content Contenu de la note
     * @param matiere (Optionnel) Matière de la note
     * @param isfavorite (Optionnel) Note favorite
     */
    public saveNewNote(title: string, content: string, matiere?: number, isfavorite?: boolean): Note {
        const generatedId: string = Notes.generateId()
        let metadata: NoteMetadata = {
            id: generatedId,
            filename: Notes.dotTxt(generatedId),
            lastedit: Notes.getDate(),
            isfavorite: isfavorite!=undefined ? isfavorite : false
        }
        if (matiere) metadata.matiere = matiere
        let newNote: Note = {
            meta: metadata,
            content: content
        }
        this.saveNote(newNote)
        return newNote
    }


    //
    // ─── NOTE GETTERS ───────────────────────────────────────────────────────────────
    //
    public getNoteList(): NoteMetadata[] {
        return this.parsedJson
    }
    public getNote(noteId: string): Note {
        let meta:NoteMetadata = this.parsedJson.find( (data: NoteMetadata) => data.id === noteId)
        let content:string = fs.readFileSync(Notes.notesPath + meta.filename).toString()
        return {
            meta: meta,
            content: content
        }
    }
    private getFiles(): string[] {
        return fs.readdirSync(Notes.notesPath)
    }
    private getMetadataFromId(id: string): NoteMetadata {
        return this.parsedJson.find( (data: NoteMetadata) => data.id === id)
    }

    //
    // ─── NOTE EDITORS ───────────────────────────────────────────────────────────────
    //

    /**
     * Sauvegarde/Met à jour une note
     * @param note La note à enregistrer
     */
    public saveNote(note: Note): void {
        /**
         * Écriture des metadata
         */
        let index: number = this.parsedJson.findIndex( (meta:NoteMetadata) => meta.id === note.meta.id )
        if (index == -1) 
            this.parsedJson[index] = note.meta // La note éxiste déjà dans user_notes.json, On met à jour les données
        else
            this.parsedJson.push(note.meta) // La note n'éxiste pas dans user_notes.json, On la crée
        this.saveJson() // On met à jour les données dans user_notes.json
        /**
         * Écriture du contenu de la note
         */
        fs.writeFileSync(note.meta.filename, note.content)
    }

    /**
     * Modifie une propriété d'une note
     * ATTENTION : La note déjà avoir été crée
     * @param {string} property La valeur a modifier
     * @param {any} value Nouvelle valeur
     * @param {any} name Nom de la note
     */
    public setProperty(property: string, value: (string|number|boolean), id: string): NoteMetadata {
        // check
        if (!["id", "filename", "lastedit", "isfavorite", "matiere"].includes(property)) {
            throw Error(`La propriete ${property} n'appartient pas au type NoteMetadata`)
            return null
        }
        // edit metadata property
        let meta: NoteMetadata = this.getMetadataFromId(id)
        Object.defineProperty(meta, property, value)
        return meta
    }

    public deleteNote(id: string): NoteMetadata[] {
        delete this.parsedJson[this.findIndexNote(id)];
        fs.unlinkSync(Notes.notesPath + Notes.dotTxt(name));
        this.saveJson()
        return this.parsedJson;
    }
}
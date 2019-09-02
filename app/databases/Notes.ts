import fs = require('fs-extra');
const homedir = require('os').homedir();
import { JSONDataBase, Note, NoteMetadata, INoxunoteApp } from '../types'
import * as AdmZip from "adm-zip"
const openExplorer = require('open-file-explorer');

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

    private app: INoxunoteApp;

    constructor(app: INoxunoteApp) {
        let path: string = homedir + "/NoxuNote/user_notes.json"
        let defaultJson: Object = []
        super(path, defaultJson)
        this.app = app
    }

    public saveJson(): void { // Override default method
        this.rawJson = this.parsedJson
        fs.writeJSONSync(this.path, this.rawJson);
    }
    public loadJson(): void { // Override default method
        this.rawJson = fs.readJSONSync(this.path);
        // reset parsedJson
        this.parsedJson = []
        let files: String[] = this.getFiles()
        this.rawJson.forEach((element: any) => {
            // Vérification que l'element est complet
            if (!element || !element.filename || !element.lastedit || element.isfavorite==undefined) {
                console.error("(ERREUR) Dans user_notes.json, objet incorrect ", element.toString())
                return
            }
            // Vérification que le fichier existe
            if (!files.includes(element.filename)) {
                console.warn("(WARNING) Fichier user_notes.json non présent dans le système de fichiers")
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
                title: element.title ? Notes.unDotTxt(element.title) : Notes.unDotTxt(element.filename),
                filename: element.filename,
                lastedit: element.lastedit,
                isfavorite: element.isfavorite,
                matiere: element.matiere ? element.matiere : ''
            }
            this.parsedJson.push(meta)
        });
        // Link files without metadata
        files.forEach((f:string) => {
            let parsedJsonSearch = this.parsedJson.filter( (m:NoteMetadata) => m.filename == f )
            if (parsedJsonSearch.length === 0) {
                console.warn(`Le fichier ${f} n'avait pas de métadata associée, création ...`)
                // the file f has no NoteMetadata associated, create it
                this.saveNewNote(Notes.unDotTxt(f), fs.readFileSync(Notes.notesPath+f, {encoding: 'utf-8'}).toString(), {filename: f})
            }
        })
        // Save parsedJson
        this.saveJson()
    }
    /**
     * Génère un id (très probablement) unique au format texte
     */
    public static generateId(): string {
        return Math.floor(Math.random() * Math.floor(99999999)).toString()
    }
    /**
     * Génère un texte en français décrivant l'instant présent
     */
    public static getDate(): string {
        const options = { weekday: 'long', month: 'long', day: 'numeric', hour:'numeric', minute:'numeric' };
        const date = (new Date()).toLocaleDateString('fr-FR', options)
        return date
    }

    /**
     * Ajoute .txt a un nom de note
     * @param name Nom de la note
     */
    public static dotTxt(name: string): string {
        if (/.txt$/g.exec(name))
            return name;
        return name + '.txt';
    }
    /**
     * Supprime .txt a un nom de note
     * @param name Nom de la note
     */
    public static unDotTxt(name: string): string {
        return name.replace(/.txt$/g, '')
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
     * @param options {matiere?: number, isfavorite?: boolean, filename?: string}
     */
    public saveNewNote(title: string, content: string, options?: {matiere?: string, isfavorite?: boolean, filename?: string}): Note {
        const generatedId: string = Notes.generateId()
        let metadata: NoteMetadata = {
            id: generatedId,
            title: title,
            filename: options && options.filename ? options.filename : Notes.dotTxt(generatedId),
            lastedit: Notes.getDate(),
            isfavorite: options && options.isfavorite!=undefined ? options.isfavorite : false,
            matiere: options && options.matiere ? options.matiere : ''
        }
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
        console.debug(`Récupération de la note ${noteId} dans la liste :`, this.parsedJson.map(p=>p.id))
        let meta:NoteMetadata = this.parsedJson.find( (data: NoteMetadata) => data.id == noteId)
        if (!meta) throw Error("Note non trouvée : " + noteId)
        let content:string = fs.readFileSync(Notes.notesPath + meta.filename, {encoding: 'utf-8'}).toString()
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
    public saveNote(note: Note): Note {
        /**
         * Écriture des metadata
         */
        let index: number = this.parsedJson.findIndex( (meta:NoteMetadata) => meta.id === note.meta.id )
        if (index !== -1) 
            this.parsedJson[index] = note.meta // La note éxiste déjà dans user_notes.json, On met à jour les données
        else
            this.parsedJson.push(note.meta) // La note n'éxiste pas dans user_notes.json, On la crée
        this.saveJson() // On met à jour les données dans user_notes.json
        /**
         * Écriture du contenu de la note
         */
        fs.writeFileSync(Notes.notesPath + note.meta.filename, note.content)
        return note
    }

    /**
     * Modifie une propriété d'une note
     * ATTENTION : La note déjà avoir été crée
     * @param {string} property La valeur a modifier
     * @param {any} value Nouvelle valeur
     * @param {any} id Id de la note
     */
    public setProperty(property: string, value: (string|number|boolean), id: string): NoteMetadata {
        // check
        if (!["title", "id", "filename", "lastedit", "isfavorite", "matiere"].includes(property)) {
            throw Error(`La propriete ${property} n'appartient pas au type NoteMetadata`)
        }
        console.debug(`Affectation de la pté. ${property} = ${value} pour la note ${id}`)
        // edit metadata property
        let meta: NoteMetadata = this.getMetadataFromId(id)
        if (!meta) throw Error(`Aucune note trouvée avec l'id ${id}`)
        Object.defineProperty(meta, property, {value: value, writable: true, configurable: true})
        // let newObj = Object.assign(meta)
        // On informe mainWindow que la note à été mise à jour
        this.app.mainWindow.browserWindow.webContents.send('updatedNoteMetadata', meta)
        return meta
    }

    /**
     * Supprime une note, fichier compris
     * @param id Note à supprimer
     */
    public deleteNote(id: string): NoteMetadata[] {
        let meta: NoteMetadata = this.getMetadataFromId(id)
        if (!meta) throw Error('Aucune donnée trouvée pour l\'ID ' + id + ' Trace parsedJson : ' + JSON.stringify(this.parsedJson))
        // Suppression du fichier
        fs.unlinkSync(Notes.notesPath + meta.filename);
        // Suppression dans parsedJson
        let index = this.parsedJson.findIndex((m:NoteMetadata) => m.id == id)
        let deleted = this.parsedJson.splice(index, 1);
        // Sauvegarde des modifications
        this.saveJson()
        console.debug(`Element supprimé de this.parsedJson > ${JSON.stringify(deleted)}`)
        return this.parsedJson;
    }

    /**
     * Renvoie les url locales (C:/Users/.../x.png) des images d'une note
     * @param noteId Id de la note
     */
    private getLocalImagePaths(note: Note): string[] {
        let output: string[] = []
        // Récupère tous les sources des images du document (en ignorant file:/// si présent au début)
        let regex: RegExp = /src=(?:"|')(?:file:\/\/\/)?([\s\S]*?)(?:\?[a-zA-Z0-9]*)?(?:"|')/g
        let array: RegExpExecArray;
        while ((array = regex.exec(note.content)) != null) {
            let match: string = array[1]
            // TODO attention, une image peut etre sur un serveur sans avoir de 'http(s)' en préfixe !
            // Une solution plus élégante doit être trouvée.
            if (!match.includes('http')) output.push(array[1])
        }
        return output
    }

    public backupNote(noteId: string, path: string) {
        let temp: string = homedir + '/NoxuNote/temp/'
        // Récupération de la note
        let note: Note = this.getNote(noteId)
        // création du dossier de travail temporaire
        fs.emptyDirSync(temp)
        // copie de la note dans le dossier de travail
        let notePath = homedir +'/NoxuNote/notes/' + note.meta.filename
        fs.copyFileSync(notePath, `${temp}/note.txt`)
        // copie des images dans le dossier de travail
        this.getLocalImagePaths(note).forEach(path => {
            let imageFileName: string = /[^\/]+$/g.exec(path)[0]
            if (imageFileName) fs.copyFileSync(path, `${temp}/${imageFileName}`)
        })
        // création d'un zip
        let zip = new AdmZip()
        zip.addLocalFolder(temp)
        zip.writeZip(path)
        // suppression du dossier de travail temporaire
        fs.removeSync(temp)
    }
}
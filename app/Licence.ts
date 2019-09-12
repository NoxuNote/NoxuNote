import { shell } from "electron";
import { INoxunoteApp } from "./types";

const http = require('http')
const https = require('https')
var querystring = require('querystring')
var os = require("os")

export class Licence {
    actualVersion: string;
    lastVersion: string;
    changeLog: string;
    id: number;

    /**
     * Instancie les connexions à l'API NoxuNote
     * @param {Object} noxuNoteAppInstance NoxuApp instance
     * @param {boolean} DEBUG NoxuNote en mode debug ou non
     */
    constructor(noxuNoteAppInstance: INoxunoteApp, DEBUG: any) {
        this.actualVersion = "1.0.1beta"
        this.lastVersion = null
        this.changeLog = null
        this.id = Math.floor(Math.random() * Math.floor(99999))
        if (!DEBUG) {
            this.getChangelogJSON((response: { lastVersion: string; changeLog: string; }) => {
                this.lastVersion = response.lastVersion
                this.changeLog = response.changeLog
                this.sendActivityPacket(false)
                //type: "question",
                // buttons: ['Télécharger', 'Plus tard'],
                // detail: "Nouveautés (version " + l.lastVersion + ") : \n" + l.changeLog,
                // message: "Mise à jour disponible !"
                if (this.actualVersion != this.lastVersion) {
                    // Si NoxuNote n'est pas à jour on informe l'utilisateur 4 secondes après l'ouverture
                    setTimeout(()=>{
                        // Crée un objet de notification
                        const notification = {
                            "title": "Mise à jour disponible !", 
                            "content": response.changeLog, 
                            "timeout": 12000, 
                            "b1Text": "Télécharger",
                            "b1Action": ()=>{shell.openExternal("https://noxunote.fr/prototype/#download")}
                        }
                        // On transforme la notif en texte/JSON pour l'envoyer à travers l'IPC
                        const notificationSerialized = JSON.stringify(notification, (key, val) => {
                                // On sérialise aussi les fonctions
                                if (typeof val === 'function') return val.toString(); // implicitly `toString` it
                                return val;
                            }
                        )
                        // On envoie la notification sérialisée à la fenêtre principal
                        noxuNoteAppInstance.mainWindow.browserWindow.webContents.send("showNotification", notificationSerialized)
                    }, 4000)
                }
            })
        }
    }

    getVersion() {
        return this.actualVersion
    }

    getChangelogJSON(callback: { (response: any): void; (arg0: any): void; }) {
        var url = 'https://noxunote.fr/prototype/version.json';
        https.get(url, function (res: { on: { (arg0: string, arg1: (chunk: any) => void): void; (arg0: string, arg1: () => void): void; }; }) {
            var body = '';
            res.on('data', function (chunk: string) {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    var response = JSON.parse(body);
                    callback(response)
                } catch(e) {
                    console.error('Réponse de l\'API incorrecte')
                }
                // On définit les attributs de la licence
            });
        }).on('error', function (e: any) {
            console.error("Erreur de récupération du changelog.");
        });
    }

    // Envoi un paquet anonyme a noxunote.fr contenant la version de NoxuNote et le nom de l'OS
    sendActivityPacket(isUpdate: boolean) {
        // Build the post string from an object
        var type = "";
        if (isUpdate) type = "update"
        else type = "lancement"
        var post_data = JSON.stringify(
            {
                type: type,
                version: this.actualVersion,
                os: os.platform(),
                session: this.id
            }
        )

        // An object of options to indicate where to post to
        var post_options = {
            host: 'noxunote.fr',
            port: '35200',
            path: '/api/stats/anonymous/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(post_data)
            }
        };

        // Set up the request
        var post_req = http.request(post_options, function (res: { setEncoding: (arg0: string) => void; on: (arg0: string, arg1: (chunk: any) => void) => void; }) {
            res.setEncoding('utf8');
            res.on('data', function (chunk: string) {
                console.log('Response: ' + chunk);
            });
        }).on('error', function (e: any) {
            console.log("Erreur d'envoi du activityPacket.");
        });

        // post the data
        post_req.write(post_data);
        post_req.end();
        
        // On renvoie un paquet toutes les 5 minutes.
        setTimeout(()=>this.sendActivityPacket(true), 300000)
    }

}

module.exports.Licence = Licence
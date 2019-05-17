const http = require('http')
const https = require('https')
var querystring = require('querystring')
var os = require("os")

class Licence {

    /**
     * Instancie les connexions à l'API NoxuNote
     * @param {function} callback 
     * @param {boolean} DEBUG NoxuNote en mode debug ou non
     */
    constructor(callback, DEBUG) {
        this.actualVersion = "1.0.0"
        this.lastVersion = null
        this.changeLog = null
        this.id = Math.floor(Math.random() * Math.floor(99999))
        if (!DEBUG) {
            this.getChangelogJSON((response) => {
                this.lastVersion = response.lastVersion
                this.changeLog = response.changeLog
                this.sendActivityPacket(false)
                callback(this)
            })
        }
    }

    getVersion() {
        return this.actualVersion
    }

    getChangelogJSON(callback) {
        var url = 'https://noxunote.fr/prototype/version.json';
        https.get(url, function (res) {
            var body = '';
            res.on('data', function (chunk) {
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
        }).on('error', function (e) {
            console.error("Erreur de récupération du changelog.");
        });
    }

    // Envoi un paquet anonyme a noxunote.fr contenant la version de NoxuNote et le nom de l'OS
    sendActivityPacket(isUpdate) {
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
        var post_req = http.request(post_options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('Response: ' + chunk);
            });
        }).on('error', function (e) {
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
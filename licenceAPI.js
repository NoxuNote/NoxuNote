const http = require('http')
var querystring = require('querystring')
var os = require("os")

class Licence {

    constructor(callback) {
        this.actualVersion = "0.5.1"
        this.lastVersion = null
        this.changeLog = null
        this.id = Math.floor(Math.random() * Math.floor(99999))
        this.getChangelogJSON((response) => {
            this.lastVersion = response.lastVersion
            this.changeLog = response.changeLog
            this.sendActivityPacket(false)
            callback(this)
        })
    }

    getChangelogJSON(callback) {
        var url = 'http://noxunote.fr/prototype/version.json';
        http.get(url, function (res) {
            var body = '';
            res.on('data', function (chunk) {
                body += chunk;
            });
            res.on('end', () => {
                var response = JSON.parse(body);
                // On définit les attributs de la licence
                callback(response)
            });
        }).on('error', function (e) {
            console.log("Erreur de récupération du changelog.");
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
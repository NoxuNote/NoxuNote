const fs = require('fs-extra');
const homedir = require('os').homedir();
/***************************************************************************************************
 *                                       PRESETS DE COULEURS                                       *
 ***************************************************************************************************/
class Colors {
    constructor() {
        this.path = homedir + "/NoxuNote/colors.json";
        this.createFileDB();
        this.loadJson();
    }
    /**
     * Créee le fichier stoquant les données s'il n'existe pas
     */
    createFileDB() {
        const djson = [
            "#ed8484", "#f7ded4", "#eda884", "#edc884", "#ede984",
            "#d1ed84", "#a1ed84", "#84edd4", "#75d5dd", "#84aaed",
            "#9a84ed", "#cb84ed", "#ed84e2", "#ed8493", "#adadad"
        ];
        if (!fs.existsSync(this.path)) {
            fs.writeJSONSync(this.path, djson);
        }
    }
    /**
     * Lit le fichier et stoque les données dans l'objet
     */
    loadJson() {
        this.rawJson = fs.readJSONSync(this.path);
    }
    /**
     * Ecrit les données de l'objet dans le fichier
     */
    saveJson() {
        fs.writeJSONSync(this.path, this.rawJson);
    }
    get colorsList() {
        return this.rawJson;
    }
}
exports.Colors = Colors;

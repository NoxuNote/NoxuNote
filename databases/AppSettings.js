const fs = require('fs-extra');
const homedir = require('os').homedir();
/***************************************************************************************************
 *                                          AppSettings                                            *
 ***************************************************************************************************/
class AppSettings {
    constructor() {
        this.path = homedir + "/NoxuNote/settings.json";
        this.createFileDB();
        this.loadJson();
    }
    /**
     * Créee le fichier stoquant les données s'il n'existe pas
     */
    createFileDB() {
        const djson = [
            {
                key: "enableDragNDrop",
                value: false
            },
            {
                key: "enableDevMode",
                value: false
            }
        ];
        if (!fs.existsSync(this.path))
            fs.writeJSONSync(this.path, djson);
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
    setValue(key, value) {
        this.assocList.find(assoc => assoc.keyVal == key).value = value;
        this.saveJson();
    }
    get assocList() {
        return this.rawJson;
    }
}

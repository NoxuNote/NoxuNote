const fs = require('fs-extra');
const homedir = require('os').homedir();
import { JSONDataBase } from '../types'
/***************************************************************************************************
 *                                       PRESETS DE COULEURS                                       *
 ***************************************************************************************************/
export class Colors extends JSONDataBase {
    constructor() {
        let path: string = homedir + "/NoxuNote/colors.json";
        let defaultJson = [
            "#ed8484", "#f7ded4", "#eda884", "#edc884", "#ede984",
            "#d1ed84", "#a1ed84", "#84edd4", "#75d5dd", "#84aaed",
            "#9a84ed", "#cb84ed", "#ed84e2", "#ed8493", "#adadad"
        ]
        super(path, defaultJson)
    }
    
}
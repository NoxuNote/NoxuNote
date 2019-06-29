import { JSONDataBase } from "../types";

const fs = require('fs-extra');
const homedir = require('os').homedir();
/***************************************************************************************************
 *                                          AppSettings                                            *
 ***************************************************************************************************/
export class AppSettings extends JSONDataBase {
    constructor() {
        let path: string = homedir + "/NoxuNote/settings.json"
        let defaultJson: Object = [
            {
                key: "enableDragNDrop",
                value: false
            },
            {
                key: "enableDevMode",
                value: false
            }
        ]
        super(path, defaultJson)
    }
    setValue(key: any, value: any) {
        this.rawJson.find((assoc: { keyVal: any; }) => assoc.keyVal == key).value = value;
        this.saveJson();
    }
}

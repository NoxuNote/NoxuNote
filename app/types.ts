import { BrowserWindow, WebContents } from 'electron'
import { Licence } from './licence'
import { DataBase } from './DataBase';
const fs = require('fs-extra')

//
// ─── APPLICATION ────────────────────────────────────────────────────────────────
//
export interface INoxunoteApp {
  licence: Licence;
  db: DataBase;
  mainWindow: INoxunoteWindow;
  mainDrawWindow: INoxunoteWindow;
  mainOutputWindow: INoxunoteWindow;
  settingsWindow: ISettingsWindow;
  prePrintWindow: INoxunoteWindow;
}


//
// ─── APPLICATION WINDOWS ────────────────────────────────────────────────────────
//
export interface INoxunoteWindow {
  allowClose: boolean;
  browserWindow: BrowserWindow;
}
export interface ISettingsWindow extends INoxunoteWindow {
  switch(key:string): void;
}


//
// ─── DATABASE ───────────────────────────────────────────────────────────────────
//
export class JSONDataBase {
  rawJson: any; // Stores the JSON data
  /**
   * Creates files if not exists and loads its content to "rawJson"
   * @param path Path to DB json file
   * @param defaultJson Default json to put in db
   */
  constructor(public path: string, public defaultJson: Object) {
    this.createFileDB()
    this.loadJson()
  }
  /**
   * Ecrit rawJson dans le fichier
   */
  public saveJson(): void {
    fs.writeJSONSync(this.path, this.rawJson);
  }
  /**
   * Lit le fichier et stoque les données dans rawJson
   */
  public loadJson(): void {
    this.rawJson = fs.readJSONSync(this.path);
  }
  /**
   * Créee le fichier stoquant les données s'il n'existe pas
   */
  createFileDB(): void {
    if (!fs.existsSync(this.path)) {
      fs.writeJSONSync(this.path, this.defaultJson);
    }
  }
}

//
// ─── DATA STRUCTURES ────────────────────────────────────────────────────────────
//
export type NoteMetadata = {
  id: string;
  title: string;
  filename: string;
  lastedit: string;
  isfavorite: boolean;
  matiere: string;
}
export type Note = {
  meta: NoteMetadata
  content: string;
}

export type Matiere = {
  id: string;
  name: string;
  color: string;
}

//
// ─── PLUGINS ────────────────────────────────────────────────────────────────────
//
export interface NoxunotePlugin {
  /**
   * Elements interacting with the plugin
   */
  elts: any;
  /**
   * Plugin initialization method
   */
  init(): void;
}  
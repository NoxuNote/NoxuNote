import { ipcRenderer } from "electron";

/**
 * Ce script à pour d'attribuer différents comportements VISUELS de l'interface selon
 * le système d'exploitation utilisé.
 * (darwin = macOS)
 */
const platform = require('os').platform()


// Sur mac
if (platform === 'darwin') {

    // Suppression des traybuttons
    let trayButtons = document.getElementById('trayButtons')
    trayButtons.style.display = "none"

}

// Sur les autres systèmes
if (platform !== 'darwin') {

    // Quand la fenêtre est redimensionnée, il faut modifier l'icone maximize
    // selon que la fenêtre soit en plein écran ou non.
    window.addEventListener('resize', () => {
        // On interroge le processus principal de notre etat
        let maximized = ipcRenderer.sendSync('amIMaximized');
        let button = document.getElementById('maximizeButton');
        // On modifie la classe du bouton selon l'etat
        if (maximized) {
            button.className = "fas fa-window-restore pointable"
        } else {
            button.className = "fas fa-window-maximize pointable"
        }
    })
    
}
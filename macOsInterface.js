const platform = require('os').platform()

if (platform === 'darwin') {

    // // Grandi la taille de la div qui permet de déplacer la fenêtre.
    // // Cette derniere étant définie de base à 80% pour utiliser les traybuttons.
    // let title = document.getElementById('windowTitle')
    // title.style.width = "100%"

    // Suppression des traybuttons
    let trayButtons = document.getElementById('trayButtons')
    trayButtons.style.display = "none"

}

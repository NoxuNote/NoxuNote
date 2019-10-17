const { remote } = require('electron')
const { Menu, MenuItem } = remote

const menu = new Menu()
menu.append(new MenuItem({ label: 'Annuler l\'action', role: 'undo' }))
menu.append(new MenuItem({ label: 'Rétablir l\'action', role: 'redo' }))
menu.append(new MenuItem({ type: 'separator' }))
menu.append(new MenuItem({ label: 'Couper', role: 'cut' }))
menu.append(new MenuItem({ label: 'Copier', role: 'copy' }))
menu.append(new MenuItem({ label: 'Coller', role: 'paste' }))
menu.append(new MenuItem({ label: 'Coller sans formattage (texte brut)', role: 'pasteAndMatchStyle' }))
menu.append(new MenuItem({ type: 'separator' }))
menu.append(new MenuItem({ label: 'Tout sélectionner', role: 'selectAll' }))
menu.append(new MenuItem({ type: 'separator' }))
menu.append(new MenuItem({ label: '+ Agrandir l\'interface', role: 'zoomIn' }))
menu.append(new MenuItem({ label: '- Rétrécir l\'interface', role: 'zoomOut' }))
menu.append(new MenuItem({ label: 'Réinitialiser l\'interface', role: 'resetZoom' }))
menu.append(new MenuItem({ type: 'separator' }))
menu.append(new MenuItem({ label: 'Quitter', role: 'quit'}))

window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  menu.popup({ window: remote.getCurrentWindow() })
}, false)

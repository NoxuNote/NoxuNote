document.addEventListener('keydown', (e)=>{
  if (event.ctrlKey || event.metaKey) {
    // CTRL + E
    if (e.which == 69) {
      editor.summernote('saveRange')
			modalManager.openModal("equationModal")
      equationManager.refreshHistory()
    }
  }
})
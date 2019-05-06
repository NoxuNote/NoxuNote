class ModalManager {

    constructor() {
        this.modals = new Object()
        this.modals["choixMediaModal"] = $("#choixMediaModal")
        this.modals["imageByUrlModal"] = $("#imageByUrlModal")
        this.modals["imageByFileModal"] = $("#imageByFileModal")
        this.modals["equationModal"] = $("#equationModal")
        this.modals["saveConfirmationModal"] = $("#saveConfirmationModal")
    }

    closeModal(modalId) {
        this.modals[modalId].modal('hide')
    }

    openModal(modalId) {
        // Fermeture des autres modales
        this.closeAllModal()
        // Ouverture de la modale voulue
        this.modals[modalId].modal('show')
    }

    toggleModal(modalId) {
        this.modals[modalId].modal('toggle')
    }

    closeAllModal() {
        for (let key in this.modals) {
            if (this.modals.hasOwnProperty(key)) this.closeModal(key)
        }
    }

}

module.exports = ModalManager
export class ModalManager {
    modals: any;

    constructor() {
        this.modals = new Object()
        this.modals["choixMediaModal"] = $("#choixMediaModal")
        this.modals["imageByUrlModal"] = $("#imageByUrlModal")
        this.modals["imageByFileModal"] = $("#imageByFileModal")
        this.modals["equationModal"] = $("#equationModal")
        this.modals["saveConfirmationModal"] = $("#saveConfirmationModal")

        // Focus on field if modal opened
        this.modals["equationModal"].on('shown.bs.modal', function() {
            $('#equationValue').focus();
        })
        this.modals["imageByUrlModal"].on('shown.bs.modal', function() {
            $('#imageByUrlValue').focus();
        })
    }

    closeModal(modalId: string) {
        this.modals[modalId].modal('hide')
    }

    openModal(modalId: string) {
        // Fermeture des autres modales
        this.closeAllModal()
        // Ouverture de la modale voulue
        this.modals[modalId].modal('show')
    }

    toggleModal(modalId: string) {
        this.modals[modalId].modal('toggle')
    }

    closeAllModal() {
        for (let key in this.modals) {
            if (this.modals.hasOwnProperty(key)) this.closeModal(key)
        }
    }

}
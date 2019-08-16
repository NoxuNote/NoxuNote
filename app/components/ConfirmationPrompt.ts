import * as $ from "jquery";

export class ConfirmationPrompt {

  private html: string = `
    <div class="modal fade" id="promptConfirmationModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="promptConfirmationModalTitle"></h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body" style="text-align: center">
            <div id='promptConfirmationModalContent'></div>
          </div>
          <div class="modal-footer">
            <button id="promptConfirmationModalConfirmation" type="button" class="btn btn-primary">Confirmer</button>
            <button id="promptConfirmationModalCancel" type="button" class="btn btn-secondary" data-dismiss="modal">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  `

  private response: Promise<void>

  private el: HTMLDivElement

  public constructor(title: string, content: string ) {
    // Init & vars déclaration
    this.createElement()
    let titleElement = document.getElementById('promptConfirmationModalTitle')
    let label = document.getElementById('promptConfirmationModalLabel')
    let contentElement = document.getElementById('promptConfirmationModalContent')
    let okButton = document.getElementById('promptConfirmationModalConfirmation')
    let cancelButton = document.getElementById('promptConfirmationModalCancel')
    let inputElement: HTMLInputElement = <HTMLInputElement> document.getElementById('promptConfirmationModalInput')
    // Set modal content
    titleElement.innerHTML = title
    contentElement.innerHTML = content
    // Catch user interaction
    this.response = new Promise<void>( (resolve, reject) =>{
      okButton.addEventListener('click', (e: MouseEvent) => {
        this.removeElement()
        resolve()
      })
      cancelButton.addEventListener('click', (e: MouseEvent) => {
        this.removeElement()
        reject()
      })
    });
    // Focus on appear
    $('#promptConfirmationModal').on('shown.bs.modal', ()=>inputElement.focus())
  }

  getPromise(): Promise<void> {
    return this.response
  }
  

  private createElement() {
    this.el = document.createElement('div')
    this.el.innerHTML = this.html
    document.firstChild.appendChild(this.el);
    // enable modal
    (<any>$('#promptConfirmationModal')).modal('show')
  }

  private removeElement() {
    (<any>$('#promptConfirmationModal')).modal('hide')
    this.el.parentNode.removeChild(this.el)
  }

}
import * as $ from "jquery";

export class StringPrompt {

  private html: string = `
    <div class="modal fade" id="promptStringModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="promptStringModalTitle"></h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body" style="text-align: center">
            <div id='promptStringModalContent'></div>
            <div class="input-group mb-3">
              <div class="input-group-prepend">
                <span class="input-group-text" id="promptStringModalLabel"></span>
              </div>
              <input id="promptStringModalInput" type="text" class="form-control" aria-label="Default" aria-describedby="inputGroup-sizing-default">
            </div>
          </div>
          <div class="modal-footer">
            <button id="promptStringModalConfirmation" type="button" class="btn btn-primary">Ok</button>
            <button id="promptStringModalCancel" type="button" class="btn btn-secondary" data-dismiss="modal">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  `

  private response: Promise<String>

  private el: HTMLDivElement

  public constructor(title: string, content: string, options?: {label?: string, placeholder?: string, value?: string} ) {
    // Init & vars déclaration
    this.createElement()
    let titleElement = document.getElementById('promptStringModalTitle')
    let label = document.getElementById('promptStringModalLabel')
    let contentElement = document.getElementById('promptStringModalContent')
    let okButton = document.getElementById('promptStringModalConfirmation')
    let cancelButton = document.getElementById('promptStringModalCancel')
    let inputElement: HTMLInputElement = <HTMLInputElement> document.getElementById('promptStringModalInput')
    // Set modal content
    titleElement.innerHTML = title
    contentElement.innerHTML = content
    label.innerHTML = (options && options.label) ? options.label : 'Valeur'
    inputElement.placeholder = (options && options.placeholder) ? options.placeholder : 'Entrez une valeur'
    inputElement.value = (options && options.value) ? options.value : ''
    // Catch user interaction
    this.response = new Promise<string>( (resolve, reject) =>{
      okButton.addEventListener('click', (e: MouseEvent) => {
        this.removeElement()
        resolve(inputElement.value)
      })
      cancelButton.addEventListener('click', (e: MouseEvent) => {
        this.removeElement()
        reject()
      })
    });
    // Focus on appear
    $('#promptStringModal').on('shown.bs.modal', ()=>inputElement.focus())
  }

  getPromise(): Promise<String> {
    return this.response
  }
  

  private createElement() {
    this.el = document.createElement('div')
    this.el.innerHTML = this.html
    document.firstChild.appendChild(this.el);
    // enable modal
    (<any>$('#promptStringModal')).modal('show')
  }

  private removeElement() {
    (<any>$('#promptStringModal')).modal('hide')
    this.el.parentNode.removeChild(this.el)
  }

}
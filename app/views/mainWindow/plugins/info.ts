import { NoxunotePlugin } from "../../../types";

export type InfoElements = {
  triggers: HTMLElement[],
  element: HTMLElement
}

export class InfoPlugin implements NoxunotePlugin {
  
  constructor(public elts: InfoElements) {
    this.init()
  }
  
  init() {
    // Opens the toDo block
    this.elts.triggers.forEach( (e:HTMLElement) => {
      e.addEventListener('click', ()=>this.toggle())
    })
  }

  toggle() {
    this.elts.element.classList.toggle("appear")
  }


}
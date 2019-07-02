import { NoxunotePlugin } from "../../../types";
const math = require("mathjs")

export type CalcElements = {
  menu: HTMLElement
  normalInput: HTMLInputElement,
  derivativeInput: HTMLInputElement,
  normalOutput: HTMLElement,
  derivativeOutput: HTMLElement,
  triggerElements: HTMLElement[]
}

export class CalcPlugin implements NoxunotePlugin {

  constructor(public elts: CalcElements) {
    this.init()
  }

  init() {
    // On type -> evaluate
    this.elts.normalInput.addEventListener('keyup', ()=>this.calcEvaluate())
    this.elts.derivativeInput.addEventListener('keyup', ()=>this.calcEvaluateDerivative())
    // Opens the calculator
    this.elts.triggerElements.forEach( (e:HTMLElement) => {
      e.addEventListener('click', ()=>this.boutonCalculatrice())
    })
  }

  /**
  * Affiche/Masque le volet menu calculatrice
  */
  public boutonCalculatrice() {
    this.elts.menu.classList.toggle("appear");
  }

  /**
   * Affichage des matières disponibles dans SAUVER
   */
  public calcEvaluate() {
    setTimeout(() => {
      let output = this.elts.normalOutput
      try {
        let result = math.eval(this.elts.normalInput.value)
        if (result.toString().length < 40) {
          if (result != "undefined") {
            output.innerHTML = result
          } else {
            output.innerHTML = "(indéfini)"
          }
        } else {
          output.innerHTML = "(indéfini)"
        }
      } catch (e) {
        output.innerHTML = "(indéfini)";
      }
    }, 20);
  }

  /**
   * Calcule et affiche la derivée de la fonction
   */
  public calcEvaluateDerivative() {
    setTimeout(() => {
      let output = this.elts.derivativeOutput
      try {
        let result = math.derivative(this.elts.derivativeInput.value, "x");
        if (result.toString().length < 40) {
          if (result != "undefined") {
            output.innerHTML = result;
          } else {
            output.innerHTML = "(indéfini)";
          }
        } else {
          output.innerHTML = "(indéfini)";
        }
      } catch (e) {
        output.innerHTML = "(indéfini)";
      }
    }, 20);
  }

}
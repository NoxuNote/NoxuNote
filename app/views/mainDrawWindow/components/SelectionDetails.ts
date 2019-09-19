let Vue = require('../../../../node_modules/vue/dist/vue.min.js')

export function initSelectionDetails() {
  let template = `
    <div v-if="selectedObjs.length">
      <h4>Selection</h4>
      <div v-if="selectedObjs.length == 1">
          <h6>Proprietés de {{selectedObjs[0].type}}</h6>
          <button-counter></button-counter>
          <div v-for="property in ShapeInserter.getProperties(selectedObjs[0])">
              {{ property.name }} : {{ property.value }}
          </div>
      </div>
      <div v-if="selectedObjs.length > 1">
          <h6>Objets sélectionnées ({{selectedObjs.length}}) :</h6>
          <div v-for="obj in selectedObjs">
              {{ obj.type }}
          </div>
          <h6>Proprietés communes</h6>
          <div v-for="property in ShapeInserter.getCommonProperties(selectedObjs)">
              {{ property.name }} : {{ property.value }}
          </div>
      </div>
    </div>
  `
  Vue.component('selectionDetails', {
    template: template,
    data: {
      selectedObjs: []
    }
  })
}
// Définition d'un nouveau composant appelé `button-counter`

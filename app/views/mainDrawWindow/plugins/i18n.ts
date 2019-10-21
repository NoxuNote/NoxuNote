const VueI18n = require('vue-i18n')
const Vue = require('../../../../node_modules/vue/dist/vue.min.js')

Vue.use(VueI18n)
export const i18n = new VueI18n({
  locale: 'fr',
  fallbackLocale: 'fr',
  messages: {
    fr: {
      fill: "Remplissage",
      strokeWidth: "Épaisseur Bordure",
      stroke: "Couleur Bordure",
      radius: "Rayon (dépend de l'échelle)",
      opacity: "Opacité",
      rect: "Rectangle",
      circle: "Cercle",
      group: "Groupe",
      path: "Tracé",
      delete: "Supprimer",
      duplicate: "Dupliquer",
      duplicate_instance: "Copie liée",
      'i-text': "Texte",
      fontFamily: "Police"
    }
  }
})
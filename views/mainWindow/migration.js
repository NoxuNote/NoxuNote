const noteToHtml = require("../../parser").noteToHtml

/**
 * Convertit un format noxunote en nouveau format (SummerNote)
 * @param {String} noxunote Format texte noxunote d'une ancienne version
 */
function toNewFormat(noxunote) {
    noxunote = noxunote.toString().replace("@NOXUNOTE_BEGIN", "")
    newFormat = new String()
    old = noxunote.split("\n")
    old.forEach(element => {
        newFormat += noteToHtml(element) + "\n"
    });
    return newFormat
}

module.exports = toNewFormat
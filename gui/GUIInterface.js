function GUIInterface () {
    this.target;
}

GUIInterface.prototype.setTarget = function setTarget (targetParent) {
    this.target = targetParent.appendChild(document.createElement("div"));
    this.target.classList.add("GUIInterface");
};

GUIInterface.prototype.askChampionDialog = async function askChampionDialog (pos) {
    if (!this.target) throw "GUIInterface has no target set!";

    var dialog = this.target.appendChild(document.createElement("div"));
    dialog.classList.add("dialog");

    dialog.style.left = pos.x;
    dialog.style.top = pos.y;

    return new Promise((resolve, reject) => {
        for (var k = 0; k < STATIC_DATA.champions.length; k++) {
            this._addChampionToDialog(dialog, STATIC_DATA.champions[k])
            .addEventListener("click", (event) => {
                dialog.parentNode.removeChild(dialog);
                resolve(event.target.champion);
            });
        }
    });
};

GUIInterface.prototype._addChampionToDialog = function _addChampionToDialog (dialog, champion) {
    var img = dialog.appendChild(document.createElement("img"));
    img.src = STATIC_DATA.getImageFromChampion(champion);
    img.champion = champion;
    return img;
};
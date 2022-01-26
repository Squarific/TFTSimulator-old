var STATIC_DATA = {
    champions: [],
};

STATIC_DATA.load = async function load () {
    return Promise.all([this._loadChampions()]);
};

STATIC_DATA._loadChampions = async function _loadChampions () {
    let response = await fetch("data/champions.json");

    if (!response.ok) {
        throw "Could not load champions: HTTP-Error: " + response.status;
    }

    let json = await response.json();
    this.champions = json;
}

STATIC_DATA.getImageFromChampion = function getImageFromChampion (champion) {
    return "data/champions/" + champion.name.toLowerCase().replace("'", "").replace(" ", "") + ".png";
};
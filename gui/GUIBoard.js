function GUIBoard () {
    this.WIDTH = 7;
    this.HEIGHT = 8;
    this.TILESIZE = 100;
    this.tiles = [];
    this.entities = [];
    this.TEAM_BOTTOM = 0;
    this.TEAM_TOP = 1;
}

GUIBoard.prototype.updateFromBoard = function updateFromBoard (newBoard) {
    //var path = newBoard.getPathTo({column: 6, row: 7}, {column: 5, row: 2});

    for (var key = 0; key < this.tiles.length; key++) {
        var tile = this.tiles[key];
        this.setChampionOnTile(tile, newBoard.champions.find((champion) => { return champion.column == tile.column && champion.row == tile.row }));
        //tile.innerHTML = path.findIndex((pathElement) => { return pathElement.column == tile.column && pathElement.row == tile.row });
    }

    for (var k = 0; k < this.entities.length; k++) {
        this.entities[k].visual.stillAlive = false;
    }

    for (var key = 0; key < newBoard.entities.length; key++) {
        this.updateEntity(newBoard.entities[key]);
        newBoard.entities[key].visual.stillAlive = true;
    }

    for (var k = 0; k < this.entities.length; k++) {
        if (!this.entities[k].visual.stillAlive) {
            this.removeEntity(this.entities[k]);
            k--;
        }
    }
};

GUIBoard.prototype.updateEntity = function updateEntity (entity) {
    if (!entity.visual) {
        this.createEntityVisual(entity);
    } else {
        this.updateEntityVisual(entity);
    }
};

GUIBoard.prototype.createEntityVisual = function createEntityVisual (entity) {
    var entityVisual = this.entityTarget.appendChild(document.createElement("div"));
    entityVisual.classList.add("entity");
    entityVisual.classList.add(entity.name);

    entity.visual = entityVisual;
    this.entities.push(entity);

    entityVisual.style.left = entity.position.x + "px";
    entityVisual.style.top = entity.position.y + "px";
};

GUIBoard.prototype.updateEntityVisual = function updateEntityVisual (entity) {
    entity.visual.style.left = entity.position.x + "px";
    entity.visual.style.top = entity.position.y + "px";
};

GUIBoard.prototype.removeEntity = function removeEntity (entity) {
    this.entityTarget.removeChild(entity.visual);
    this.entities.splice(this.entities.indexOf(entity), 1);
};

GUIBoard.prototype.setChampionOnTile = function setChampionOnTile (tileElement, champion) {
    // If there is a champion and it is the same as the one on the tile, just update
    if (champion && tileElement.champion == champion) return this._updateChampionTile(tileElement, champion);

    // Remove previous content, if no new champion, done
    while(tileElement.firstChild) tileElement.removeChild(tileElement.firstChild);
    
    if (!champion) return;

    var img = tileElement.appendChild(document.createElement("img"));
    img.src = STATIC_DATA.getImageFromChampion(champion);

    if (champion.moving)    img.style.opacity = "0.5";
    else                    img.style.opacity = "";

    if (champion.team == this.TEAM_BOTTOM)      img.style.border = "2px solid red";
    else if (champion.team == this.TEAM_TOP)    img.style.border = "2px solid blue";
    else                                        img.style.border = "2px solid gray";

    tileElement.healthBar = tileElement.appendChild(this.createBar("health", champion.currentHealth / champion.getMaxHealth() * 100));
    tileElement.manaBar = tileElement.appendChild(this.createBar("mana",   champion.currentMana   / champion.getMaxMana()   * 100));
    tileElement.champion = champion;
    tileElement.image = img;
};

GUIBoard.prototype._updateChampionTile = function _updateChampionTile (tileElement, champion) {
    tileElement.healthBar.resource.style.width = champion.currentHealth / champion.getMaxHealth() * 100 + "%";
    tileElement.manaBar.resource.style.width =   champion.currentMana   / champion.getMaxMana()   * 100 + "%";

    if (champion.moving)    tileElement.image.style.opacity = "0.5";
    else                    tileElement.image.style.opacity = "";

    if (champion.team == this.TEAM_BOTTOM)      tileElement.image.style.border = "2px solid red";
    else if (champion.team == this.TEAM_TOP)    tileElement.image.style.border = "2px solid blue";
    else                                        tileElement.image.style.border = "2px solid gray";
};

GUIBoard.prototype.createBar = function createBar (name, amount) {
    var bar = document.createElement("div");
    bar.classList.add("bar");

    var resource = bar.appendChild(document.createElement("div"));
    resource.classList.add(name);
    resource.style.width = amount + "%";
    bar.resource = resource;

    return bar;
};

/* VISUAL FUNCTIONS */

GUIBoard.prototype.createTiles = function createTiles () {
    var board = document.createElement("div");
    board.classList.add("board");

    for (var row = 0; row < this.HEIGHT; row++) {
        var rowElement = board.appendChild(document.createElement("div"));
        rowElement.classList.add("row");
        
        for (var column = 0; column < this.WIDTH; column++) {
            var tile = rowElement.appendChild(this.createTile({
                row: row,
                column: column
            }));
            this.tiles.push(tile);
        }
    }

    this.entityTarget = board.appendChild(document.createElement("div"));
    this.entityTarget.classList.add("entityTarget");

    return board;
};

/*
    createTile({
        row: 0,
        column: 0,
    });
*/
GUIBoard.prototype.createTile = function createTile (props) {
    var el = document.createElement("div");
    el.classList.add("hexagon");

    var coords = this.hexCoords(props.row, props.column);
    el.style.left = coords.x;
    el.style.top = coords.y;

    el.row = props.row;
    el.column = props.column;
    el.champion;

    return el;
};

GUIBoard.prototype.hexCoords = function hexCoords (row, column) {
    return {
        x: column * this.TILESIZE + row % 2 * this.TILESIZE / 2,
        y: row * this.TILESIZE * 0.84,
    };
};

function Cube (q, r, s) {
    if (Math.round(q + r + s) !== 0) throw "q + r + s must be 0, " + q + " " + r + " " + s + "";
    return {q: q, r: r, s: s};
}

function offset_distance(a, b) {
    var ac = oddroffset_to_cube(a);
    var bc = oddroffset_to_cube(b);
    return cube_distance(ac, bc);
}


function oddroffset_to_cube(h) {
    var ODD = -1;

    var q = h.column - (h.row + ODD * (h.row & 1)) / 2;
    var r = h.row;
    var s = -q - r;

    return Cube(q, r, s);
}

function cube_distance(a, b) {
    return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2
}
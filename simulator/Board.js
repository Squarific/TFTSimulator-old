function Board () {
    this.WIDTH = 7;
    this.HEIGHT = 8;
    this.TILESIZE = 100;

    this.tiles = this.createTiles();
    this.champions = [];
    this.entities = [];
    this.entitiesToBeRemoved = [];
    this.championsToBeRemoved = [];

    this.TEAM_BOTTOM = 0;
    this.TEAM_TOP = 1;
}

Board.prototype.createTiles = function createTiles () {
    var tiles = [];

    for (var column = 0; column < this.WIDTH; column++) {
        tiles[column] = [];
    }

    return tiles;
};

Board.prototype.addEntity = function addEntity (entity) {
    this.entities.push(entity);
};

Board.prototype.removeEntity = function removeEntity (entity) {
    this.entitiesToBeRemoved.push(entity);
};

Board.prototype.removeEntities = function removeEntities () {
    for (var k = 0; k < this.entitiesToBeRemoved.length; k++) {
        this._removeEntity(this.entitiesToBeRemoved[k]);
    }

    this.entitiesToBeRemoved = [];
};

Board.prototype._removeEntity = function removeEntity (entity) {
    this.entities.splice(this.entities.indexOf(entity), 1);
};


Board.prototype.removeChampion = function removeChampion (champion) {
    this.championsToBeRemoved.push(champion);
};

Board.prototype.removeChampions = function removeChampions () {
    for (var k = 0; k < this.championsToBeRemoved.length; k++) {
        this._removeChampion(this.championsToBeRemoved[k]);
    }

    this.championsToBeRemoved = [];
};

Board.prototype._removeChampion = function _removeChampion (champion) {
    this.tiles[champion.column][champion.row] = undefined;
    this.champions.splice(this.champions.indexOf(champion), 1);
};

Board.prototype.addChampion = function (position, champion) {
    this.tiles[position.column][position.row] = champion;
    this.champions.push(champion);

    champion.column = position.column;
    champion.row = position.row;

    champion.board = this;
    champion.team = position.row >= 4 ? this.TEAM_BOTTOM : this.TEAM_TOP;
};


Board.prototype.updateOneTick = function updateOneTick (MS_PER_TICK) {
    this.champions.sort((c, c2) => {
        return c.getRange() - c2.getRange(); 
    });

    // TODO: I think riot does it bad, and updates every champion once, but this might need more testing
    // better would be to first do movement and then targeting/autoattacking
    for (var key = 0; key < this.champions.length; key++) {
        this.champions[key].updateMovement(MS_PER_TICK);
        this.champions[key].updateChampionTarget(MS_PER_TICK);
        this.champions[key].updateAutoAttack(MS_PER_TICK);
        this.champions[key].updateOtherCooldowns(MS_PER_TICK);
    }
    
    for (var key = 0; key < this.entities.length; key++) {
        this.entities[key].updateOneTick(MS_PER_TICK);
    }

    this.removeEntities();
    this.removeChampions();
};

Board.prototype.hexCoordsFromChampion = function hexCoordsFromChampion (champ) {
    return this.hexCoords(champ.row, champ.column);
};

Board.prototype.hexCoords = function hexCoords (row, column) {
    return {
        x: column * this.TILESIZE + row % 2 * this.TILESIZE / 2,
        y: row * this.TILESIZE * 0.84,
    };
};

Board.prototype.toGridPosition = function toGridPosition (champ) {
    var coords = this.hexCoords(champ.row, champ.column);
    return new Victor(coords.x, coords.y);
};

Board.prototype.getTouchingChamps = function getTouchingChamps (position, radius) {
    var touching = [];
    var radiusSquared = radius * radius + ((this.TILESIZE / 2) * (this.TILESIZE / 2));

    for (var k = 0; k < this.champions.length; k++) {
        if (this.inDistanceSquared(position, this.hexCoordsFromChampion(this.champions[k]), radiusSquared))
            touching.push(this.champions[k]);
    }

    return touching;
};

Board.prototype.inDistanceSquared = function inDistanceSquared (pos, pos2, radiusSquared) {
    return (pos.x - pos2.x) * (pos.x - pos2.x) + (pos.y - pos2.y) * (pos.y - pos2.y) <= radiusSquared;
};

Board.prototype.getDirectionToChamp = function getDirectionToChamp (source, target) {
    var sourceCoords = this.hexCoords(source.row, source.column);
    var targetCoords = this.hexCoords(target.row, target.column);

    return new Victor(
        targetCoords.x - sourceCoords.x,
        targetCoords.y - sourceCoords.y
    ).normalize();
};

Board.prototype.isChampionInRange = function isChampionInRange (champion, champion2, range) {
    return offset_distance(champion, champion2) <= range;
};

Board.prototype.getClosestEnemyChampions = function getClosestEnemyChampions (champion) {
    var closestRange = Infinity;
    var closestChamps = [];

    for (var k = 0; k < this.champions.length; k++) {
        if (this.champions[k].team != champion.team) {
            var dist = offset_distance(champion, this.champions[k]);

            if (dist < closestRange) {
                closestChamps = [this.champions[k]];
                closestRange = dist;
            } else if (dist == closestRange) {
                closestChamps.push(this.champions[k]);
            }
        }
    }

    return closestChamps;
};

Board.prototype.getClosestEnemyChampionsInRange = function getClostsEnemyChampionsInRange (champion, range) {
    var closestRange = Infinity;
    var closestChamps = [];

    for (var k = 0; k < this.champions.length; k++) {
        if (this.champions[k].team != champion.team) {
            var dist = offset_distance(champion, this.champions[k]);

            if (dist <= range && dist < closestRange) {
                closestChamps = [this.champions[k]];
                closestRange = dist;
            } else if (dist <= range && dist == closestRange) {
                closestChamps.push(this.champions[k]);
            }
        }
    }

    return closestChamps;
};

Board.prototype.getRandomClosestEnemyChampionInRange = function getRandomClosestEnemyChampionInRange (champion, range) {
    var champs = this.getClosestEnemyChampionsInRange(champion, range);
    return champs[Math.floor(champs.length * Math.random())];
};

Board.prototype.getRandomClosestEnemyChampion = function getRandomClosestEnemyChampion (champion) {
    var champs = this.getClosestEnemyChampions(champion);
    return champs[Math.floor(champs.length * Math.random())];
};

// Finds a path to the target
// Currently uses a naive breadth first search, should be good enough
// Does not return source in the path
Board.prototype.getPathToChampionInRange = function getPathToChampionInRange (source, target, range) {
    function hashTile (tile) { return tile.column + "-" + tile.row; }

    var frontier = []
    frontier.push(source);

    var came_from = {}
    came_from[hashTile(source)] = source;

    var current;

    while (frontier.length > 0) {
        current = frontier.shift();
        var neighbours = this.oddr_empty_offset_neighbours(current);
     
        for(var i = 0; i < neighbours.length; i++) {
            var next = neighbours[i];
            if (this.tiles[next.column][next.row]) continue;
            if (this.isChampionInRange(next, target, range)) return createPath(next, current);

            if (!came_from[hashTile(next)]) {
                frontier.push(next);
                came_from[hashTile(next)] = current;
            }
        }
    }
   
    function createPath(last, current) {
        var path = [last];
        var key = hashTile(current);
        var sourcekey = hashTile(source);
    
        while (key != sourcekey) {
            path.unshift(current);
            current = came_from[key];
            key = hashTile(current);
        }
    
        return path;
    }
    
    return [];
};

Board.prototype.move = function move (champion, tile) {
    this.tiles[champion.column][champion.row] = undefined;
    this.tiles[tile.column][tile.row] = champion;
    champion.column = tile.column;
    champion.row = tile.row;
};

var oddr_directions = [
    [[+1,  0], [ 0, -1], [-1, -1], 
     [-1,  0], [-1, +1], [ 0, +1]],
    [[+1,  0], [+1, -1], [ 0, -1], 
     [-1,  0], [ 0, +1], [+1, +1]],
]

Board.prototype.oddr_empty_offset_neighbours = function oddr_empty_offset_neighbours(hex) {
    var parity = hex.row % 2;
    var neighbours = [];

    for (var direction = 0; direction < oddr_directions[parity].length; direction++) {
        var dir = oddr_directions[parity][direction];
        var neighbour = {column: hex.column + dir[0], row: hex.row + dir[1] }

        if (neighbour.column >= 0 && neighbour.row >= 0 && neighbour.column < this.WIDTH && neighbour.row < this.HEIGHT)
            neighbours.push(neighbour);
    }

    return neighbours;
};


function Cube (q, r, s) {
    if (Math.round(q + r + s) !== 0) throw "q + r + s must be 0";
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

/*





// EQUIVALENT, TODO: FIGURE OUT PERFORMANCE IF NEEDED


function cube_distance(a, b):
    return max(abs(a.x - b.x), abs(a.y - b.y), abs(a.z - b.z))



var cube_directions = [
    Cube(+1, -1, 0), Cube(+1, 0, -1), Cube(0, +1, -1), 
    Cube(-1, +1, 0), Cube(-1, 0, +1), Cube(0, -1, +1), 
]

function cube_direction(direction) { return cube_directions[direction] };
function cube_neighbor(cube, direction) { return cube_add(cube, cube_direction(direction)) };
function cube_add(cube1, cube2) { return Cube(cube1.q + cube2.q, cube1.r + cube2.r, cube1.s + cube2.s); };
function cube_scale(cube, factor) { return Cube(cube.q * factor, cube.r * factor, cube1.s * factor); };


function cube_ring(center, radius) {
    var results = [];
    var cube = cube_add(center, cube_scale(cube_direction(4), radius));

    for (var i = 0; i < 6; i++)
        for (var j = 0; j < radius; j++)
            results.append(cube)
            cube = cube_neighbor(cube, i)

    return results
};

*/
function GUI (simulator) {
    this.target;
    this.board = new GUIBoard();
    this.interface = new GUIInterface();
    this.simulator = simulator;

    this.lastFrame;
}

GUI.prototype.simulateRealTime = function simulateRealTime () {
    var self = this;

    if (self.lastFrame) throw "Starting simulation twice";    
    self.lastFrame = Date.now();

    function loop () {
        var passed = Date.now() - self.lastFrame;
        self.lastFrame += passed;    
        self.simulateMilliseconds(passed);
        requestAnimationFrame(loop);
    }

    return requestAnimationFrame(loop);;
}

GUI.prototype.simulateMilliseconds = function simulateMilliseconds (ms) {
    this.simulator.updateMilliseconds(ms);
    this.board.updateFromBoard(this.simulator.board);
};

GUI.prototype.createGUI = function (target) {
    this.target = target;
    this._createBoard(target);
    this.interface.setTarget(target);
};

GUI.prototype._createBoard = function createBoard (target) {
    target.appendChild(this.board.createTiles());
    var tiles = target.querySelectorAll(".hexagon").forEach((tile) => {
        tile.addEventListener("click", (event) => {
            this._onTileClick(event);
        });
    });
};

GUI.prototype._onTileClick = function _onTileClick (event) {
    console.log(event);

    var realTarget = event.target;
    for (var k = 0; k < event.path.length; k++) {
        if (event.path[k].classList.contains('hexagon')) {
            realTarget = event.path[k];
            break;
        }
    }

    this.interface
    .askChampionDialog({
        x: event.clientX,
        y: event.clientY
    })
    .then((championData) => {
        var champion = new Champion(championData);
        this.board.setChampionOnTile(realTarget, champion);
        this.simulator.board.addChampion(realTarget, champion);
    });
};



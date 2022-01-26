function Simulator () {
    this.board = new Board();
    this.MS_PER_TICK = 50;

    this.msStored = 0;
}

// Updates a given amount of ticks taking into account the given milliseconds and uses the stored milliseconds
// Stores unused milliseconds
Simulator.prototype.updateMilliseconds = function updateMilliseconds (timeStep) {
    var ticks = Math.floor((timeStep + this.msStored) / this.MS_PER_TICK);
    this.msStored = Math.max(0, timeStep + this.msStored - (ticks * this.MS_PER_TICK));

    for (var i = 0; i < ticks; i++) {
        this.updateOneTick();
    }
};

Simulator.prototype.updateOneTick = function updateOneTick () {
    this.board.updateOneTick(this.MS_PER_TICK);
};
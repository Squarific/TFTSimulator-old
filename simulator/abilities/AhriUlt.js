function AhriUlt (sourceChamp) {
    this.name = "ahriult";
    this.HALF_WAY_COOLDOWN = 1000;
    this.TILE_LENGTH = 5;
    this.SPEED = this.TILE_LENGTH / this.HALF_WAY_COOLDOWN * sourceChamp.board.TILESIZE;
    this.DAMAGE = [175, 250, 375];

    this.champsAlreadyHit = [];

    this.sourceChamp = sourceChamp;
    this.startRow = sourceChamp.row;
    this.startColumn = sourceChamp.column;

    if (sourceChamp.targetEnemy)
        this.direction = sourceChamp.board.getDirectionToChamp(sourceChamp, sourceChamp.targetEnemy);
    else
        this.direction = new Victor(1, 0);

    this.speedVector = this.direction.multiply(new Victor(this.SPEED, this.SPEED));

    this.halfWayCooldown = this.HALF_WAY_COOLDOWN;
    this.returning = false;

    this.position = sourceChamp.board.toGridPosition(sourceChamp);

    console.log(this.position);
    console.log("Speedvector", this.speedVector);
}

AhriUlt.prototype.updateOneTick = function updateOneTick (MS_PER_TICK) {
    this.position.add((new Victor(MS_PER_TICK, MS_PER_TICK)).multiply(this.speedVector));
    this.halfWayCooldown -= MS_PER_TICK;

    if (this.halfWayCooldown <= 0) {
        if (this.returning) {
            this.sourceChamp.board.removeEntity(this);
        } else {
            this.returning = true;
            this.halfWayCooldown = this.HALF_WAY_COOLDOWN;
            this.speedVector.multiply(new Victor(-1, -1));
            this.champsAlreadyHit = [];
        }
    }

    var champs = this.sourceChamp.board.getTouchingChamps(this.position, this.sourceChamp.board.TILESIZE / 2);
    for (var k = 0; k < champs.length; k++) {
        if (this.sourceChamp.team !== champs[k].team && this.champsAlreadyHit.indexOf(champs[k]) == -1) {
            this.champsAlreadyHit.push(champs[k]);
            this.hitChampion(champs[k]);
            console.log(this.champsAlreadyHit)
        }
    }
};

AhriUlt.prototype.hitChampion = function hitChampion (champ) {
    if (this.returning) {
        champ.takeMagicalDamage(this.DAMAGE[this.sourceChamp.level]);
    } else {
        champ.takeTrueDamage(this.DAMAGE[this.sourceChamp.level]);
    }
};
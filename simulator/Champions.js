function Champion (props, board, team) {
    this.name = props.name;
    this.board = board;
    this.team = team;

    /* Base stats */
    this.baseHealth = props.baseHealth;
    this.baseMaxMana = props.baseMaxMana;
    this.baseStartMana = props.baseStartMana;

    this.baseArmor = props.baseArmor;
    this.baseMagicResist = props.baseMagicResist;

    this.baseAttackDamage = props.baseAttackDamage;
    this.baseAttackRange = props.baseAttackRange;
    this.baseAttackSpeed = props.baseAttackSpeed;
    this.baseCritChance = props.baseCritChance;

    this.baseMovementSpeed = [500, 500, 500]; // 1hex = 250
    this.HEX_SIZE = 250;

    /* Level */
    this.level = props.level || 0;

    this.traits = props.traits;

    this.items = [];

    this.targetEnemy;
    this.moving;
    this.attackCooldown = this.getAttackCooldown();

    this.currentHealth = this.baseHealth[this.level];
    this.currentMana = this.baseStartMana[this.level];
}

Champion.prototype.abilities = {
    "Ahri": function (self) {
        self.board.addEntity(new AhriUlt(self));
        self.manaGenerationCooldown = 1000;
    }
};

Champion.prototype.getMaxHealth = function getMaxHealth () {
    return this.baseHealth[this.level];
};

Champion.prototype.getMaxMana = function getMaxMana () {
    return this.baseMaxMana[this.level];
};

Champion.prototype.ability = function ability () {
    if (!this.abilities[this.name]) throw "No ability implemented for " + this.name;
    this.abilities[this.name](this);
};

Champion.prototype.addItem = function addItem () {

};

// Updates the target, returns if we are chasing or not
// Do not call if moving
Champion.prototype.updateChampionTarget = function updateChampionTarget (MS_PER_TICK) {
    if (this.moving) return this.chasing;

    // If we are already attacking someone and they are in range, no reason to move
    if (this.targetEnemy && !this.targetEnemy.died && this.board.isChampionInRange(this, this.targetEnemy, this.getRange())) return this.chasing = false;

    // If we are already attacking someone and they are not in range, we move in range, but only once, so we mark that we are chasing
    if (this.targetEnemy && !this.targetEnemy.died && !this.chasing) return this.chasing = true;

    // No enemy yet, lets assign one
    this.targetEnemy = this.board.getRandomClosestEnemyChampion(this);

    // Is the new enemy out of range? Then we instantly start chasing
    // THIS IS AN EDGE CASE WE COULD TEST TO SEE IF RIOT HAS BUGS
    if (this.targetEnemy && !this.targetEnemy.died && !this.board.isChampionInRange(this, this.targetEnemy, this.getRange())) return this.chasing = true;

    return this.chasing = false;
};

Champion.prototype.updateMovementTarget = function updateMovementTarget (MS_PER_TICK) {
    if (!this.targetEnemy || this.targetEnemy.died) return;
    if (this.board.isChampionInRange(this, this.targetEnemy, this.getRange())) return; // Here we waste some speed

    var path = this.board.getPathToChampionInRange(this, this.targetEnemy, this.getRange());
    if (!path[0]) return;
    this.move(path[0], MS_PER_TICK);
};

Champion.prototype.updateMovement = function updateMovement (MS_PER_TICK) {
    if (!this.moving) return this.updateMovementTarget();

    this.moveCoolDown -= MS_PER_TICK;

    if (this.moveCoolDown < 0) {
        this.moving = false;
    }
};

// Move to an adjacent tile
// ONLY GIVE ADJACENT TILES, NO CHECK IS DONE TO SEE IF THIS IS THE CASE
// DOES NOT WORK IF GIVEN MORE TILES
Champion.prototype.move = function move (tile, MS_PER_TICK) {
    this.board.move(this, tile);
    this.moveCoolDown = 1000 / (this.baseMovementSpeed[this.level] / this.HEX_SIZE);
    this.moving = true;
};

Champion.prototype.getAttackCooldown = function getAttackCooldown () {
    return 1000 / this.baseAttackSpeed[this.level];
};

Champion.prototype.updateAutoAttack = function updateAutoAttack (MS_PER_TICK) {
    if (this.moving) return;
    this.attackCooldown -= MS_PER_TICK;

    if (this.attackCooldown <= 0) {
        if (this.autoAttack(MS_PER_TICK)) {
            this.attackCooldown = this.getAttackCooldown();
        }
    }
};

Champion.prototype.getValidAutoAttackTarget = function getValidAutoAttackTarget () {
    if (this.targetEnemy && !this.targetEnemy.died && this.board.isChampionInRange(this, this.targetEnemy, this.getRange()))
        return this.targetEnemy;
};

Champion.prototype.getRange = function getRange () {
    return this.baseAttackRange[this.level];
};

Champion.prototype.autoAttack = function autoAttack (MS_PER_TICK) {
    var enemy = this.getValidAutoAttackTarget();
    if (!enemy) return false;

    if (this.shouldCrit())
        enemy.receiveCritAutoAttack(this);
    else
        enemy.receiveAutoAttack(this);

    this.generateMana(10);
    
    return true;
};

Champion.prototype.shouldCrit = function shouldCrit () {
    return Math.random() < this.baseCritChance[this.level];
};

Champion.prototype.receiveCritAutoAttack = function receiveCritAutoAttack (champion) {
    var damage = champion.calculateAutoAttackDamage() * 1.5;
    this.takePhysicalDamage(damage);
};


Champion.prototype.receiveAutoAttack = function receiveAutoAttack (champion) {
    var damage = champion.calculateAutoAttackDamage();
    this.takePhysicalDamage(damage);
};

Champion.prototype.takeMagicalDamage = function takeMagicalDamage (premitigatedDamage) {
    var multiplier = 100 / (100 + this.calculateMagicResist());
    this._takeDamage(premitigatedDamage * multiplier);
    this.generateMana(Math.min(42.5, premitigatedDamage / 10));
};

Champion.prototype.takePhysicalDamage = function takePhysicalDamage (premitigatedDamage) {
    var multiplier = 100 / (100 + this.calculateArmor());
    this._takeDamage(premitigatedDamage * multiplier);
    this.generateMana(Math.min(42.5, premitigatedDamage / 10));
};

Champion.prototype.takeTrueDamage = function takeTrueDamage (premitigatedDamage) {
    this._takeDamage(premitigatedDamage);
    this.generateMana(Math.min(42.5, premitigatedDamage / 10));
};

Champion.prototype.generateMana = function generateMana (mana) {
    if (this.manaGenerationCooldown > 0) return;

    this.currentMana += mana;

    if (this.currentMana >= this.getMaxMana()) {
        this.currentMana = 0;
        this.ability();
    }
};

Champion.prototype.updateOtherCooldowns = function updateOtherCooldowns (MS_PER_TICK) {
    this.manaGenerationCooldown -= MS_PER_TICK;
};

Champion.prototype._takeDamage = function _takeDamage (damage) {
    this.currentHealth -= damage;
    if (this.currentHealth <= 0) this.die(); 
};

Champion.prototype.die = function die () {
    this.died = true;
    this.board.removeChampion(this);
};

Champion.prototype.calculateArmor = function calculateArmor () {
    return this.baseArmor[this.level];
};

Champion.prototype.calculateMagicResist = function calculateMagicResist () {
    return this.baseMagicResist[this.level];
};

Champion.prototype.calculateAutoAttackDamage = function calculateAutoAttackDamage () {
    return this.baseAttackDamage[this.level];
};

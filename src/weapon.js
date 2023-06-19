import * as game from './core/game.js'
import * as vec3 from './core/vector3.js'

export class Weapon {
  attackPeriod = 30
  attackTime = 0

  constructor() {
    this.deploy()
  }

  canAttack() {
    return this.attackTime < 0
  }

  attack() {
    this.attackTime = this.attackPeriod
  }

  update() {
    this.attackTime --
  }

  deploy() {
    this.attackTime = 0
  }

  holster() {

  }
}

export class Pistol extends Weapon {
  attackPeriod = 20

  attack() {
    super.attack()

    const terrain = game.getThing('terrain')

    // TODO: Raytrace over entities as well so we can deal damage to them
    // It should check whether the terrain impact or entity impact had a closer distance
  }
}

/* global Image */

import * as u from './utils.js'
import * as game from './game.js'

export default class Thing {
  // visual settings
  sprite = null
  rotation = 0
  scale = [1, 1]
  depth = 0

  // collision and movement
  position = [0, 0]
  velocity = [0, 0]
  aabb = [-32, -32, 32, 32]
  contactDirections = { left: false, right: false, up: false, down: false }
  isCollisionEnabled = true // can other things detect my presence
  isSolid = false // stop movement of other things
  movementPushback = 0.0001 // after a collision is detected, move back by this much

  // animation
  animations = { idle: { frames: [0], speed: 0 } }
  animation = 'idle'
  lastAnimation = 'idle'
  animationIndex = 0
  timers = []

  // whether this thing can persist between scene changes
  isPersistent = false

  /********************************************************************************
     scene events
  ********************************************************************************/

  update () {
    this.updateTimers()
    this.move()
    this.animate()
  }

  draw (x = this.position[0], y = this.position[1], xOffset = 0, yOffset = 0) {
    const anim = this.animations[this.animation] || this.animations.idle || { frames: [0] }
    const frame = anim.frames[Math.floor(this.animationIndex) % anim.frames.length]
    const { ctx } = game

    ctx.save()
    ctx.translate(x, y)
    if (typeof this.scale === 'number') {
      ctx.scale(this.scale, this.scale)
    } else {
      ctx.scale(...this.scale)
    }
    ctx.rotate(this.rotation)
    this.drawSprite(ctx, frame, xOffset, yOffset, anim.frameSize || 64)
    ctx.restore()
  }

  preDraw () {}

  postDraw () {}

  onDeath () {}

  onUnload () {}

  /********************************************************************************
     timer handling
  ********************************************************************************/

  after (time, action, name) {
    if (name) {
      this.timers[name] = { time, start: time, action }
    } else {
      this.timers.push({ time, start: time, action })
    }
  }

  updateTimers () {
    for (const [name, value] of Object.entries(this.timers)) {
      value.time -= 1
      if (value.time <= 0) {
        if (typeof value.action === 'function') value.action()

        if (Number(name) === name) {
          this.timers.splice(Number(name), 1)
        } else {
          delete this.timers[name]
        }
      }
    }
  }

  timer (name, fraction = true) {
    if (!this.timers[name]) return 0
    if (!fraction) return this.timers[name].start - this.timers[name].time
    return 1 - this.timers[name].time / this.timers[name].start
  }

  cancelTimer (name) {
    if (this.timers[name]) {
      delete this.timers[name]
    }
  }

  /********************************************************************************
     basic animation
  ********************************************************************************/

  animate () {
    const anim = this.animations[this.animation] || this.animations.idle

    // option to restart the animation on change
    if (this.animation !== this.lastAnimation && anim.restart) {
      this.animationIndex = 0
    }
    this.lastAnimation = this.animation

    this.animationIndex += anim.speed ?? 0

    // option to not repeat the animation
    if (anim.noRepeat) {
      this.animationIndex = Math.min(this.animationIndex, anim.frames.length - 1)
    } else {
      this.animationIndex %= anim.frames.length
    }
  }

  drawSprite (ctx, frame = 0, x = 0, y = 0, frameSize = 64) {
    let sprite = this.sprite
    if (!sprite) return
    if (typeof sprite === 'string') {
      sprite = game.assets.images[sprite]
    }
    ctx.translate(-frameSize / 2, -frameSize / 2)
    const framePosition = frame * frameSize
    ctx.drawImage(
      sprite,
      framePosition % sprite.width,
      Math.floor(framePosition / sprite.width) * frameSize,
      frameSize,
      frameSize,
      x,
      y,
      frameSize,
      frameSize
    )
  }

  /********************************************************************************
     movement and collision handling
  ********************************************************************************/

  move (dx = this.velocity[0], dy = this.velocity[1], stepSize = 1) {
    for (const key in this.contactDirections) this.contactDirections[key] = false
    const { sign } = u

    while (Math.round(dx * 1000)) {
      const step = sign(dx) * Math.min(Math.abs(dx), stepSize)
      if (this.checkCollision(this.position[0] + step, this.position[1])) {
        this.velocity[0] = 0
        this.position[0] = Math.round(this.position[0]) - sign(dx) * this.movementPushback
        if (sign(dx) > 0) this.contactDirections.right = true
        if (sign(dx) < 0) this.contactDirections.left = true
        break
      }
      this.position[0] += step
      dx -= step
    }

    while (Math.round(dy * 1000)) {
      const step = sign(dy) * Math.min(Math.abs(dy), stepSize)
      if (this.checkCollision(this.position[0], this.position[1] + step)) {
        this.velocity[1] = 0
        this.position[1] = Math.round(this.position[1]) - sign(dy) * this.movementPushback
        if (sign(dy) > 0) this.contactDirections.down = true
        if (sign(dy) < 0) this.contactDirections.up = true
        break
      }
      this.position[1] += step
      dy -= step
    }
  }

  // put this thing's Aabb in terms the SpatialHash understands
  aabbSpatialHash () {
    const a = this.aabb
    const p = this.position
    return [a[0] + p[0], a[1] + p[1], a[2] - a[0], a[3] - a[1]]
  }

  checkAabbIntersection (thing, x = this.position[0], y = this.position[1]) {
    return u.checkAabbIntersection(this.aabb, thing.aabb, x, y, ...thing.position)
  }

  // returns all things which have overlapping bounding boxes with this thing
  getAllBroadPhaseThingCollisions (x = this.position[0], y = this.position[1]) {
    return (
      game.getThingsInAabb(
        x + this.aabb[0],
        y + this.aabb[1],
        this.aabb[2] - this.aabb[0],
        this.aabb[3] - this.aabb[1]
      ).filter(thing => {
        if (thing === this || !thing.isCollisionEnabled) return false
        return this.checkAabbIntersection(thing, x, y)
      })
    )
  }

  // returns a list of things which pass both broad and narrow phase collisions
  getAllThingCollisions (x = this.position[0], y = this.position[1]) {
    return this.getAllBroadPhaseThingCollisions(x, y).filter(thing => (
      this.checkNarrowPhaseThingCollision(thing, x, y) &&
      thing.checkNarrowPhaseThingCollision(this, x, y)
    ))
  }

  // first get all broad phase collisions
  // then see if any of them are colliding with narrow phase
  checkThingCollision (x = this.position[0], y = this.position[1]) {
    return this.getAllBroadPhaseThingCollisions(x, y).some(thing => (
      this.checkShouldCollideWithThing(thing) && thing.checkNarrowPhaseThingCollision(this, x, y)
    ))
  }

  // overload me!
  checkShouldCollideWithThing (thing) {
    return thing.isSolid
  }

  // overload me!
  checkCustomCollision () {
    return false
  }

  // overload me!
  checkNarrowPhaseThingCollision () {
    return true
  }

  checkCollision (x = this.position[0], y = this.position[1]) {
    return this.checkThingCollision(x, y) || this.checkCustomCollision(x, y)
  }
}

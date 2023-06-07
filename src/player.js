import {
  ctx,
  globals,
  mouse,
} from './core/game.js'
import * as game from './core/game.js'
import Thing from './core/thing.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as u from './core/utils.js'
import { assets } from './core/game.js'
import * as vec3 from './core/vector3.js'
import * as vec2 from './core/vector2.js'

export default class Player extends Thing {
  height = 3.6
  onGround = false
  wasOnGround = false
  aabb = [-16, -16, 16, 16]
  cameraTarget = [0, 0, 0]
  cameraLookAhead = 64
  moveDirection = [1, 0, 0]
  forward = [1, 0, 0]
  width = 0.9
  canDash = true
  wannaJump = 0
  coyoteFrames = 0
  staircaseOffset = 0
  lastFallSpeed = 0
  time = 0
  showGui = true // cutscenes set this to false
  deliveredCount = 0
  sprite = null
  // framebuffer = gfx.gl.createFramebuffer()
  depth = -10000
  stepCounter = 0
  lastPosition = [0, 0, 0]
  walkFrames = 0
  walkFrameAccel = 0

  constructor (position = [0, 0, 0], angle = 0) {
    super()

    this.position = position
    game.getCamera3D().position = [...this.position]
    game.getCamera3D().lookVector = vec3.anglesToVector(angle, 0.25)

    this.spawnPosition = [...this.position]
    this.velocity = [0, 0, 0]
    // this.direction = 0
    // this.lookDirection = 0

    game.setThingName(this, 'player')
  }

  update () {
    this.time ++

    // TEMP Put the player back on top of the level if they fall off
    if (this.position[2] < this.spawnPosition[2] - 50) {
      this.position = [...this.spawnPosition]
      this.velocity = [0, 0, 0]
    }

    // Walking
    let dx = !!game.keysDown.KeyD - !!game.keysDown.KeyA
    let dy = !!game.keysDown.KeyS - !!game.keysDown.KeyW

    // Counter for view bobbing
    if (Math.abs(dx) + Math.abs(dy) > 0) {
      this.walkFrameAccel = 0.08
    } else {
      this.walkFrameAccel = Math.max(this.walkFrameAccel - 0.002, 0)
    }
    this.walkFrames += this.walkFrameAccel
    this.walkFrames = this.walkFrames % (Math.PI * 2)

    // Normalize movement so diagonals aren't faster
    if (u.distance2d(0, 0, dx, dy) > 1) {
      [dx, dy] = vec2.normalize([dx, dy])
    }

    // Calculate acceleration on each axis
    let yaw = vec3.vectorToAngles(game.getCamera3D().lookVector)[0] - Math.PI / 2
    const xAccelNorm = Math.cos(yaw) * dx - Math.sin(yaw) * dy
    const yAccelNorm = Math.sin(yaw) * dx + Math.cos(yaw) * dy

    // Friction should be lower when accelerating than when decelerating
    const dp = vec2.dotProduct(vec2.normalize(this.velocity), [xAccelNorm, yAccelNorm])
    const slip = u.map(dp, -1, 1, 0.9, 0.6)

    let friction = 0.9
    let groundAccel = 0.0394375
    let airAccel = 0.025

    // Apply slip
    groundAccel *= slip
    airAccel *= slip
    friction = 1 - ((1-friction)*slip)

    const moveAccel = this.onGround ? groundAccel : airAccel
    const maxSpeed = groundAccel / (1 - friction)

    // Apply friction
    if (this.onGround) {
      this.velocity[0] *= friction
      this.velocity[1] *= friction
    }

    // Scale accel
    const xAccel = xAccelNorm * moveAccel
    const yAccel = yAccelNorm * moveAccel

    this.moveDirection = vec3.normalize([xAccel, yAccel, 0])
    this.forward = vec3.normalize([Math.sin(yaw), Math.cos(yaw), 0])

    // Don't move if in air and air control is disabled
    if (this.onGround || !this.timer('disableAirControl')) {
      // Apply movement acceleration
      const lastMagnitude = vec2.magnitude(this.velocity)
      this.velocity[0] += xAccel
      this.velocity[1] += yAccel
      const newMagnitude = vec2.magnitude(this.velocity)

      // If player is at or above max speed, don't let them increase their speed.
      // They can change the direction of their velocity, but not increase the magnitude.
      if (u.distance2d(0, 0, this.velocity[0] + xAccel, this.velocity[1] + yAccel) >= maxSpeed) {
        this.velocity[0] *= lastMagnitude / newMagnitude
        this.velocity[1] *= lastMagnitude / newMagnitude
      }
    }

    // Falling due to gravity
    let grav = this.velocity[2] < 0 ? 0.019 : 0.011
    this.velocity[2] -= grav

    if (this.onGround) {
      this.cancelTimer('disableAirControl')

      // land
      if (!this.wasOnGround && this.lastFallSpeed < -5) {
        const sound = assets.sounds.playerLand
        sound.volume = 0.1
        sound.playbackRate = u.random(1, 1.2)
        sound.currentTime = 0
        sound.play()
      }
    } else {
      this.lastFallSpeed = this.velocity[2]
    }

    // falling and jumping
    if (game.keysPressed.Space) {
      this.wannaJump = 6
    }
    if (this.onGround) {
      this.coyoteFrames = 10
    }

    const jump = () => {
      this.velocity[2] = 0.29
      this.wannaJump = 0
      this.coyoteFrames = 0
      // const sound = assets.sounds.playerJump
      // sound.volume = 0.2
      // sound.playbackRate = u.random(1, 1.2)
      // sound.currentTime = 0
      // sound.play()
    }

    if (this.wannaJump && this.coyoteFrames) {
      jump()
    }

    if (this.wannaJump) {
      const closestWall = this.getClosestWall()
      if (closestWall) {
        const kickSpeed = 8
        this.velocity[0] += closestWall.normal[0] * kickSpeed
        this.velocity[1] += closestWall.normal[1] * kickSpeed
        this.after(20, null, 'disableAirControl')
        jump()
      }
    }

    if (!game.keysDown.Space && this.velocity[2] >= 0) {
      this.velocity[2] /= 1.25
    }
    if (this.position[2] < 0) {
      // assets.sounds.playerSplash.play()
      // resetScene()
    }
    this.wannaJump = Math.max(this.wannaJump - 1, 0)
    this.coyoteFrames = Math.max(this.coyoteFrames - 1, 0)
    this.staircaseOffset = Math.max(this.staircaseOffset - 0.2, 0)
    this.disableAirControl = Math.max(this.disableAirControl - 1, 0)
    this.disableAirControl = Math.max(this.disableAirControl - 1, 0)

    // shooting
    if (mouse.leftClick && !this.timer('shoot') && false) {
      this.after(16, () => {}, 'shoot')
      this.after(12, () => {}, 'fire')
      const look = vec3.scale(game.getCamera3D().lookVector, -1)
      const side = vec3.crossProduct([0, 0, 1], look)
      let pos = vec3.add(this.position, vec3.scale(side, 16))
      pos = vec3.add(pos, [0, 0, -14])

      if (globals.powerup === 'shotgun') {
        // Animation and Timing
        this.after(24, () => {}, 'shoot')
        this.after(30, () => {}, 'fire')

        // Create bullets
        for (let i = 0; i < 6; i++) {
          const r = 0.15
          let dir = vec3.add(look, [u.random(-r, r), u.random(-r, r), u.random(-r, r)])
          dir = vec3.normalize(dir)
          game.addThing(new Bullet(pos, dir, 28, this))
        }
        // Guarantee that one bullet will go straight ahead
        game.addThing(new Bullet(pos, look, 28, this))

        // Sound effect
        const sound = assets.sounds.shotgun
        sound.playbackRate = u.random(1, 1.3)
        sound.currentTime = 0
        sound.volume = 0.6
        sound.play()

        this.velocity[0] -= look[0] * 4.5
        this.velocity[1] -= look[1] * 4.5
        this.velocity[2] -= look[2] * 2.5
      } else if (globals.powerup === 'machinegun') {
        // Animation and Timing
        this.after(7, () => {}, 'shoot')
        this.after(4, () => {}, 'fire')

        // Create bullet
        const r = 0.1
        let dir = vec3.add(look, [u.random(-r, r), u.random(-r, r), u.random(-r, r)])
        dir = vec3.normalize(dir)
        game.addThing(new MachineGunBullet(pos, dir, 22, this))

        // Sound effect
        const sound = assets.sounds.machinegun
        sound.playbackRate = u.random(1, 1.3)
        sound.currentTime = 0
        sound.volume = 0.6
        sound.play()

        this.velocity[0] -= look[0] * 0.9
        this.velocity[1] -= look[1] * 0.9
        this.velocity[2] -= look[2] * 0.5
      } else if (globals.powerup === 'rifle') {
        // Animation and Timing
        this.after(24, () => {}, 'shoot')
        this.after(30, () => {}, 'fire')

        // Create bullet
        game.addThing(new Bullet(pos, look, 90, this))
        game.addThing(new Bullet(vec3.add(pos, vec3.scale(look, 10)), look, 90, this))
        game.addThing(new Bullet(vec3.add(pos, vec3.scale(look, 20)), look, 90, this))
        game.addThing(new Bullet(vec3.add(pos, vec3.scale(look, 30)), look, 90, this))
        game.addThing(new Bullet(vec3.add(pos, vec3.scale(look, 40)), look, 90, this))

        const sound = assets.sounds.machinegun
        sound.playbackRate = u.random(1, 1.3)
        sound.currentTime = 0
        sound.volume = 0.6
        sound.play()

        this.velocity[0] -= look[0] * 3
        this.velocity[1] -= look[1] * 3
        this.velocity[2] -= look[2] * 1.5
      } else {
        // Animation and Timing
        this.after(16, () => {}, 'shoot')
        this.after(12, () => {}, 'fire')

        // Create bullet
        game.addThing(new Bullet(pos, look, 28, this))

        const sound = assets.sounds.machinegun
        sound.playbackRate = u.random(1, 1.3)
        sound.currentTime = 0
        sound.volume = 0.6
        sound.play()
        /*
        const sound = assets.sounds.pistolShoot
        sound.currentTime = 0
        sound.playbackRate = u.random(0.9, 1.1)
        sound.play()

        */

        this.velocity[0] -= look[0] * 3
        this.velocity[1] -= look[1] * 3
        this.velocity[2] -= look[2] * 1.5
      }
    }

    // step sounds
    // if (this.onGround) {
    //   this.stepCounter += vec2.magnitude(this.velocity)
    //   const interval = 150
    //   if (this.stepCounter > interval) {
    //     this.stepCounter -= interval
    //     const sound = u.choose(
    //       assets.sounds.footstep1,
    //       assets.sounds.footstep2
    //       // assets.sounds.footstep3
    //     )
    //     sound.playbackRate = u.random(0.9, 1.1)
    //     sound.volume = 0.25
    //     sound.currentTime = 0
    //     sound.play()
    //   }
    // }

    // Debug mode
    if (game.keysPressed.Backslash) {
      game.globals.debugMode = !game.globals.debugMode
    }

    this.moveAndCollide()
    this.updateTimers()
    this.cameraUpdate()
  }

  moveAndCollide () {
    this.position[0] += this.velocity[0]
    this.position[1] += this.velocity[1]
    this.position[2] += this.velocity[2]
    this.wasOnGround = this.onGround
    this.onGround = false

    // Get all colliders near the player
    const colliderList = game.getThing('terrain').query(this.position[0] - 2, this.position[1] - 2, this.position[2] - this.height, 4, 4, this.height + 4)

    // Floor collisions
    for (const collider of colliderList) {
      const { normal, points } = collider

      // Skip if not a floor
      if (normal[2] < 0.7) {
        continue
      }

      const position = [...this.position]
      position[2] -= this.height

      if (!vec3.isInsideTriangle(...points, [0, 0, 1], position)) {
        continue
      }

      const distance = vec3.distanceToTriangle(points[0], normal, position)
      if (distance > 0) continue
      if (distance < -2) continue

      const dot = vec3.dotProduct(this.velocity, normal)
      this.velocity[2] -= dot * normal[2]
      this.position[2] += normal[2] * (-1 * distance)
      this.onGround = true

      if (this.wasOnGround && distance < 0) {
        this.staircaseOffset = Math.min(
          this.staircaseOffset + Math.abs(distance),
          1.5
        )
      }
    }

    // Wall/ceiling collisions
    for (const collider of colliderList) {
      const { normal, points } = collider

      // Skip if not a wall/ceiling
      if (normal[2] >= 0.7) {
        continue
      }

      const fakeNormal = vec3.findMostSimilarVector(normal, [
        [0, 0, -1],
        [1, 0, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [0, -1, 0]
      ])

      const stepHeight = this.onGround ? 1.5 : 0.5
      for (let h = stepHeight; h <= 2; h += 0.5) {
        const position = [...this.position]
        position[2] += h - this.height

        if (!vec3.isInsideTriangle(...points, fakeNormal, position)) {
          continue
        }

        const distance = vec3.distanceToTriangle(points[0], normal, position)
        if (distance > this.width) continue
        if (distance < -1 * this.width) continue

        const dot = vec3.dotProduct(this.velocity, normal)
        if (dot < 0) {
          this.velocity[0] -= dot * normal[0]
          this.velocity[1] -= dot * normal[1]
          this.velocity[2] -= dot * normal[2]
        }
        const push = (this.width - distance) / 10
        this.position[0] += normal[0] * push
        this.position[1] += normal[1] * push
        this.position[2] += normal[2] * push
      }
    }
  }

  getClosestWall () {
    let closest = null
    let closestDistance = 0
    const position = vec3.add([...this.position], [0, 0, 48])
    position[2] -= this.height / 2

    for (const collider of game.getThing('terrain').query(this.position[0] - 64, this.position[1] - 64, 128, 128)) {
      const { normal, points } = collider
      if (normal[2] >= 0.7) continue

      if (!vec3.isInsideTriangle(...points, normal, position)) {
        continue
      }

      const distance = vec3.distanceToTriangle(points[0], normal, position)
      if (distance > this.width * 1.25) continue
      if (distance < -1 * this.width) continue

      let dot = Math.abs(vec3.dotProduct(this.moveDirection, normal))
      if (vec3.magnitude(this.moveDirection) === 0) {
        dot = Math.abs(vec3.dotProduct(this.forward, normal))
      }
      if (dot > closestDistance) {
        closestDistance = dot
        closest = collider
      }
    }

    return closest
  }

  cameraUpdate () {
    // Lock the mouse (allow mouse control of camera) if the user clicks
    if (mouse.leftClick) {
      mouse.lock()
    }

    // Camera control
    if (mouse.isLocked()) {
      const sensRange = 1.3
      const sens = 0.002 * Math.pow(sensRange, (globals.mouseSensitivity||0)-5)

      let yaw, pitch
      ;[yaw, pitch] = vec3.vectorToAngles(game.getCamera3D().lookVector)
      yaw += mouse.delta[0] * sens
      pitch += mouse.delta[1] * sens

      // TODO: Fix mouse control and remove arrow key controls
      if (game.keysDown.ArrowDown) {
        pitch += 0.03
      }
      if (game.keysDown.ArrowUp) {
        pitch -= 0.03
      }
      if (game.keysDown.ArrowLeft) {
        yaw -= 0.05
      }
      if (game.keysDown.ArrowRight) {
        yaw += 0.05
      }

      game.getCamera3D().lookVector = vec3.anglesToVector(yaw, pitch)
    }

    // Set camera position to player head
    game.getCamera3D().position = [
      this.position[0],
      this.position[1],
      this.position[2] - this.staircaseOffset,
    ]
  }

  // draw () {
  //   // Viewmodel
  //   gfx.setShader(assets.shaders.shaded)
  //   gfx.set('viewMatrix', [
  //     1, 0, 0, 0,
  //     0, 0, 2, 0,
  //     0, 1, 0, 0,
  //     0, 0, 0, 1
  //   ])

  //   let knockback = this.timer('fire') ? 1 - this.timer('fire') : 0
  //   knockback *= Math.PI / 4
  //   gfx.set('projectionMatrix', mat.getPerspective({ fovy: Math.PI / 4 }))

  //   // Bobbing
  //   const t = this.walkFrames
  //   const bobX = Math.sin(t) * 2 * 0.15
  //   const bobY = Math.cos(2 * t) * -0.5 * 0.15
  //   if (knockback > 0) {
  //     this.walkFrames = 0
  //   }

  //   // Animation
  //   if (globals.powerup === 'shotgun') {
  //     gfx.set('modelMatrix', mat.getTransformation({
  //       translation: [bobX - 2, -3 + knockback * 4, bobY - 2.3 - (knockback * 0.5)],
  //       rotation: [Math.PI*1.5 + knockback*0.3, Math.PI, 0],
  //       scale: 0.4
  //     }))
  //     gfx.setTexture(assets.textures.shotgun)
  //     gfx.drawMesh(assets.models.shotgun)
  //   } else if (globals.powerup === 'machinegun') {
  //     gfx.set('modelMatrix', mat.getTransformation({
  //       translation: [bobX - 2, -4.5 + knockback * 0.2, bobY - 2.6],
  //       rotation: [Math.PI*1.52 + knockback*0.1, Math.PI, 0.05],
  //       scale: 0.5
  //     }))
  //     gfx.setTexture(assets.textures.machinegun)
  //     gfx.drawMesh(assets.models.machinegun)
  //   } else if (globals.powerup === 'rifle') {
  //     gfx.set('modelMatrix', mat.getTransformation({
  //       translation: [bobX - 2, -5 + knockback * 3, bobY - 2.3 - (knockback * 0.5)],
  //       rotation: [Math.PI*1.5 + knockback*0.4, Math.PI, 0],
  //       scale: 0.4
  //     }))
  //     gfx.setTexture(assets.textures.rifle)
  //     gfx.drawMesh(assets.models.rifle)
  //   } else {
  //     gfx.set('modelMatrix', mat.getTransformation({
  //       translation: [bobX - 2, -4 + knockback * 0.2, bobY - 2.3 - (knockback * 0.5)],
  //       rotation: [Math.PI*1.5 + knockback, Math.PI, 0],
  //       scale: 0.4
  //     }))
  //     gfx.setTexture(assets.textures.pistol)
  //     gfx.drawMesh(assets.models.pistol)
  //   }
  // }

  postDraw () {
    // Exit if GUI should be hidden
    // if (!this.showGui) {
    //   return
    // }

    // Get screen width and height
    const width = game.config.width
    const height = game.config.height

    // Crosshair
    ctx.drawImage(assets.images.crosshair, width / 2 - 16, height / 2 - 16)

    // Coordinates
    if (game.globals.debugMode) {
      const margin = 16
      const pos = vec3.add(this.position, [0, 0, -this.height-this.width])
      ctx.save()
      ctx.translate(margin, height - margin)
      ctx.font = 'italic 16px Times New Roman'
      {
        const str = 'Position: [' + pos[0].toFixed(2) + ', ' + pos[1].toFixed(2) + ', ' + pos[2].toFixed(2) + ']'
        ctx.fillStyle = 'darkBlue'
        ctx.fillText(str, 0, 0)
        ctx.fillStyle = 'white'
        ctx.fillText(str, 2, -2)
      }
      ctx.translate(0, -margin)
      {
        const str = 'Voxel: [' + Math.round(pos[0]) + ', ' + Math.round(pos[1]) + ', ' + Math.round(pos[2]) + ']'
        ctx.fillStyle = 'darkBlue'
        ctx.fillText(str, 0, 0)
        ctx.fillStyle = 'white'
        ctx.fillText(str, 2, -2)
      }
      ctx.restore()
    }
  }

  // TODO: Finish this
  onDeath () {
    console.log("DEAD")
  }
}

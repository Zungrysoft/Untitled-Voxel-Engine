import SpatialHash from './spatialhash.js'
import Thing from './thing.js'
import * as game from './game.js'
import * as gfx from './webgl.js'
import * as u from './utils.js'
import * as vec2 from './vector2.js'
import * as mat from './matrices.js'
import * as vec3 from './vector3.js'

/*
   Scene instances are created, managed, accessed, and destroyed only
   by 'game.js' and should never be touched by the user.

   The Scene contains and manages the Things in the game.
*/

export default class Scene {
  things = []
  layers = {}
  layerOrder = []
  paused = false
  pauseExcludedThings = []
  depthMemory = new Map()

  camera2D = {
    position: [game.config.width / 2, game.config.height / 2],
    rotation: 0,
    scale: [1, 1]
  }

  camera3D = {
    position: [0, 0, 0],
    fov: Math.PI / 2,
    viewMatrix: mat.getView(),
    projectionMatrix: mat.getPerspective(),
    lookVector: [1, 0, 0],
    setUniforms () {
      gfx.set('viewMatrix', this.viewMatrix)
      gfx.set('projectionMatrix', this.projectionMatrix)
    },
    updateMatrices () {
      this.projectionMatrix = mat.getPerspective({
        aspect: game.config.width / game.config.height,
        fov: this.fov
      })
      this.viewMatrix = mat.getView({
        position: this.position,
        target: vec3.add(this.position, this.lookVector)
      })
    }
  }

  bgColor = '#4488ff'
  spatialHash = null
  screenShakes = []

  // things can assign themselves to this object
  // so that other things in the scene can reference them by name
  // things are automatically culled from this object when they die
  namedThings = {}

  constructor () {
    this.spatialHash = new SpatialHash()
  }

  update () {
    const paused = this.paused

    // update all things in the scene
    let i = 0
    while (i < this.things.length) {
      const thing = this.things[i]

      if (!thing.dead && (!paused || this.pauseExcludedThings.includes(thing))) {
        thing.update()
      }

      if (thing.dead) {
        // this thing died, so remove it from depth layers, spatial hash, and list
        thing.onDeath()
        const layer = this.layers[Math.round(this.depthMemory.get(thing)) || 0]
        if (layer) layer.splice(layer.indexOf(thing), 1)
        this.spatialHash.remove(thing)

        // we don't have to increment the index, as the other things "fall into"
        // this thing's current slot
        this.things.splice(i, 1)
      } else {
        // if depth changed, update render order
        if (this.depthMemory.get(thing) !== thing.depth) {
          this.updateDepth(thing)
        }

        // if position changed, update spatial hash
        const [xLast, yLast] = this.spatialHash.getHitbox(thing)
        if (xLast !== thing.position[0] || yLast !== thing.position[1]) {
          this.spatialHash.update(thing, ...thing.aabbSpatialHash())
        }

        i += 1
      }
    }

    // make sure all named things are still alive
    // otherwise remove them from the object
    for (const name in this.namedThings) {
      if (this.namedThings[name].dead) {
        delete this.namedThings[name]
      }
    }

    // handle screenshake
    i = 0
    while (i < this.screenShakes.length) {
      const shake = this.screenShakes[i]
      if (shake.amount) {
        shake.vector = vec2.angleToVector(u.random(0, Math.PI * 2), shake.strength)
        shake.amount -= 1
        i += 1
      } else {
        this.screenShakes.splice(i, 1)
      }
    }
  }

  draw () {
    if (game.config.isWebglEnabled) {
      // FIXME this allocates memory every frame!
      this.camera3D.updateMatrices()
    }

    const { ctx } = game
    ctx.save()

    // draw screenshakes, and black offscreen border to cover up gaps
    let xShake = 0
    let yShake = 0
    for (const shake of this.screenShakes) {
      xShake += shake.vector[0]
      yShake += shake.vector[1]
    }
    if (xShake !== 0 || yShake !== 0) {
      ctx.translate(Math.round(xShake), Math.round(yShake))
    }

    for (const layer of this.layerOrder) {
      for (const thing of this.layers[layer]) {
        thing.preDraw()
      }
    }

    const camera = this.camera2D
    const { width, height } = game.config
    ctx.save()

    ctx.translate(width / 2, height / 2)
    ctx.scale(...camera.scale)
    ctx.rotate(camera.rotation)
    ctx.translate(-Math.round(camera.position[0]), -Math.round(camera.position[1]))

    for (const layer of this.layerOrder) {
      for (const thing of this.layers[layer]) {
        thing.draw()
      }
    }

    ctx.restore()

    for (const layer of this.layerOrder) {
      for (const thing of this.layers[layer]) {
        thing.postDraw()
      }
    }

    // draw black bars around screen from screenshake
    ctx.save()
    ctx.fillStyle = 'black'
    const s = Math.abs(xShake) + Math.abs(yShake) + 4
    ctx.fillRect(-s, -s, width + s * 2, s)
    ctx.fillRect(-s, height, width + s * 2, s)
    ctx.fillRect(-s, 0, s, height)
    ctx.fillRect(width, 0, s, height)
    ctx.restore()

    ctx.restore()
  }

  clearScreen () {
    const bgColor = this.bgColor
    const { width, height } = game.config
    const { ctx } = game

    if (game.config.isWebglEnabled) {
      // webgl is enabled, so fill color on the webgl canvas instead of the 2d canvas
      const { gl } = game
      gl.clearColor(
        parseInt(bgColor.slice(1, 3), 16) / 255,
        parseInt(bgColor.slice(3, 5), 16) / 255,
        parseInt(bgColor.slice(5, 7), 16) / 255,
        1
      )
      gl.clearDepth(1.0)
      gl.enable(gl.DEPTH_TEST)
      gl.depthFunc(gl.LEQUAL)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.enable(gl.BLEND)
      gl.blendEquation(gl.FUNC_ADD)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

      // clear the 2d canvas
      ctx.clearRect(0, 0, width, height)
    } else {
      // no webgl, fill the 2d canvas with background color
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)
    }
  }

  // adds the given object instance to the thing list
  addThing (thing) {
    if (!(thing instanceof Thing)) {
      throw new Error('Trying to add non-Thing!')
    }
    this.things.push(thing)
    this.spatialHash.add(thing, ...thing.aabbSpatialHash())
    this.updateDepth(thing, NaN)
    return thing
  }

  // update the depth of a thing from one layer to another
  updateDepth (thing) {
    const depth = Math.round(thing.depth) || 0
    const previousDepth = Math.round(this.depthMemory.get(thing))
    if (previousDepth === depth) return
    this.depthMemory.set(thing, depth)

    this.layers[previousDepth] = this.layers[previousDepth] || []
    this.layers[previousDepth].splice(this.layers[previousDepth].indexOf(thing), 1)
    if (this.layers[previousDepth].length === 0) {
      delete this.layers[previousDepth]
    }
    this.layers[depth] = this.layers[depth] || []
    this.layers[depth].push(thing)
    this.layerOrder = Object.keys(this.layers).map(Number).sort((a, b) => a - b)
  }

  onUnload () {
    for (const thing of this.things) {
      thing.onUnload()
    }
  }
}

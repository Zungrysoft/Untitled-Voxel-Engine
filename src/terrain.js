import * as game from './core/game.js'
import * as u from './core/utils.js'
import * as soundmanager from './core/soundmanager.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as vec2 from './core/vector2.js'
import * as vec3 from './core/vector3.js'
import * as vox from './voxel.js'
import Thing from './core/thing.js'
import { assets } from './core/game.js'

export default class Terrain extends Thing {
  time = 0
  chunks = {}

  // TEMP
  viewAngle = [Math.PI/2, Math.PI*(1/4)]
  viewAngleTarget = this.viewAngle
  viewDistance = 4
  viewPosition = [0, 0, 0]

  constructor () {
    super()
    game.setThingName(this, 'terrain')
  }

  update () {
    super.update()

    this.time ++

    if (game.keysPressed.KeyJ) {
      let coord = [
        Math.floor((Math.random()-0.5) * 40),
        Math.floor((Math.random()-0.5) * 40),
        Math.floor((Math.random()-0.5) * 40),
      ]
      vox.setVoxel(this.chunks, coord, 70)
      console.log(this.chunks)
    }

    // TEMP
    // Camera controls
    if (game.keysPressed.ArrowRight || game.buttonsPressed[15]) {
      this.viewAngleTarget[0] -= Math.PI/4
    }
    if (game.keysPressed.ArrowLeft || game.buttonsPressed[14]) {
      this.viewAngleTarget[0] += Math.PI/4
    }
    if (game.keysPressed.ArrowUp || game.buttonsPressed[12]) {
      this.viewAngleTarget[1] += Math.PI/8
    }
    if (game.keysPressed.ArrowDown || game.buttonsPressed[13]) {
      this.viewAngleTarget[1] -= Math.PI/8
    }
    this.viewAngleTarget[1] = u.clamp(this.viewAngleTarget[1], 0, Math.PI/2)
    this.viewAngle = vec2.lerp(this.viewAngle, this.viewAngleTarget, 0.2)
    this.updateCamera()
  }

  // TEMP
  updateCamera() {
    // Set up 3D camera
    const cam = game.getCamera3D()
    cam.position[0] = Math.cos(this.viewAngle[0]) * Math.cos(this.viewAngle[1]) * this.viewDistance
    cam.position[1] = Math.sin(this.viewAngle[0]) * Math.cos(this.viewAngle[1]) * this.viewDistance
    cam.position[2] = Math.sin(this.viewAngle[1]) * this.viewDistance + 1
    cam.position = vec3.add(cam.position, this.viewPosition)
    cam.lookVector = vec3.anglesToVector(this.viewAngle[0], this.viewAngle[1])
  }

  draw () {
    const { ctx } = game

    // TEMP
    for (const coord of [[1, 1, 1], [-1, -1, -1]]) {
      gfx.setShader(assets.shaders.shaded)
      game.getCamera3D().setUniforms()
      gfx.set('color', [1, 1, 1, 1])
      gfx.set('scroll', 0)
      gfx.setTexture(assets.textures.square)
      gfx.set('modelMatrix', mat.getTransformation({
        translation: coord,
      }))
      gfx.drawMesh(assets.meshes.cube)
    }
    
  }
}

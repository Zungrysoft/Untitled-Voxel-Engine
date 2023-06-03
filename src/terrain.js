import * as game from './core/game.js'
import * as u from './core/utils.js'
import * as soundmanager from './core/soundmanager.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as vec2 from './core/vector2.js'
import * as vec3 from './core/vector3.js'
import * as vox from './voxel.js'
import * as pal from './palette.js'
import * as procbasics from './procbasics.js'
import Thing from './core/thing.js'
import { assets } from './core/game.js'

export default class Terrain extends Thing {
  time = 0
  chunks = {}
  chunkMeshes = {}
  chunkGeneratorData = {}
  fogColor = [1, 1, 1]

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

    // Debug button
    if (game.keysPressed.KeyJ) {
      let coord = [
        Math.floor((Math.random()-0.5) * 20),
        Math.floor((Math.random()-0.5) * 20),
        Math.floor((Math.random()-0.5) * 3) - 8,
      ]
      const color1 = Math.floor(Math.random()*254 + 2)
      const color2 = Math.floor(Math.random()*254 + 2)

      let plat = procbasics.generateRectangularPrism({
        length: 5,
        width: 5,
        colorIndex: 2,
      })

      plat = procbasics.applyPattern(plat, {
        colorMask: 2,
        pattern: 'checker',
        color1: color1,
        color2: color2,
      })

      vox.mergeStructureIntoWorld(this.chunks, coord, plat)
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

  rebuildChunkMeshes() {
    // Iterate over chunks and rebuild all marked "modified"
    for (const chunkKey in this.chunks) {
      if (this.chunks[chunkKey].modified) {
        this.rebuildChunkMesh(chunkKey)
        this.chunks[chunkKey].modified = false
      }
    }
  }

  rebuildChunkMesh(chunkKey) {
    // Remove this chunk's mesh so we may rebuild it
    delete this.chunkMeshes[chunkKey]

    // Build list of faces this chunk needs to render
    let faces = []
    for (let x = 0; x < vox.CHUNKSIZE; x ++) {
      for (let y = 0; y < vox.CHUNKSIZE; y ++) {
        for (let z = 0; z < vox.CHUNKSIZE; z ++) {
          // Position
          const position = vox.getWorldPosition(chunkKey, [x, y, z])

          // If the voxel is not air, add its faces
          const colorIndex = vox.getVoxel(this.chunks, position)
          if (colorIndex > 1) {
            // Check for adjacent voxels so we don't render faces that are hidden by other voxels

            // +X
            if (!vox.isSolid(vox.getVoxel(this.chunks, vec3.add(position, [1, 0, 0])))) {
              faces.push([[x + 0.5, y - 0.5, z - 0.5], [x + 0.5, y + 0.5, z + 0.5], [1, 0, 0], colorIndex])
            }
            // -X
            if (!vox.isSolid(vox.getVoxel(this.chunks, vec3.add(position, [-1, 0, 0])))) {
              faces.push([[x - 0.5, y + 0.5, z - 0.5], [x - 0.5, y - 0.5, z + 0.5], [-1, 0, 0], colorIndex])
            }
            // +Y
            if (!vox.isSolid(vox.getVoxel(this.chunks, vec3.add(position, [0, 1, 0])))) {
              faces.push([[x - 0.5, y + 0.5, z - 0.5], [x + 0.5, y + 0.5, z + 0.5], [0, 1, 0], colorIndex])
            }
            // -Y
            if (!vox.isSolid(vox.getVoxel(this.chunks, vec3.add(position, [0, -1, 0])))) {
              faces.push([[x - 0.5, y - 0.5, z + 0.5], [x + 0.5, y - 0.5, z - 0.5], [0, -1, 0], colorIndex])
            }
            // +Z
            if (!vox.isSolid(vox.getVoxel(this.chunks, vec3.add(position, [0, 0, 1])))) {
              faces.push([[x - 0.5, y - 0.5, z + 0.5], [x + 0.5, y + 0.5, z + 0.5], [0, 0, 1], colorIndex])
            }
            // -Z
            if (!vox.isSolid(vox.getVoxel(this.chunks, vec3.add(position, [0, 0, -1])))) {
              faces.push([[x - 0.5, y + 0.5, z - 0.5], [x + 0.5, y - 0.5, z - 0.5], [0, 0, -1], colorIndex])
            }
          }
        }
      }
    }

    // TODO: Merge faces together to optimize the mesh

    // Add triangles to the mesh
    const addFace = (v1, v2, normal, colorIndex) => {
      const addTriangle = (v1, v2, v3, normal, colorIndex) => {
        const vertices = [v1, v2, v3]
        const [u, v] = pal.getPaletteCoords(colorIndex)
        let verts = []

        for (const [x, y, z] of vertices) {
          verts.push(
            x, y, z,
            u, v,
            ...normal
          )
        }

        // if (solid) this.addToSpatialHash(p1, p2, p3, { material: texture })

        return verts
      }

      // Calculate the other two vertices in the quad
      let v3 = [...v1]
      let v4 = [...v1]
      // X axis
      if (v1[0] === v2[0]) {
        v3[1] = v2[1]
        v4[2] = v2[2]
      }
      // Y axis
      if (v1[1] === v2[1]) {
        v3[2] = v2[2]
        v4[0] = v2[0]
      }
      // Z axis
      if (v1[2] === v2[2]) {
        v3[0] = v2[0]
        v4[1] = v2[1]
      }

      // Two triangles
      const t1 = addTriangle(
        v1,
        v2,
        v3,
        normal,
        colorIndex
      )
      const t2 = addTriangle(
        v2,
        v1,
        v4,
        normal,
        colorIndex
      )

      return [...t1, ...t2]
    }

    let verts = []
    for (const face of faces) {
      // Render face
      const newVerts = addFace(...face)

      // Add to vertices
      verts = [...verts, ...newVerts]
    }

    // Build the mesh
    this.chunkMeshes[chunkKey] = gfx.createMesh(verts)
  }

  draw () {
    const { ctx, gl } = game

    // Rebuild chunk meshes that have been modified since the last frame
    this.rebuildChunkMeshes()

    // gfx setup
    gfx.setShader(assets.shaders.shaded)
    game.getCamera3D().setUniforms()
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)

    // TODO: Fog skybox

    // Chunk meshes
    for (const chunkKey in this.chunkMeshes) {
      const chunkMesh = this.chunkMeshes[chunkKey]
      gfx.set('fogColor', this.fogColor)
      gfx.set('fogDensity', 0.0)
      gfx.set('emission', 0.0)
      gfx.setTexture(assets.textures.palette)
      gfx.set('modelMatrix', mat.getTransformation({
        translation: vox.getWorldPosition(chunkKey, [0, 0, 0]),
      }))
      gfx.drawMesh(chunkMesh)
    }

    // gfx teardown
    gl.disable(gl.CULL_FACE)

  }
}

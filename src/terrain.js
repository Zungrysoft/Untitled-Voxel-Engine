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
import SpatialHash from './core/spatialhash.js'

export default class Terrain extends Thing {
  time = 0
  chunks = {}
  chunkMeshes = {}
  chunkGeneratorData = {}
  chunkSpatialHashes = {}
  fogColor = [1, 1, 1]

  constructor () {
    super()
    game.setThingName(this, 'terrain')


    let plat = procbasics.generateRectangularPrism({
      length: 25,
      width: 25,
      colorIndex: 2,
    })

    plat = procbasics.applyPattern(plat, {
      colorMask: 2,
      pattern: 'checker',
      color1: 30,
      color2: 24,
    })

    let wall = procbasics.generateRectangularPrism({
      width: 25,
      length: 1,
      height: 6,
      colorIndex: 88,
    })

    vox.mergeStructureIntoWorld(this.chunks, [-10, -10, 3], wall)
    vox.mergeStructureIntoWorld(this.chunks, [-7, -7, 3], wall)

    vox.mergeStructureIntoWorld(this.chunks, [-10, -10, 2], plat)
    vox.mergeStructureIntoWorld(this.chunks, [0, 0, 3], plat)
    vox.mergeStructureIntoWorld(this.chunks, [4, 0, 4], plat)
    vox.mergeStructureIntoWorld(this.chunks, [9, 4, 5], plat)

    vox.setVoxel(this.chunks, [1, 0, 6], 13)
    vox.setVoxel(this.chunks, [2, 0, 6], 13)
    vox.setVoxel(this.chunks, [3, 0, 6], 13)
    vox.setVoxel(this.chunks, [4, 0, 6], 13)
    vox.setVoxel(this.chunks, [5, 0, 6], 13)
    vox.setVoxel(this.chunks, [6, 0, 6], 13)
    vox.setVoxel(this.chunks, [0, 0, 5], 13)
    vox.setVoxel(this.chunks, [-1, 0, 4], 13)
    vox.setVoxel(this.chunks, [-2, 0, 3], 13)
    vox.setVoxel(this.chunks, [-3, 0, 2], 13)
    vox.setVoxel(this.chunks, [-4, 0, 1], 13)
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
    // Clear this chunk's spatial hash so we can rebuild it
    this.chunkSpatialHashes[chunkKey] = new SpatialHash()

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

        const dv1 = vox.getWorldPosition(chunkKey, v1)
        const dv2 = vox.getWorldPosition(chunkKey, v2)
        const dv3 = vox.getWorldPosition(chunkKey, v3)
        this.addToSpatialHash(dv1, dv2, dv3, chunkKey)

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

  addToSpatialHash (v3, v2, v1, chunkKey) {
    // Find the bounding box of this tri
    const x = [v1, v2, v3].reduce((prev, now) => Math.min(prev, now[0]), Infinity)
    const y = [v1, v2, v3].reduce((prev, now) => Math.min(prev, now[1]), Infinity)
    const w = [v1, v2, v3].reduce((prev, now) => Math.max(prev, now[0] - x), 1)
    const h = [v1, v2, v3].reduce((prev, now) => Math.max(prev, now[1] - y), 1)

    let normal = vec3.getNormalOf(v1, v2, v3)
    if (normal[2] > 0.99) {
      normal = [0, 0, 1]
    }

    const midpoint = vec3.scale(vec3.add(vec3.add(v1, v2), v3), 1 / 3)

    const tri = {
      points: [v1, v2, v3],
      midpoint: midpoint,
      normal: normal,
      material: 'voxel'
    }

    this.chunkSpatialHashes[chunkKey].add(tri, x, y, w, h)

    return tri
  }

  query (x, y, w, h) {
    let ret = []
    for (const chunkKey in this.chunkSpatialHashes) {
      const chunkList = this.chunkSpatialHashes[chunkKey].query(x, y, w, h)
      ret.push(...chunkList)
    }
    return ret
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

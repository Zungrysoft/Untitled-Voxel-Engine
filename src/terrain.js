import * as game from './core/game.js'
import * as u from './core/utils.js'
import * as soundmanager from './core/soundmanager.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as vec2 from './core/vector2.js'
import * as vec3 from './core/vector3.js'
import * as vox from './voxel.js'
import * as pal from './palette.js'
import * as procBasics from './procbasics.js'
import * as procDungeon from './procdungeon.js'
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
  palette = {
    grass: [[0.16, 0.7, 0.38]],
    leaves: [[0.16, 0.8, 0.38]],
    vines: [[0.16, 0.9, 0.38]],
    fruit: [[1, 0, 0]],
    flower: [[0, 0, 1]],
    bark: [[0.47, 0.35, 0.25]],
    wood: [[0.63, 0.43, 0.26]],
    dirt: [[0.33, 0.27, 0.22]],
    sand: [[0.78, 0.78, 0.48]],
    stone: [[0.42, 0.42, 0.45]],
    stoneAccent: [[0.15, 0.14, 0.38]],
    stoneAccent2: [[0.53, 0.13, 0.14]],
    stoneRoof: [[0.38, 0.15, 0.14]],
    metal: [[0.41, 0.40, 0.41]],
    metalAccent: [[0.33, 0.31, 0.33]],
    sign: [[0.87, 0.84, 0.73]],
    signText: [[0.68, 0.21, 0.16]],
    rune: [[0.95, 0.04, 0.04]],
    bone: [[0.90, 0.91, 0.79]],
    crystal: [[0.87, 0.13, 0.97]],
    structure: pal.generatePalette(0.027, 0.5, 0.8, 0.137),
  }

  constructor () {
    super()
    game.setThingName(this, 'terrain')

    let plat = procBasics.generateRectangularPrism({
      length: 25,
      width: 25,
      height: 2,
      voxel: {material: 'structure', solid: true},
    })
    let plat2 = procBasics.applyPattern(plat, {
      pattern: 'flat',
      voxel1: {material: 'vines', solid: true},
    })
    plat = procBasics.applyPattern(plat, {
      pattern: 'checker',
      voxel1: {material: 'wood', solid: true},
      voxel2: {material: 'bark', solid: true},
    })

    let wall = procBasics.generateRectangularPrism({
      width: 25,
      length: 1,
      height: 6,
      voxel: {material: 'structure', solid: true},
    })
    wall = procBasics.applyPattern(wall, {
      pattern: 'checker',
      voxel1: {material: 'stone', solid: true},
      voxel2: {material: 'stoneAccent', solid: true},
    })

    vox.mergeStructureIntoWorld(this.chunks, wall, [-10, -10, 3])
    vox.mergeStructureIntoWorld(this.chunks, wall, [-7, -7, 3])

    vox.mergeStructureIntoWorld(this.chunks, plat2, [-10, -10, 1])
    vox.mergeStructureIntoWorld(this.chunks, plat, [0, 0, 2])
    vox.mergeStructureIntoWorld(this.chunks, plat, [4, 0, 3])
    vox.mergeStructureIntoWorld(this.chunks, plat, [9, 4, 4])

    // Generate hill
    for (let i = 0; i < 30; i ++) {
      const x = i*5
      const y = 30
      const z = 4 - i
      vox.mergeStructureIntoWorld(this.chunks, plat, [x, y, z])
    }

    const v1 = {material: 'bone', solid: true}
    vox.setVoxel(this.chunks, [1, 0, 6], v1)
    vox.setVoxel(this.chunks, [2, 0, 6], v1)
    vox.setVoxel(this.chunks, [3, 0, 6], v1)
    vox.setVoxel(this.chunks, [4, 0, 6], v1)
    vox.setVoxel(this.chunks, [5, 0, 6], v1)
    vox.setVoxel(this.chunks, [6, 0, 6], v1)
    vox.setVoxel(this.chunks, [0, 0, 5], v1)
    vox.setVoxel(this.chunks, [-1, 0, 4], v1)
    vox.setVoxel(this.chunks, [-2, 0, 3], v1)
    vox.setVoxel(this.chunks, [-3, 0, 2], v1)
    vox.setVoxel(this.chunks, [-4, 0, 1], v1)

    let room = procBasics.generateRoom({
      width: 8,
      length: 8,
      height: 6,
      wallThickness: 1,
      floorThickness: 3,
      ceilingThickness: 0,
      voxel: {material: 'structure', solid: true},
    })
    room = procBasics.applyPattern(room, {
      pattern: 'checker',
      voxel1: {material: 'stone', solid: true},
      voxel2: {material: 'stoneAccent', solid: true},
    })
    vox.mergeStructureIntoWorld(this.chunks, room, [17, -7, -5])

    // Palette test
    for (let i = 0; i < 16; i ++) {
      const s = u.map(i, 0, 16-1, 0, 1.0)
      const v2 = {material: 'structure', solid: true, shades: [s, s, s, s, s, s]}
      vox.setVoxel(this.chunks, [-7 + i, -6, 3], v2)
    }

    // Generate mountain
    for (let i = 0; i < 700; i ++) {
      let m = procBasics.generateRectangularPrism({
        width: Math.floor(Math.random()*6),
        length: Math.floor(Math.random()*6),
        height: Math.floor(Math.random()*10 + 10),
        voxel: {solid: true, material: 0.5 > Math.random() ? 'stone' : 'stoneRoof'},
      })
      const x = Math.floor(Math.random()*40 - 50)
      const y = Math.floor(Math.random()*120 - 40)
      const z = -10
      vox.mergeStructureIntoWorld(this.chunks, m, [x, y, z])
    }

    // Chunk plat
    let plat3 = procBasics.generateRectangularPrism({
      length: 32,
      width: 32,
      height: 1,
      voxel: {material: 'structure', solid: true},
    })
    plat3 = procBasics.applyPattern(plat3, {
      pattern: 'checker',
      voxel1: {material: 'vines', solid: true},
      voxel2: {material: 'grass', solid: true},
    })
    vox.mergeStructureIntoWorld(this.chunks, plat3, [0, 0, -1])
  }

  update () {
    super.update()

    this.time ++

    // Debug button
    if (game.keysPressed.KeyJ) {
      // const dungeon = procDungeon.generateDungeon(this.chunks, {
      //   position: [25, 30, 4],
      //   rooms: 30,
      //   voxel: {solid: true, material:'stone', generatorData:{reserved: true}}
      // })
      // console.log(dungeon)
      // vox.mergeStructureIntoWorld(this.chunks, dungeon, [0, 0, 0])
    }
  }

  traceLine(traceStart, traceEnd) {
    const xSign = traceEnd[0] > traceStart[0]
    const ySign = traceEnd[1] > traceStart[1]
    const zSign = traceEnd[2] > traceStart[2]
    const moveVector = vec3.normalize(vec3.subtract(traceEnd, traceStart))

    const totalDistance = vec3.distance(traceStart, traceEnd)
    let d = 0 // Distance travelled so far
    let curPos = [...traceStart]
    while (d <= totalDistance) {
      // Figure out how far away the next voxel face is for each axis
      let xDist = Math.abs(((xSign ? 1 : 0) - u.mod(curPos[0]+0.5, 1.0)) / moveVector[0])
      let yDist = Math.abs(((ySign ? 1 : 0) - u.mod(curPos[1]+0.5, 1.0)) / moveVector[1])
      let zDist = Math.abs(((zSign ? 1 : 0) - u.mod(curPos[2]+0.5, 1.0)) / moveVector[2])

      // Handles special cases such an axis's direction being zero
      if (!xDist || xDist < 0.000001) {
        xDist = Infinity
      }
      if (!yDist || yDist < 0.000001) {
        yDist = Infinity
      }
      if (!zDist || zDist < 0.000001) {
        zDist = Infinity
      }

      // Set move distance based on which voxel face was next
      let moveDistance = 0
      let normal = [0, 0, 0]
      if (xDist < yDist) {
        if (xDist < zDist) {
          moveDistance = xDist
          normal = [xSign ? -1 : 1, 0, 0]
        }
        else {
          moveDistance = zDist
          normal = [0, 0, zSign ? -1 : 1]
        }
      }
      else {
        if (yDist < zDist) {
          moveDistance = yDist
          normal = [0, ySign ? -1 : 1, 0]
        }
        else {
          moveDistance = zDist
          normal = [0, 0, zSign ? -1 : 1]
        }
      }

      // Move
      const hitPos = vec3.add(curPos, vec3.scale(moveVector, moveDistance))
      curPos = vec3.add(hitPos, vec3.scale(normal, -0.0001)) // We move forward a tiny bit on the crossed axis to cross into the next voxel
      d += moveDistance

      // Get the voxel at this position
      const hitVoxel = curPos.map(x => Math.round(x))

      // Check if the hit voxel is solid
      if (vox.getVoxel(this.chunks, hitVoxel).solid) {
        return {
          voxel: hitVoxel,
          position: hitPos,
          normal: normal,
          distance: d,
          hit: true
        }
      }
    }

    // Base case if it hit nothing
    return {
      voxel: traceEnd.map(x => Math.round(x)),
      position: traceEnd,
      normal: [0, 0, 0],
      distance: totalDistance,
      hit: false,
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

    console.log("Rebuilding mesh for chunk " + chunkKey)

    // Build list of faces this chunk needs to render
    let faces = {
      north: {},
      northCollision: {},
      northKeys: [],
      south: {},
      southCollision: {},
      southKeys: [],
      west: {},
      westCollision: {},
      westKeys: [],
      east: {},
      eastCollision: {},
      eastKeys: [],
      up: {},
      upCollision: {},
      upKeys: [],
      down: {},
      downCollision: {},
      downKeys: [],
    }
    for (let x = 0; x < vox.CHUNK_SIZE; x ++) {
      for (let y = 0; y < vox.CHUNK_SIZE; y ++) {
        for (let z = 0; z < vox.CHUNK_SIZE; z ++) {
          // Position
          const position = vox.getWorldPosition(chunkKey, [x, y, z])

          // If the voxel is not air, add its faces
          const voxel = vox.getVoxel(this.chunks, position)
          if (voxel.solid) {
            // Get voxel palette
            const palette = this.palette[voxel.material]

            // Check for adjacent voxels so we don't render faces that are hidden by other voxels
            // East
            if (!vox.getVoxel(this.chunks, vec3.add(position, [1, 0, 0])).solid) {
              faces.eastKeys.push(position)
              faces.east[position] = [[x + 0.5, y - 0.5, z - 0.5], [x + 0.5, y + 0.5, z + 0.5], pal.getColor(palette, voxel.shades[3])]
              faces.eastCollision[position] = [[x + 0.5, y - 0.5, z - 0.5], [x + 0.5, y + 0.5, z + 0.5]]
            }
            // West
            if (!vox.getVoxel(this.chunks, vec3.add(position, [-1, 0, 0])).solid) {
              faces.westKeys.push(position)
              faces.west[position] = [[x - 0.5, y - 0.5, z - 0.5], [x - 0.5, y + 0.5, z + 0.5], pal.getColor(palette, voxel.shades[0])]
              faces.westCollision[position] = [[x - 0.5, y - 0.5, z - 0.5], [x - 0.5, y + 0.5, z + 0.5]]
            }
            // South
            if (!vox.getVoxel(this.chunks, vec3.add(position, [0, 1, 0])).solid) {
              faces.southKeys.push(position)
              faces.south[position] = [[x - 0.5, y + 0.5, z - 0.5], [x + 0.5, y + 0.5, z + 0.5], pal.getColor(palette, voxel.shades[4])]
              faces.southCollision[position] = [[x - 0.5, y + 0.5, z - 0.5], [x + 0.5, y + 0.5, z + 0.5]]
            }
            // North
            if (!vox.getVoxel(this.chunks, vec3.add(position, [0, -1, 0])).solid) {
              faces.northKeys.push(position)
              faces.north[position] = [[x - 0.5, y - 0.5, z - 0.5], [x + 0.5, y - 0.5, z + 0.5], pal.getColor(palette, voxel.shades[1])]
              faces.northCollision[position] = [[x - 0.5, y - 0.5, z - 0.5], [x + 0.5, y - 0.5, z + 0.5]]
            }
            // Up
            if (!vox.getVoxel(this.chunks, vec3.add(position, [0, 0, 1])).solid) {
              faces.upKeys.push(position)
              faces.up[position] = [[x - 0.5, y - 0.5, z + 0.5], [x + 0.5, y + 0.5, z + 0.5], pal.getColor(palette, voxel.shades[5])]
              faces.upCollision[position] = [[x - 0.5, y - 0.5, z + 0.5], [x + 0.5, y + 0.5, z + 0.5]]
            }
            // Down
            if (!vox.getVoxel(this.chunks, vec3.add(position, [0, 0, -1])).solid) {
              faces.downKeys.push(position)
              faces.down[position] = [[x - 0.5, y - 0.5, z - 0.5], [x + 0.5, y + 0.5, z - 0.5], pal.getColor(palette, voxel.shades[2])]
              faces.downCollision[position] = [[x - 0.5, y - 0.5, z - 0.5], [x + 0.5, y + 0.5, z - 0.5]]
            }
          }
        }
      }
    }

    // Merge faces together to optimize the mesh
    // Do it twice, once for rendering and once for collision
    for (const ignoreColor of [false, true]) {
      // Iterate over the six faces
      for (const direction of ['east', 'south', 'down', 'west', 'north', 'up']) {
        // Loop over the three dimensions (X, Y, and Z) for adjacent faces to merge
        const dirKey = ignoreColor ? direction+'Collision' : direction

        // X
        if (direction !== 'east' && direction !== 'west') {
          for (const key of faces[direction + 'Keys']) {
            // Check if the face still exists (it may have been removed by an earlier step)
            const face = faces[dirKey][key]
            if (face) {
              for (let x = 1; true; x ++) {
                const mergeKey = vec3.add(key, [x, 0, 0])
                const mergeFace = faces[dirKey][mergeKey]
                // Check that the merge face exists and is of the same color
                if (mergeFace && (ignoreColor || vec3.equals(face[2], mergeFace[2]))) {
                  // Delete merged face (since it's being merged in)
                  delete faces[dirKey][mergeKey]

                  // Extend the original face to cover the area lost from the deleted face
                  faces[dirKey][key][1][0] += 1
                }
                else {
                  break
                }
              }
            }
          }
        }

        // Y
        if (direction !== 'south' && direction !== 'north') {
          for (const key of faces[direction + 'Keys']) {
            // Check if the face still exists (it may have been removed by an earlier step)
            const face = faces[dirKey][key]
            if (face) {
              for (let y = 1; true; y ++) {
                const mergeKey = vec3.add(key, [0, y, 0])
                const mergeFace = faces[dirKey][mergeKey]
                // Check that the merge face exists and is of the same color
                // Also check that the faces are of the same length in the X direction
                // since the lengths may have changed in the X step
                if (mergeFace && (ignoreColor || vec3.equals(face[2], mergeFace[2])) && face[1][0] === mergeFace[1][0]) {
                  // Delete merged face (since it's being merged in)
                  delete faces[dirKey][mergeKey]

                  // Extend the original face to cover the area lost from the deleted face
                  faces[dirKey][key][1][1] += 1
                }
                else {
                  break
                }
              }
            }
          }
        }

        // Z
        if (direction !== 'down' && direction !== 'up') {
          for (const key of faces[direction + 'Keys']) {
            // Check if the face still exists (it may have been removed by an earlier step)
            const face = faces[dirKey][key]
            if (face) {
              for (let z = 1; true; z ++) {
                const mergeKey = vec3.add(key, [0, 0, z])
                const mergeFace = faces[dirKey][mergeKey]
                // Check that the merge face exists and is of the same color
                // Also check that the faces are of the same length in the X and Y directions
                // since the lengths may have changed in the X step
                if (mergeFace && (ignoreColor || vec3.equals(face[2], mergeFace[2])) && face[1][0] === mergeFace[1][0] && face[1][1] === mergeFace[1][1]) {
                  // Delete merged face (since it's being merged in)
                  delete faces[dirKey][mergeKey]

                  // Extend the original face to cover the area lost from the deleted face
                  faces[dirKey][key][1][2] += 1
                }
                else {
                  break
                }
              }
            }
          }
        }
      }
    }

    // Add triangles to the mesh
    const addFace = (v1, v2, rgb, normal, flip) => {
      const addTriangle = (v1, v2, v3, normal, rgb) => {
        const vertices = [v1, v2, v3]
        const [u, v] = pal.getColorMapCoords(rgb)
        let verts = []

        for (const [x, y, z] of vertices) {
          verts.push(
            x, y, z,
            u, v,
            ...normal
          )
        }

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

      // Flip direction
      if (flip) {
        const swapper = v3
        v3 = v4
        v4 = swapper
      }

      // Two triangles
      const t1 = addTriangle(
        v1,
        v2,
        v3,
        normal,
        rgb,
      )
      const t2 = addTriangle(
        v2,
        v1,
        v4,
        normal,
        rgb,
        // rgb.map(x => x+0.05),
      )

      return [...t1, ...t2]
    }

    const addCollisionFace = (v1, v2, flip) => {
      const addTriangle = (v1, v2, v3) => {
        const dv1 = vox.getWorldPosition(chunkKey, v1)
        const dv2 = vox.getWorldPosition(chunkKey, v2)
        const dv3 = vox.getWorldPosition(chunkKey, v3)
        this.addToSpatialHash(dv1, dv2, dv3, chunkKey)
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

      // Flip direction
      if (flip) {
        const swapper = v3
        v3 = v4
        v4 = swapper
      }

      // Two triangles
      addTriangle(
        v1,
        v2,
        v3,
      )
      addTriangle(
        v2,
        v1,
        v4,
      )
    }

    let verts = []
    for (const direction of ['north', 'south', 'east', 'west', 'up', 'down']) {
      // Faces facing toward a negative axis need to be flipped for some reason
      const flip = ['north', 'west', 'down'].includes(direction)

      // Rendered triangles
      for (const key in faces[direction]) {
        const face = faces[direction][key]

        // Create triangles
        const newVerts = addFace(...face, vec3.directionToVector(direction), flip)

        // Add to vertices
        verts.push(...newVerts)
      }

      // Collision triangles
      for (const key in faces[direction+'Collision']) {
        const face = faces[direction+'Collision'][key]

        // Add face
        addCollisionFace(...face, flip)
      }
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

  query (x, y, z, w, l, h) {

    // TODO: Deal with the case where w and/or h are larger than 32

    // Get all chunkKeys the query might be part of
    let chunkKeys = new Set()
    const positions = [
      [x, y, z], [x, y+l, z], [x+w, y, z], [x+w, y+l, z],
      [x, y, z+h], [x, y+l, z+h], [x+w, y, z+h], [x+w, y+l, z+h],
    ]
    for (const position of positions) {
      chunkKeys.add(vox.positionToChunkKey(position).toString())
    }

    // Send all chunks
    let ret = []
    for (const chunkKey of chunkKeys) {
      const chunk =this.chunkSpatialHashes[chunkKey]
      if (chunk) {
        const spatialHash = chunk.query(x, y, w, l)
        ret.push(...spatialHash)
      }
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
      const position = vox.getWorldPosition(chunkKey, [0, 0, 0])
      gfx.set('fogColor', this.fogColor)
      gfx.set('fogDensity', 0.0)
      gfx.set('emission', 1.0)
      gfx.setTexture(assets.textures.colorMap)
      gfx.set('modelMatrix', mat.getTransformation({
        translation: position,
      }))
      gfx.drawMesh(chunkMesh)

      if (game.globals.debugMode) {
        gfx.set('modelMatrix', mat.getTransformation({
          translation: vec3.add(position, [-0.5, -0.5, vox.CHUNK_SIZE-0.5]),
          scale: vox.CHUNK_SIZE,
        }))
        gfx.drawMesh(assets.meshes.chunkOutline)
      }
    }

    // gfx teardown
    gl.disable(gl.CULL_FACE)

  }
}

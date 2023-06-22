import * as game from './core/game.js'
import * as u from './core/utils.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as vec3 from './core/vector3.js'
import * as vox from './voxel.js'
import * as pal from './palette.js'
import * as lit from './lighting.js'
import * as procBasics from './procbasics.js'
import * as procDungeon from './procdungeon.js'
import * as procMansion from './procmansion.js'
import * as procTerrain from './procterrain.js'
import Thing from './core/thing.js'
import { assets } from './core/game.js'
import SpatialHash from './core/spatialhash.js'

export default class Terrain extends Thing {
  time = 0
  seed = Math.floor(Math.random() * Math.pow(2, 64))
  chunks = {}
  chunkMeshes = {}
  chunkGeneratorData = {}
  chunkSpatialHashes = {}
  selectedChunks = []
  fogColor = [1, 1, 1]
  palette = {
    structure: pal.generatePalette(0.027, 0.5, 0.8, 0.13),
    grass: pal.generatePalette(0.33, 0.48, 0.67, 0.05),
    leaves: pal.generatePalette(0.31, 0.65, 0.84, 0.1),
    vines: pal.generatePalette(0.35, 0.87, 0.89, 0.02),
    fruit: pal.generatePalette(0.03, 0.74, 0.83, 0.03),
    flower: pal.generatePalette(0.65, 0.60, 0.85, 0.03),
    bark: pal.generatePalette(0.08, 0.45, 0.54, 0.05),
    wood: pal.generatePalette(0.11, 0.40, 0.73, 0.05),
    dirt: pal.generatePalette(0.12, 0.33, 0.51, 0.02),
    sand: pal.generatePalette(0.16, 0.42, 0.86, 0.02),
    stone: pal.generatePalette(0.66, 0.06, 0.54, 0.05),
    stoneAccent: pal.generatePalette(0.67, 0.64, 0.38, 0.03),
    stoneAccent2: pal.generatePalette(0.99, 0.76, 0.61, 0.03),
    stoneRoof: pal.generatePalette(0.99, 0.76, 0.45, 0.03),
    metal: pal.generatePalette(0.83, 0.02, 0.45, 0.03),
    metalAccent: pal.generatePalette(0.83, 0.02, 0.31, 0.03),
    sign: pal.generatePalette(0.13, 0.16, 0.87, 0.03),
    signText: pal.generatePalette(0.03, 0.74, 0.83, 0.03),
    rune: pal.generatePalette(0.96, 1.0, 0.94, 0.03),
    bone: pal.generatePalette(0.18, 0.13, 0.91, 0.01),
    crystal: pal.generatePalette(0.83, 1.0, 0.94, 0.03),
  }

  constructor () {
    super()
    game.setThingName(this, 'terrain')

    // Spawn platform
    let plat = procBasics.generateRectangularPrism({
      length: 16,
      width: 16,
      height: 7,
      voxel: {material: 'structure', solid: true},
    })
    plat = procBasics.applyPattern(plat, {
      pattern: 'checker',
      voxel1: {material: 'dirt', solid: true},
      voxel2: {material: 'grass', solid: true},
    })
    vox.mergeStructureIntoWorld(this.chunks, plat, [0, 0, 0])

    for (let i = 1; i < 20; i ++) {
      vox.mergeStructureIntoWorld(this.chunks, plat, [i*16, 0, 0])
    }

    // Palette test
    // let keyZ = 0
    // for (const key in this.palette) {
    //   for (let i = 0; i < 16; i ++) {
    //     const s = u.map(i, 0, 16-1, 0, 1.0)
    //     const v1 = {material: key, solid: true, shades: [s, s, s, s, s, s]}
    //     vox.setVoxel(this.chunks, [27 + i, -keyZ-6, 3], v1)
    //   }
    //   keyZ ++
    // }

    // Set up worker threads
    this.chunkSelectorWorker = new Worker('src/workers/chunkselector.js');
    this.chunkSelectorWorker.onmessage = (message) => {
      this.loadChunks(message.data)
    }
  }

  update () {
    super.update()

    this.time ++

    // Chunk loading and unloading
    // if (this.time % 60 === 0) {
    //   this.selectChunks(game.getThing('player').position)
    // }

    // Debug button
    if (game.keysPressed.KeyJ) {
      // const dungeon = procDungeon.generateDungeon(this.chunks, {
      //   position: [25, 30, 4],
      //   rooms: 30,
      //   voxel: {solid: true, material:'stone', generatorData:{reserved: true}}
      // })
      // console.log(dungeon)
      // vox.mergeStructureIntoWorld(this.chunks, dungeon, [0, 0, 0])

      // lit.lightingPass({
      //   position: [68, -5, 11],
      //   brightness: 55,
      // })

      // lit.lightingPass({
      //   position: [43, 15, 10],
      //   brightness: 55,
      // })

      // Perlin 3D terrain
      procTerrain.buildTerrain(this.chunks, this.seed, {
        minPosition: [63, 29, -30],
        maxPosition: [345, -300, 50],
        scale: 20
      })

      // Mansion
      // const tileScale = 5
      // const mansion = procMansion.generateMansion({
      //   width: 125,
      //   length: 125,
      //   height: 15,
      //   roomWidth: tileScale,
      //   roomLength: tileScale,
      //   roomHeight: tileScale,
      //   possibilities: [
      //     assets.json.structureArchesBottomCenter,
      //     assets.json.structureArchesBottomEdge,
      //     assets.json.structureArchesBottomEdgePillar,
      //     assets.json.structureArchesBottomCornerPillar,
      //     assets.json.structureArchesBottomJunctionPillar,
      //     assets.json.structureArchesTopEdge,
      //     assets.json.structureArchesTopEdgePillar,
      //     assets.json.structureArchesTopCornerPillar,
      //     assets.json.structureArchesTopJunctionPillar,
      //     assets.json.structureArchesRoofCorner,
      //     assets.json.structureArchesRoofEdge,
      //     assets.json.structureArchesRoofJunction,
      //     assets.json.structureArchesRoofCenterEnd,
      //     assets.json.structureArchesRoofCenterQuad,
      //     assets.json.structureArchesRoofCenterStraight,
      //     assets.json.structureArchesRoofCenterTee,
      //     assets.json.structureArchesRoofCenterTurn,
      //     assets.json.structureAir,
      //     assets.json.structureFlat,
      //     // assets.json.structureAny,
      //   ],
      // })
      // vox.mergeStructureIntoWorld(this.chunks, mansion, [92, 55, -10])
      // for (let x = 0; x < 35; x ++) {
      //   for (let y = 0; y < 35; y ++) {
      //     let mansionPlat = procBasics.generateRectangularPrism({
      //       width: tileScale,
      //       length: tileScale,
      //       height: 1,
      //       voxel: {material: x%2 === y%2 ? 'grass' : 'leaves', solid: true},
      //     })
      //     vox.mergeStructureIntoWorld(this.chunks, mansionPlat, vec3.add([92, 55, -10], vec3.scale([x, y, 0], tileScale)))
      //   }
      // }
    }
  }

  selectChunks(position) {
    this.chunkSelectorWorker.postMessage({position: position, renderDistance: 5})
  }

  loadChunks(data) {
    for (const chunkKey of data) {
      if (!(chunkKey in this.chunks)) {
        procTerrain.buildTerrain(this.chunks, this.seed, {
          minPosition: vox.getWorldPosition(chunkKey, [0, 0, 0]),
          maxPosition: vox.getWorldPosition(chunkKey, [15, 15, 15]),
          scale: 20,
        })
      }
    }
  }

  traceLine(traceStart, traceEnd, ignoreFirstVoxel=false) {
    const xSign = traceEnd[0] > traceStart[0]
    const ySign = traceEnd[1] > traceStart[1]
    const zSign = traceEnd[2] > traceStart[2]
    const moveVector = vec3.normalize(vec3.subtract(traceEnd, traceStart))

    // Check the first voxel
    if (!ignoreFirstVoxel) {
      const hitVoxel = traceStart.map(x => Math.round(x))
      if (vox.getVoxel(this.chunks, hitVoxel).solid) {
        return {
          voxel: hitVoxel,
          position: [...traceStart],
          normal: [0, 0, 0],
          axis: -1,
          distance: 0,
          hit: true,
        }
      }
    }

    const totalDistance = vec3.distance(traceStart, traceEnd)
    let distanceLeft = totalDistance // Distance left to travel
    let curPos = [...traceStart]
    while (distanceLeft > 0) {
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
      let axis = -1
      if (xDist < yDist) {
        if (xDist < zDist) {
          moveDistance = xDist
          normal = [xSign ? -1 : 1, 0, 0]
          axis = 0
        }
        else {
          moveDistance = zDist
          normal = [0, 0, zSign ? -1 : 1]
          axis = 2
        }
      }
      else {
        if (yDist < zDist) {
          moveDistance = yDist
          normal = [0, ySign ? -1 : 1, 0]
          axis = 1
        }
        else {
          moveDistance = zDist
          normal = [0, 0, zSign ? -1 : 1]
          axis = 2
        }
      }

      // Limit movement distance so it doesn't go past traceEnd
      moveDistance = Math.min(moveDistance, distanceLeft)
      distanceLeft -= moveDistance

      // Move
      const hitPos = vec3.add(curPos, vec3.scale(moveVector, moveDistance))
      curPos = vec3.add(hitPos, vec3.scale(normal, -0.0001)) // We move forward a tiny bit on the crossed axis to cross into the next voxel

      // Get the voxel at this position
      const hitVoxel = curPos.map(x => Math.round(x))

      // Check if the hit voxel is solid
      if (vox.getVoxel(this.chunks, hitVoxel).solid) {
        return {
          voxel: hitVoxel,
          position: hitPos,
          normal: normal,
          axis: axis,
          distance: totalDistance - distanceLeft,
          hit: true
        }
      }
    }

    // Base case if it hit nothing
    return {
      voxel: traceEnd.map(x => Math.round(x)),
      position: [...traceEnd],
      normal: [0, 0, 0],
      axis: -1,
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
    gfx.setShader(assets.shaders.voxel)
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
      gfx.set('emission', 0.0)
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

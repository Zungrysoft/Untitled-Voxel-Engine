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
import WorkerPool from './workerpool.js'
import Thing from './core/thing.js'
import { assets } from './core/game.js'
import SpatialHash from './core/spatialhash.js'

export default class Terrain extends Thing {
  time = 0
  seed = Math.floor(Math.random() * Math.pow(2, 64))
  loadDistance = 2
  chunks = {}
  chunkStates = {}
  chunkMeshes = {}
  fogColor = [0.267, 0.533, 1]

  constructor () {
    super()
    game.setThingName(this, 'terrain')

    // Spawn platform
    this.chunks['0,0,0'] = vox.emptyChunk()
    this.chunkStates['0,0,0'] = 'loaded'
    let plat = procBasics.generateRectangularPrism({
      length: vox.CHUNK_SIZE,
      width: vox.CHUNK_SIZE,
      height: 7,
      voxel: {material: 'structure', solid: true},
    })
    plat = procBasics.applyPattern(plat, {
      pattern: 'checker',
      voxel1: {material: 'dirt', solid: true},
      voxel2: {material: 'grass', solid: true},
    })
    vox.mergeStructureIntoWorld(this.chunks, plat, [0, 0, 0])

    // Palette test
    // let keyZ = 0
    // for (const key in this.palette) {
    //   for (let i = 0; i < 16; i ++) {
    //     const s = u.map(i, 0, 16-1, 0, 1.0)
    //     const v1 = {material: key, solid: true, shades: [s, s, s, s, s, s]}
    //     vox.editVoxel(this.chunks, [27 + i, -keyZ-6, 3], v1)
    //   }
    //   keyZ ++
    // }

    // =====================
    // Set up worker threads
    // =====================

    // Chunk selector
    this.chunkSelectorWorker = new Worker('src/workers/chunkselector.js', { type: "module" })

    // Chunk meshers
    this.mesherPool = new WorkerPool('src/workers/chunkmesher.js', game.config.threads, {},
      (message) => {
        // Save the chunk mesh
        let vertsView = new Float32Array(message.verts);
        if (vertsView.length > 0) {
          this.chunkMeshes[message.chunkKey] = gfx.createMesh(vertsView)
        }
        // If the mesh is empty, delete its entry in the dict instead
        else {
          delete this.chunkMeshes[message.chunkKey]
        }
      },
    )

    // Terrain Generators
    this.generatorPool = new WorkerPool('src/workers/chunkgenerator.js', game.config.threads,
      {
        idempotencyKeys: ['chunkKey'],
      },
      (message) => {
        // Save chunk
        this.chunks[message.chunkKey] = message.chunk

        // Save this chunk's initial mesh as well
        if (message.verts) {
          let vertsView = new Float32Array(message.verts);
          if (vertsView.length > 0) {
            this.chunkMeshes[message.chunkKey] = gfx.createMesh(vertsView)
          }
        }

        // Set chunk state
        this.chunkStates[message.chunkKey] = 'loaded'
      },
      (message) => {
        // Set chunk state
        this.chunkStates[message.chunkKey] = 'loading'
      },
    )

    // Chunk Unloaders
    this.unloaderPool = new WorkerPool('src/workers/chunkunloader.js', game.config.threads,
      {
        idempotencyKeys: ['chunkKey'],
      },
      (message) => {
        if (message.success) {
          // Set chunk state
          delete this.chunkStates[message.chunkKey]
        }
      },
      (message) => {
        // Set chunk state
        this.chunkStates[message.chunkKey] = 'unloading'

        // Delete the chunk from this object since it's now safe in the worker thread that is saving it to db
        delete this.chunks[message.chunkKey]

        // Delete mesh
        delete this.chunkMeshes[message.chunkKey]
      },
    )
  }

  update () {
    super.update()

    this.time ++

    // Chunk loading and unloading
    if (this.time % 60 === 0) {
      this.selectChunks(game.getThing('player').position)
    }

    // Debug button
    if (game.keysPressed.KeyJ) {
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
    // Get worker
    const worker = this.chunkSelectorWorker

    // Set callback
    worker.onmessage = (message) => {
      this.loadChunks(message.data)
    }

    // Send message
    worker.postMessage({
      position: position,
      loadDistance: this.loadDistance,
      keepDistance: this.loadDistance + 2,
    })
  }

  loadChunks(data) {
    // Rebuild the queue of which chunks to load
    this.generatorPool.clearQueue()
    for (const chunkKey of data.chunksToLoad) {
      if (!(chunkKey in this.chunkStates)) {
        this.generatorPool.push({
          chunkKey: chunkKey,
          seed: this.seed,
        })
      }
    }

    // Set chunks to unload if they're loaded and not on the keep or load list
    this.unloaderPool.clearQueue()
    for (const chunkKey in this.chunks) {
      if (!data.chunksToLoad.includes(chunkKey) && !data.chunksToKeep.includes(chunkKey)) {
        if (this.chunkStates[chunkKey] === 'loaded') {
          const chunk = this.chunks[chunkKey]
          this.unloaderPool.push({
            chunkKey: chunkKey,
            chunk: chunk,
            transfer: [chunk.voxels],
          })
        }
      }
    }
  }

  rebuildChunkMeshes() {
    // Iterate over chunks and rebuild all marked "modified"
    for (const chunkKey in this.chunks) {
      if (this.chunks[chunkKey].modified) {
        // Unmark this chunk as modified
        this.chunks[chunkKey].modified = false

        // Push the meshing job to the mesher worker pool
        this.mesherPool.push({
          chunk: {
            voxels: this.chunks[chunkKey].voxels
          },
          chunkKey: chunkKey,
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
      if (vox.getVoxelSolid(this.chunks, hitVoxel)) {
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
      if (vox.getVoxelSolid(this.chunks, hitVoxel)) {
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
      const chunkPosition = vox.getChunkPosition(this.chunks, chunkKey)
      const position = vox.getWorldPosition(chunkPosition, [0, 0, 0])
      gfx.set('fogColor', this.fogColor)
      // gfx.set('fogDistance', (this.loadDistance-1) * vox.CHUNK_SIZE * 1.0)
      gfx.set('fogDistance', 0.0)
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

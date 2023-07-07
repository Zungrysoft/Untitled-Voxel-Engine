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
import { meshChunk } from './workers/chunkmesher.js'

export default class Terrain extends Thing {
  time = 0
  seed = Math.floor(Math.random() * Math.pow(2, 64))
  loadDistance = 5
  chunks = {}
  chunkStates = {}
  chunkMeshes = {}
  fogColor = [0.267, 0.533, 1]

  constructor () {
    super()
    game.setThingName(this, 'terrain')

    // Spawn platform
    this.chunks[vox.ts([0,0,0])] = vox.emptyChunk()
    this.chunkStates[vox.ts([0,0,0])] = 'loaded'
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
          this.chunkMeshes[message.chunkKeyStr] = gfx.createMesh(vertsView)
        }
        // If the mesh is empty, delete its entry in the dict instead
        else {
          delete this.chunkMeshes[message.chunkKeyStr]
        }
      },
    )

    // Terrain Generators
    this.generatorPool = new WorkerPool('src/workers/chunkgenerator.js', game.config.threads,
      {
        idempotencyKeys: ['chunkKeyStr'],
      },
      (message) => {
        // Save chunk
        this.chunks[message.chunkKeyStr] = message.chunk

        // Save this chunk's initial mesh as well
        if (message.verts) {
          let vertsView = new Float32Array(message.verts);
          if (vertsView.length > 0) {
            this.chunkMeshes[message.chunkKeyStr] = gfx.createMesh(vertsView)
          }
        }

        // Set chunk state
        this.chunkStates[message.chunkKeyStr] = 'loaded'
      },
      (message) => {
        // Set chunk state
        this.chunkStates[message.chunkKeyStr] = 'loading'
      },
    )

    // Chunk Unloaders
    this.unloaderPool = new WorkerPool('src/workers/chunkunloader.js', game.config.threads,
      {
        idempotencyKeys: ['chunkKeyStr'],
      },
      (message) => {
        if (message.success) {
          // Set chunk state
          delete this.chunkStates[message.chunkKeyStr]
        }
      },
      (message) => {
        // Set chunk state
        this.chunkStates[message.chunkKeyStr] = 'unloading'

        // Delete the chunk from this object since it's now safe in the worker thread that is saving it to db
        delete this.chunks[message.chunkKeyStr]

        // Delete mesh
        delete this.chunkMeshes[message.chunkKeyStr]
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
      game.globals.debugPressed = true

      let counter = 0
      for (let i = 0; i < 30; i ++) {
        counter += meshChunk(this.chunks[vox.ts([0,0,0])], pal.palette).byteLength
      }
      console.log(counter)

      // const playerPos = game.getThing('player').position
      // console.log(this.chunks[vox.ts(vox.positionToChunkKey(playerPos))])
      // console.log(this.chunkMeshes[vox.ts(vox.positionToChunkKey(playerPos))])

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
    for (const chunkKeyStr of data.chunksToLoad) {
      if (!(chunkKeyStr in this.chunkStates)) {
        this.generatorPool.push({
          chunkKeyStr: chunkKeyStr,
          seed: this.seed,
        })
      }
    }

    // Set chunks to unload if they're loaded and not on the keep or load list
    this.unloaderPool.clearQueue()
    for (const chunkKeyStr in this.chunks) {
      if (!data.chunksToLoad.includes(chunkKeyStr) && !data.chunksToKeep.includes(chunkKeyStr)) {
        if (this.chunkStates[chunkKeyStr] === 'loaded') {
          const chunk = this.chunks[chunkKeyStr]
          this.unloaderPool.push({
            chunkKeyStr: chunkKeyStr,
            chunk: chunk,
            transfer: [chunk.voxels],
          })
        }
      }
    }
  }

  rebuildChunkMeshes() {
    // Iterate over chunks and rebuild all marked "modified"
    for (const chunkKeyStr in this.chunks) {
      if (this.chunks[chunkKeyStr].modified) {
        // Unmark this chunk as modified
        this.chunks[chunkKeyStr].modified = false

        // Push the meshing job to the mesher worker pool
        this.mesherPool.push({
          chunk: {
            voxels: this.chunks[chunkKeyStr].voxels,
            mode: this.chunks[chunkKeyStr].mode,
          },
          chunkKeyStr: chunkKeyStr,
        })
      }
    }
  }

  traceLine(traceStart, traceEnd, ignoreFirstVoxel=false) {
    return vox.traceLine(this.chunks, traceStart, traceEnd, ignoreFirstVoxel)
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
    for (const chunkKeyStr in this.chunkMeshes) {
      const chunkMesh = this.chunkMeshes[chunkKeyStr]
      const chunkPosition = vox.getChunkPosition(this.chunks, chunkKeyStr)
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

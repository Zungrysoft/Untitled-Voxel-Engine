import * as vox from '../voxel.js'
import * as pal from '../palette.js'
import { meshChunk } from './chunkmesher.js'
import { buildChunkTerrain } from '../procterrain.js'
import { readChunk } from "../database.js";

onmessage = function(e) {
  // Handle STOP message
  if (e.data === 'STOP') {
    close();
  }

  // Get parameters
  const { chunkKey, seed, workerIndex, params } = e.data

  // First, see if the chunk is already in the database
  readChunk(chunkKey, (chunk) => {
    // If the database has the chunk in it, don't generate a new one
    if (chunk) {
      loadExistingChunk(chunk, chunkKey, workerIndex)
    }
    // If the chunk isn't in the database, we need to generate it
    else {
      buildNewChunk(chunkKey, seed, workerIndex, params)
    }
  })
}

function loadExistingChunk(chunk, chunkKey, workerIndex) {
  // Mesh it
  let initialMesh = meshChunk(chunk, pal.palette)
  chunk.modified = false

  // Return
  postMessage({
    chunk: chunk,
    chunkKey: chunkKey,
    verts: initialMesh,
    workerIndex: workerIndex,
  }, [chunk.voxels, initialMesh]);
}

function buildNewChunk(chunkKey, seed, workerIndex, params) {
  // Create empty chunk
  let chunks = {}
  chunks['0,0,0'] = vox.emptyChunk()

  // Build terrain
  buildChunkTerrain(chunks, chunkKey, seed, params)

  // Now that we've generated the chunk, we should create an initial mesh for it as well
  // This saves a step since now the main thread won't have to pass the chunk data back to a mesher worker
  const chunk = chunks['0,0,0']
  if (chunk.modified) {
    // Meshing
    let initialMesh = meshChunk(chunk, pal.palette)
    chunk.modified = false

    // Return with intial mesh
    postMessage({
      chunk: chunk,
      chunkKey: chunkKey,
      verts: initialMesh,
      workerIndex: workerIndex,
    }, [chunk.voxels, initialMesh]);
  }
  else {
    // Return with no intial mesh
    postMessage({
      chunk: chunk,
      chunkKey: chunkKey,
      workerIndex: workerIndex,
    }, [chunk.voxels]);
  }
}

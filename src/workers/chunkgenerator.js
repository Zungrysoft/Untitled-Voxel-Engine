import * as vox from '../voxel.js'
import * as pal from '../palette.js'
import { meshChunk } from './chunkmesher.js'
import { buildChunkTerrain } from '../procterrain.js'
import { readChunk } from "../database.js";
import { buildChunkFoliage } from '../procfoliage.js';
import { limitPrint } from '../debug.js';

onmessage = function(e) {
  // Handle STOP message
  if (e.data === 'STOP') {
    close();
  }

  // Get parameters
  const { chunkKeyStr, seed, workerIndex, params } = e.data

  // First, see if the chunk is already in the database
  readChunk(chunkKeyStr, (chunk) => {
    // If the database has the chunk in it, don't generate a new one
    if (chunk) {
      loadExistingChunk(chunk, chunkKeyStr, workerIndex)
    }
    // If the chunk isn't in the database, we need to generate it
    else {
      buildNewChunk(chunkKeyStr, seed, workerIndex, params)
    }
  })
}

function loadExistingChunk(chunk, chunkKeyStr, workerIndex) {
  // Mesh it
  let initialMesh = meshChunk(chunk, pal.palette)
  chunk.modified = false

  // Return
  postMessage({
    chunk: chunk,
    chunkKeyStr: chunkKeyStr,
    verts: initialMesh,
    workerIndex: workerIndex,
  }, [chunk.voxels, initialMesh]);
}

function buildNewChunk(chunkKeyStr, seed, workerIndex, params) {
  // Create empty chunk
  const chunk = vox.emptyChunk();

  // Build terrain
  buildChunkTerrain(chunk, chunkKeyStr, seed, params);

  // TODO: Generate castles and dungeons, etc.

  // Populate terrain with trees, foliage, and other scattered structures
  const leftovers = {};
  buildChunkFoliage(chunk, chunkKeyStr, leftovers, seed, params);

  // Now that we've generated the chunk, we should create an initial mesh for it as well
  // This saves a step since now the main thread won't have to pass the chunk data back to a mesher worker
  if (chunk.modified) {
    // Meshing
    let initialMesh = meshChunk(chunk, pal.palette);
    chunk.modified = false;

    // Return with intial mesh
    postMessage({
      chunk: chunk,
      chunkKeyStr: chunkKeyStr,
      leftovers: leftovers,
      verts: initialMesh,
      workerIndex: workerIndex,
    }, [chunk.voxels, initialMesh]);
  }
  else {
    // Return with no intial mesh
    postMessage({
      chunk: chunk,
      chunkKeyStr: chunkKeyStr,
      leftovers: leftovers,
      workerIndex: workerIndex,
    }, [chunk.voxels]);
  }
}

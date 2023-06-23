import * as vox from '../voxel.js'
import * as u from '../core/utils.js'
import * as pal from '../palette.js'
import * as vec3 from '../core/vector3.js'
import { meshChunk } from './chunkmesher.js'
import Noise from '../noise.js'

const DIRT_DEPTH = 4
const GRASS_DEPTH = 1

onmessage = function(e) {
  // Handle STOP message
  if (e.data === 'STOP') {
    close();
  }

  // Get parameters
  const { chunkKey, seed, workerIndex } = e.data
  const params = {...{
    scale: 20,
    zScale:  0.5,
    heightScale:  14,
  }, ...(e.data.params || {})}

  // Convert chunkKey to array
  const chunkKeyArray = typeof chunkKey === 'string' ? vox.stringToArray(chunkKey) : chunkKey
  const aboveChunk = vec3.add(chunkKeyArray, [0, 0, 1])

  // Create noise object
  let noise = new Noise(seed)

  // Iterate over coords in volume
  let chunks = {}
  for (let x = 0; x < vox.CHUNK_SIZE; x ++) {
    for (let y = 0; y < vox.CHUNK_SIZE; y ++) {
      let depth = 0
      for (let z = vox.CHUNK_SIZE-1; z >= 0; z --) {
        // Get world position and perlin density at this position
        const position = vox.getWorldPosition(chunkKeyArray, [x, y, z])
        const density = getPerlinDensity(position, noise, params)

        // Build the material
        if (density > 0) {
          // If we are building a block on the top layer, trace upwards to figure out how deep we are
          if (z === vox.CHUNK_SIZE-1) {
            for (let za = 0; za < DIRT_DEPTH; za ++) {
              // Get world position and perlin density at this position
              const position = vox.getWorldPosition(aboveChunk, [x, y, za])
              const density = getPerlinDensity(position, noise, params)
              if (density > 0) {
                depth = za + 1
              }
              else {
                break
              }
            }
          }

          let material = 'grass'
          if (depth >= DIRT_DEPTH) {
            material = 'stone'
          }
          else if (depth >= GRASS_DEPTH) {
            material = 'dirt'
          }

          vox.editVoxel(chunks, [x, y, z], {solid: true, material: material})
          depth ++
        }
        else {
          depth = 0
        }
      }
    }
  }

  // If chunk was all air, initialize it anyway
  vox.forceInitChunk(chunks, [0, 0, 0])

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

function getPerlinDensity(position, noise, params) {
  const [x, y, z] = position

  const {scale, heightScale, zScale} = params

  const steepness = noise.perlin2(x/(scale*50), y/(scale*50))
  const mScale = u.map(steepness, 0, 0.9, 0, 15, true)
  const mScale2 = u.map(steepness, 0, 0.9, 0.2, 1.5, true)

  let density = noise.perlin3(x/scale, y/scale, z/(scale*zScale)) * mScale2
  density += noise.perlin3(x/(scale/4), y/(scale/4), z/((scale/4)*zScale)) / 16
  density += noise.perlin3(x/(scale*6), y/(scale*6), z/((scale*6)*1.2)) * mScale /* * 9 */
  density += (4-z)/heightScale
  density -= 0.2
  return density
}

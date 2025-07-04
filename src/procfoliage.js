import * as vox from './voxel.js'
import * as vec3 from './core/vector3.js'
import Noise from './noise.js'
import { generateTree } from './proctree.js'

export function buildChunkFoliage(chunk, chunkKeyStr, leftovers, seed, params={}) {
  const chunkKey = vox.ta(chunkKeyStr)

  // Create noise object
  let noise = new Noise(seed)

  // Iterate over coords in volume
  for (let x = 0; x < vox.CHUNK_SIZE; x ++) {
    for (let y = 0; y < vox.CHUNK_SIZE; y ++) {
      for (let z = 0; z < vox.CHUNK_SIZE; z ++) {
        const position = vox.getWorldPosition(chunkKey, [x, y, z])
        const material = vox.getVoxelMaterial(chunk, [x, y, z])

        if (material === 'grass' && noise.random(position) < 0.0001) {
          const tree = generateTree(noise, position, {})
          vox.mergeStructureIntoWorld(chunk, tree, [x, y, z])
          vox.mergeStructureIntoLeftovers(leftovers, tree, [x, y, z], [0, 0, 0])
        }
      }
    }
  }
}

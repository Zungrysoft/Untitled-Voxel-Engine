import * as u from './core/utils.js'
import * as vec3 from './core/vector3.js'

export const CHUNK_SIZE = 16
export const CHUNK_VOLUME = CHUNK_SIZE*CHUNK_SIZE*CHUNK_SIZE

export function stringToArray(s) {
  return s.split(',').map(x => Number(x))
}

export function positionToChunkKey(position) {
  return [
    Math.floor(position[0] / CHUNK_SIZE),
    Math.floor(position[1] / CHUNK_SIZE),
    Math.floor(position[2] / CHUNK_SIZE),
  ]
}

export function positionToChunkPosition(position) {
  return [
    u.mod(position[0], CHUNK_SIZE),
    u.mod(position[1], CHUNK_SIZE),
    u.mod(position[2], CHUNK_SIZE),
  ]
}

export function getWorldPosition(chunkKey, chunkPosition) {
  // Make sure the chunkKey is in array format
  if (typeof chunkKey === "string") {
    chunkKey = stringToArray(chunkKey)
  }

  return [
    chunkKey[0] * CHUNK_SIZE + chunkPosition[0],
    chunkKey[1] * CHUNK_SIZE + chunkPosition[1],
    chunkKey[2] * CHUNK_SIZE + chunkPosition[2],
  ]
}

export function chunkPositionToChunkIndex(position) {
  return position[0] + position[1]*CHUNK_SIZE + position[2]*CHUNK_SIZE*CHUNK_SIZE
}

export function chunkIndexToChunkPosition(index) {
  // X
  const x = u.mod(index, CHUNK_SIZE)

  // Y
  index = Math.floor(index / CHUNK_SIZE)
  const y = u.mod(index, CHUNK_SIZE)

  // Z
  index = Math.floor(index / CHUNK_SIZE)
  const z = index

  // Return
  return [x, y, z]
}

export function emptyVoxel() {
  return {
    material: 'structure',
    shades: [0.5, 0.3, 0.2, 0.7, 0.9, 1.0],
    solid: false,
    generatorData: {},
  }
}

export function emptyChunk() {
  let zeros
  (zeros = []).length = CHUNK_VOLUME; zeros.fill(emptyVoxel());
  return {
    voxels: zeros,
    things: [],
    modified: false,
  }
}

export function emptyStructure() {
  return {
    voxels: {},
    things: [],
    doorways: [],
  }
}

export function copyStructure(structure) {
  return {
    voxels: {...structure.voxels},
    things: [...structure.things],
    doorways: [...structure.doorways],
  }
}

export function getVoxel(chunks, position) {
  // Convert world position to chunk coordinate (key to access chunk)
  let chunkPosition = positionToChunkKey(position)

  // Get the chunk
  let chunk = chunks[chunkPosition]
  // If the chunk doesn't exist, all voxels there are assumed to be zero
  if (!chunk) {
    return emptyVoxel()
  }

  // Convert world position to the index within the chunk
  let indexInChunk = chunkPositionToChunkIndex(positionToChunkPosition(position))

  // Return the voxel
  return chunk.voxels[indexInChunk]
}

export function setVoxel(chunks, position, voxel) {
  // Convert world position to chunk coordinate (key to access chunk)
  let chunkKey = positionToChunkKey(position)

  // Get the chunk
  let chunk = chunks[chunkKey]
  // If the chunk doesn't exist, create it and edit the voxel
  if (!chunk) {
    // Set the chunk to a new empty chunk
    chunks[chunkKey] = emptyChunk()
    chunk = chunks[chunkKey]
  }

  // Convert world position to the index within the chunk
  let chunkPosition = positionToChunkPosition(position)
  let indexInChunk = chunkPositionToChunkIndex(chunkPosition)

  // Merge the new data into the voxel
  const beforeVoxel = chunk.voxels[indexInChunk]
  chunk.voxels[indexInChunk] = {...chunk.voxels[indexInChunk], ...voxel}
  const afterVoxel = chunk.voxels[indexInChunk]

  // Determine whether we should mark this chunk as modified (so it can be re-meshed)
  // If the voxel has changed solidity...
  if (beforeVoxel.solid !== afterVoxel.solid) {
    chunk.modified = true
  }
  // If the voxel is solid and has changed color...
  else if (afterVoxel.solid) {
    if (beforeVoxel.material !== afterVoxel.material || beforeVoxel.shades !== afterVoxel.shades) {
      chunk.modified = true
    }
  }

  // If we removed an edge voxel, we may need to re-mesh adjacent voxels as well
  if (beforeVoxel.solid && !afterVoxel.solid) {
    if (chunkPosition[0] === 0) {
      const adjChunk = chunks[positionToChunkKey(vec3.add(position, [-1, 0, 0]))]
      if (adjChunk) {
        adjChunk.modified = true
      }
    }
    if (chunkPosition[1] === 0) {
      const adjChunk = chunks[positionToChunkKey(vec3.add(position, [0, -1, 0]))]
      if (adjChunk) {
        adjChunk.modified = true
      }
    }
    if (chunkPosition[2] === 0) {
      const adjChunk = chunks[positionToChunkKey(vec3.add(position, [0, 0, -1]))]
      if (adjChunk) {
        adjChunk.modified = true
      }
    }

    if (chunkPosition[0] === CHUNK_SIZE-1) {
      const adjChunk = chunks[positionToChunkKey(vec3.add(position, [1, 0, 0]))]
      if (adjChunk) {
        adjChunk.modified = true
      }
    }
    if (chunkPosition[1] === CHUNK_SIZE-1) {
      const adjChunk = chunks[positionToChunkKey(vec3.add(position, [0, 1, 0]))]
      if (adjChunk) {
        adjChunk.modified = true
      }
    }
    if (chunkPosition[2] === CHUNK_SIZE-1) {
      const adjChunk = chunks[positionToChunkKey(vec3.add(position, [0, 0, 1]))]
      if (adjChunk) {
        adjChunk.modified = true
      }
    }
  }
}

export function mergeStructureIntoWorld(chunks, structure, position = [0, 0, 0], globalVoxel = {}) {
  // Global voxel is used to override certain properties of the structure's voxels

  // Iterate over voxels in structure
  for (const sPos in structure.voxels) {
    const voxel = structure.voxels[sPos]
    const deltaPos = vec3.add(position, stringToArray(sPos))
    setVoxel(chunks, deltaPos, {...voxel, ...globalVoxel})
  }
}

export function mergeStructureIntoStructure(mainStructure, structure, position = [0, 0, 0]) {
  // Offset
  structure = shiftStructure(structure, position)

  // Merge
  const ret = emptyStructure()
  ret.voxels = {...mainStructure.voxels, ...structure.voxels}
  ret.things = [...mainStructure.things, ...structure.things]
  ret.doorways = [...mainStructure.doorways, ...structure.doorways]

  // Return
  return ret
}

export function equals(voxel1, voxel2) {
  // Material
  if ('material' in voxel1 && 'material' in voxel2 && voxel1.material !== voxel2.material) {
    return false
  }

  // Shades
  if ('shades' in voxel1 && 'shades' in voxel2) {
    for (let i = 0; i < 6; i ++) {
      if (voxel1.shades[i] !== voxel2.shades[i]) {
        return false
      }
    }
  }

  // Material
  if ('solid' in voxel1 && 'solid' in voxel2 && voxel1.solid !== voxel2.solid) {
    return false
  }

  // Generator data
  if ('generatorData' in voxel1 && 'generatorData' in voxel2) {
    if (!compareGeneratorData(voxel1.generatorData, voxel2.generatorData)) {
      return false
    }
    if (!compareGeneratorData(voxel2.generatorData, voxel1.generatorData)) {
      return false
    }
  }

  return true
}

export function compareGeneratorData(generatorData, compare) {
  for (const key in compare) {
    // This key is good if both keys are falsy/nonexistant
    if (!generatorData[key] && !compare[key]) {
      continue
    }
    // This key is good if they're equal
    if (generatorData[key] === compare[key]) {
      continue
    }
    // This key is bad, return false
    return false
  }
  // All keys are good, return true
  return true
}

export function checkReservedInWorld(chunks, position, structure) {
  // Iterate over voxels in structure
  for (const sPos in structure.voxels) {
    const deltaPos = vec3.add(stringToArray(sPos), position)
    const voxel = getVoxel(chunks, deltaPos)
    const compare = {
      reserved: true
    }

    // Check if the voxel is reserved
    if (compareGeneratorData(voxel.generatorData, compare)) {
      return true
    }
  }

  return false
}

export function checkReservedInStructure(mainStructure, position, structure) {
  // Iterate over voxels in structure
  for (const sPos in structure.voxels) {
    const deltaPos = vec3.add(stringToArray(sPos), position)
    const voxel = mainStructure.voxels[deltaPos]
    if (voxel) {
      const compare = {
        reserved: true
      }

      // Check if the voxel is reserved
      if (compareGeneratorData(voxel.generatorData, compare)) {
        return true
      }
    }
  }

  return false
}

export function shiftStructure(structure, offset) {
  // Early exit if there is nothing to offset
  if (vec3.equals(offset, [0, 0, 0])) {
    return copyStructure(structure)
  }

  let ret = emptyStructure()

  // Voxels
  for (const sPos in structure.voxels) {
    const newPos = vec3.add(stringToArray(sPos), offset)
    ret.voxels[newPos] = structure.voxels[sPos]
  }

  // Things
  ret.things = [...structure.things]
  for (const thing of ret.things) {
    thing.position = vec3.add(thing.position, offset)
  }

  // Doorways
  ret.doorways = [...structure.doorways]
  for (const doorway of ret.doorways) {
    doorway.position = vec3.add(doorway.position, offset)
  }

  return ret
}

export function listVoxels(chunks) {
  let ret = []

  // Iterate over chunks
  for (const chunkKey in chunks) {
    const chunk = chunks[chunkKey]
    // Iterate over voxels in chunk
    for (let i = 0; i < CHUNK_VOLUME; i ++) {
      // Get voxel color at this index
      const voxel = chunk.voxels[i]

      // If this voxel is not air, list it
      if (voxel.solid) {
        const chunkPosition = chunkIndexToChunkPosition(i)
        const worldPosition = getWorldPosition(chunkKey, chunkPosition)
        ret.push({
          position: worldPosition,
          voxel: voxel,
        })
      }
    }
  }

  return ret
}

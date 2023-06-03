import * as u from './core/utils.js'
import * as vec3 from './core/vector3.js'

export const CHUNKSIZE = 32
export const CHUNKVOLUME = CHUNKSIZE*CHUNKSIZE*CHUNKSIZE

export function stringToArray(s) {
  return s.split(',').map(x => parseInt(x))
}

export function positionToChunkKey(position) {
  return [
    Math.floor(position[0] / CHUNKSIZE),
    Math.floor(position[1] / CHUNKSIZE),
    Math.floor(position[2] / CHUNKSIZE),
  ]
}

export function positionToChunkPosition(position) {
  return [
    u.mod(position[0], CHUNKSIZE),
    u.mod(position[1], CHUNKSIZE),
    u.mod(position[2], CHUNKSIZE),
  ]
}

export function getWorldPosition(chunkKey, chunkPosition) {
  // Make sure the chunkKey is in array format
  if (typeof chunkKey === "string") {
    chunkKey = stringToArray(chunkKey)
  }

  return [
    chunkKey[0] * CHUNKSIZE + chunkPosition[0],
    chunkKey[1] * CHUNKSIZE + chunkPosition[1],
    chunkKey[2] * CHUNKSIZE + chunkPosition[2],
  ]
}

export function chunkPositionToChunkIndex(position) {
  return position[0] + position[1]*CHUNKSIZE + position[2]*CHUNKSIZE*CHUNKSIZE
}

export function chunkIndexToChunkPosition(index) {
  // X
  const x = u.mod(index, CHUNKSIZE)

  // Y
  index = Math.floor(index / CHUNKSIZE)
  const y = u.mod(index, CHUNKSIZE)

  // Z
  index = Math.floor(index / CHUNKSIZE)
  const z = index

  // Return
  return [x, y, z]
}

export function emptyChunk() {
  let zeros
  (zeros = []).length = CHUNKVOLUME; zeros.fill(0);
  return {
    voxels: zeros,
    things: [],
    modified: false,
  }
}

export function getVoxel(chunks, position) {
  // Convert world position to chunk coordinate (key to access chunk)
  let chunkPosition = positionToChunkKey(position)

  // Get the chunk
  let chunk = chunks[chunkPosition]
  // If the chunk doesn't exist, all voxels there are assumed to be zero
  if (!chunk) {
    return 0
  }

  // Convert world position to the index within the chunk
  let indexInChunk = chunkPositionToChunkIndex(positionToChunkPosition(position))

  // Return the voxel
  return chunk.voxels[indexInChunk]
}

export function setVoxel(chunks, position, index) {
  // Convert world position to chunk coordinate (key to access chunk)
  let chunkPosition = positionToChunkKey(position)

  // Get the chunk
  let chunk = chunks[chunkPosition]
  // If the chunk doesn't exist, create it and edit the voxel
  if (!chunk) {
    // If the index is zero, early exit since this operation wouldn't have any effect on the world state.
    if (index === 0) {
      return
    }

    // Set the chunk to a new empty chunk
    chunks[chunkPosition] = emptyChunk()
    chunk = chunks[chunkPosition]
  }

  // Convert world position to the index within the chunk
  let indexInChunk = chunkPositionToChunkIndex(positionToChunkPosition(position))

  // Change the voxel
  chunk.voxels[indexInChunk] = index

  // Mark this chunk as modified so the renderer knows to rebuild it
  chunk.modified = true
}

export function mergeStructureIntoWorld(chunks, position, structure) {
  for (const sPos in structure) {
    const colorIndex = structure[sPos]
    const deltaPos = vec3.add(position, stringToArray(sPos))
    setVoxel(chunks, deltaPos, colorIndex)
  }
}

export function listVoxels(chunks) {
  let ret = []

  // Iterate over chunks
  for (const chunkKey in chunks) {
    const chunk = chunks[chunkKey]
    // Iterate over voxels in chunk
    for (let i = 0; i < CHUNKVOLUME; i ++) {
      // Get voxel color at this index
      const colorIndex = chunk.voxels[i]

      // If this voxel is not air, list it
      if (isSolid(colorIndex)) {
        const chunkPosition = chunkIndexToChunkPosition(i)
        const worldPosition = getWorldPosition(chunkKey, chunkPosition)
        ret.push({
          position: worldPosition,
          color: colorIndex,
        })
      }
    }
  }

  return ret
}

export function isSolid(colorIndex) {
  return colorIndex > 1 && colorIndex < 255
}

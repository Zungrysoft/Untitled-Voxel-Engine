export const CHUNKSIZE = 64
export const CHUNKVOLUME = CHUNKSIZE*CHUNKSIZE*CHUNKSIZE

export function getChunkPosition(position) {
  return [
    Math.floor(position[0] / CHUNKSIZE),
    Math.floor(position[1] / CHUNKSIZE),
    Math.floor(position[2] / CHUNKSIZE),
  ]
}

export function getPositionInChunk(position) {
  return [
    position[0] % CHUNKSIZE,
    position[1] % CHUNKSIZE,
    position[2] % CHUNKSIZE,
  ]
}

export function positionToInChunkIndex(position) {
  return position[0] + position[1]*CHUNKSIZE + position[2]*CHUNKSIZE*CHUNKSIZE
}

export function emptyChunk() {
  let zeros
  (zeros = []).length = CHUNKVOLUME; zeros.fill(0);
  return {
    voxels: zeros,
    things: [],
  }
}

export function getVoxel(chunks, position) {
  // Convert world position to chunk coordinate (key to access chunk)
  let chunkPosition = getChunkPosition(position)

  // Get the chunk
  let chunk = chunks[chunkPosition]
  // If the chunk doesn't exist, all voxels there are assumed to be zero
  if (!chunk) {
    return 0
  }

  // Convert world position to the index within the chunk
  let indexInChunk = positionToInChunkIndex(getPositionInChunk(position))

  // Return the voxel
  return chunk.voxels[indexInChunk]
}

export function setVoxel(chunks, position, index) {
  // Convert world position to chunk coordinate (key to access chunk)
  let chunkPosition = getChunkPosition(position)

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
  let indexInChunk = positionToInChunkIndex(getPositionInChunk(position))

  // Change the voxel
  chunk.voxels[indexInChunk] = index
}
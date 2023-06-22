import * as vox from '../voxel.js'

onmessage = function(e) {
  // Handle STOP message
  if (e.data === 'STOP') {
    close();
  }

  const { renderDistance, position } = e.data
  const r2 = renderDistance * renderDistance
  const chunkKey = vox.positionToChunkKey(position)

  const xMin = chunkKey[0]-renderDistance
  const xMax = chunkKey[0]+renderDistance
  const xAvg = chunkKey[0]
  const yMin = chunkKey[1]-renderDistance
  const yMax = chunkKey[1]+renderDistance
  const yAvg = chunkKey[1]
  const zMin = chunkKey[2]-renderDistance
  const zMax = chunkKey[2]+renderDistance
  const zAvg = chunkKey[2]

  // Iterate over renderDistance sphere
  let ret = []
  for (let x = xMin; x <= xMax; x ++) {
    for (let y = yMin; y <= yMax; y ++) {
      for (let z = zMin; z <= zMax; z ++) {
        // If this chunk is within the render sphere, push it to the stack
        const dist = Math.pow(x-xAvg, 2) + Math.pow(y-yAvg, 2) + Math.pow(z-zAvg, 2)
        if (dist <= r2) {
          ret.push([x, y, z])
        }
      }
    }
  }
  ret.push(chunkKey)

  postMessage(ret);
}

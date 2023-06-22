import * as vox from '../voxel.js'

onmessage = function(e) {
  // Handle STOP message
  if (e.data === 'STOP') {
    close();
  }

  const { renderDistance, position } = e.data
  const r2 = (renderDistance + 0.5) * (renderDistance + 0.5)
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
      // If this horizontal position is within the render cylinder, iterate over z
      const dist = Math.pow(x-xAvg, 2) + Math.pow(y-yAvg, 2)
      if (dist <= r2) {
        for (let z = zMin; z <= zMax; z ++) {
          ret.push([x, y, z])
        }
      }
    }
  }
  ret.push(chunkKey)

  postMessage(ret);
}

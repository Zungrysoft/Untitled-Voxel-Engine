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

  // Iterate over renderDistance sphere in a spiral pattern
  let ret = []
  let x = 0
  let y = 0
  const turns = (renderDistance * 4) + 1
  for (let t = 0; t < turns; t ++) {
    const steps = Math.floor(t/2) + 1
    for (let s = 0; s < steps; s ++) {
      // If this horizontal position is within the render cylinder, iterate over z
      const dist = Math.pow(x-xAvg, 2) + Math.pow(y-yAvg, 2)
      if (dist <= r2) {
        for (let z = zMin; z <= zMax; z ++) {
          ret.push([x, y, z])
        }
      }

      // Step in direction
      if (t % 4 === 0) x ++;
      else if (t % 4 === 1) y ++;
      else if (t % 4 === 2) x --;
      else if (t % 4 === 3) y --;
    }
  }

  ret.push(chunkKey)

  postMessage(ret);
}

import * as vox from '../voxel.js'

onmessage = function(e) {
  // Handle STOP message
  if (e.data === 'STOP') {
    close();
  }

  const { renderDistance, keepDistance, position } = e.data
  const r2 = (renderDistance + 0.5) * (renderDistance + 0.5)
  const chunkKey = vox.positionToChunkKey(position)

  const xAvg = chunkKey[0]
  const yAvg = chunkKey[1]
  const zAvg = chunkKey[2]

  // Iterate over renderDistance sphere in a spiral pattern
  let ret = []
  let x = xAvg
  let y = yAvg
  const turns = (renderDistance * 4) + 1
  for (let t = 0; t < turns; t ++) {
    const steps = Math.floor(t/2) + 1
    for (let s = 0; s < steps; s ++) {
      // If this horizontal position is within the render cylinder, iterate over z
      const dist = Math.pow(x-xAvg, 2) + Math.pow(y-yAvg, 2)
      if (dist <= r2) {
        ret.push([x, y, zAvg])
        for (let z = 1; z <= renderDistance; z ++) {
          ret.push([x, y, zAvg-z])
          ret.push([x, y, zAvg+z])
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

  postMessage({
    chunksToLoad: ret,
    chunksToKeep: [],
  });
}

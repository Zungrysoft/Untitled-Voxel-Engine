import * as vox from '../voxel.js'

onmessage = function(e) {
  // Handle STOP message
  if (e.data === 'STOP') {
    close();
  }

  const { loadDistance, keepDistance, position } = e.data
  const r2 = (loadDistance + 0.5) * (loadDistance + 0.5)
  const k2 = (keepDistance + 0.5) * (keepDistance + 0.5)
  const chunkKey = vox.positionToChunkKey(position)

  const xAvg = chunkKey[0]
  const yAvg = chunkKey[1]
  const zAvg = chunkKey[2]

  // Iterate over loadDistance sphere in a spiral pattern
  let chunksToLoad = []
  let chunksToKeep = []
  let x = xAvg
  let y = yAvg
  const turns = (keepDistance * 4) + 1
  for (let t = 0; t < turns; t ++) {
    const steps = Math.floor(t/2) + 1
    for (let s = 0; s < steps; s ++) {
      // If this horizontal position is within the load cylinder, load it
      const dist = Math.pow(x-xAvg, 2) + Math.pow(y-yAvg, 2)
      if (dist <= r2) {
        chunksToLoad.push([x, y, zAvg].toString())
        for (let z = 1; z <= loadDistance; z ++) {
          chunksToLoad.push([x, y, zAvg-z].toString())
          chunksToLoad.push([x, y, zAvg+z].toString())
        }
      }
      // Keep cylinder
      else if (dist <= k2) {
        chunksToKeep.push([x, y, zAvg].toString())
        for (let z = 1; z <= loadDistance; z ++) {
          chunksToKeep.push([x, y, zAvg-z].toString())
          chunksToKeep.push([x, y, zAvg+z].toString())
        }
      }

      // Step in direction
      if (t % 4 === 0) x ++;
      else if (t % 4 === 1) y ++;
      else if (t % 4 === 2) x --;
      else if (t % 4 === 3) y --;
    }
  }

  postMessage({
    chunksToLoad: chunksToLoad,
    chunksToKeep: chunksToKeep,
  });
}

import * as vox from '../voxel.js'

// This worker makes a list of chunks that should be loaded and should be kept loaded based on a position and load distance
// It uses a cylinder shape that spirals out from the center to prioritize loading closest to the player first
// There is a bigger cylinder that represents chunks that should be kept loaded but only if they're already loaded
onmessage = function(e) {
  // Handle STOP message
  if (e.data === 'STOP') {
    close();
  }

  const { loadDistance, position } = e.data

  // Set dependent parameters
  const keepDistance = loadDistance + 2
  const r2 = (loadDistance + 0.5) * (loadDistance + 0.5)
  const k2 = (keepDistance + 0.5) * (keepDistance + 0.5)
  const loadDistanceVertical = Math.floor(Math.min(loadDistance, 2 + (loadDistance/4)))
  const keepDistanceVertical = loadDistanceVertical + 2
  const chunkKey = vox.positionToChunkKey(position)

  const xAvg = chunkKey[0]
  const yAvg = chunkKey[1]
  const zAvg = chunkKey[2]

  // Iterate over loadDistance sphere in a spiral pattern
  let chunksToLoad = []
  let chunksToKeep = []
  let x = xAvg
  let y = yAvg
  // t represents the current turn. Four turns per chunk outward.
  // s represents steps as part of a turn. Turns get longer the further out we spiral.
  const turns = (keepDistance * 4) + 1
  for (let t = 0; t < turns; t ++) {
    const steps = Math.floor(t/2) + 1
    for (let s = 0; s < steps; s ++) {
      // If this horizontal position is within the load cylinder...
      const dist = Math.pow(x-xAvg, 2) + Math.pow(y-yAvg, 2)
      if (dist <= r2) {
        // Add all of the chunks in this column, center outward
        chunksToLoad.push(vox.ts([x, y, zAvg]))
        for (let z = 1; z <= keepDistanceVertical; z ++) {
          // Check whether the vertical position is within the load cylinder
          if (z <= loadDistanceVertical) {
            chunksToLoad.push(vox.ts([x, y, zAvg-z]))
            chunksToLoad.push(vox.ts([x, y, zAvg+z]))
          }
          // If it's too high or low, it's part of the keep cylinder
          else {
            chunksToKeep.push(vox.ts([x, y, zAvg-z]))
            chunksToKeep.push(vox.ts([x, y, zAvg+z]))
          }
        }
      }
      // Else if this horizontal position is within the keep cylinder...
      else if (dist <= k2) {
        // Add all of the chunks in this column, center outward
        chunksToKeep.push(vox.ts([x, y, zAvg]))
        for (let z = 1; z <= keepDistanceVertical; z ++) {
          chunksToKeep.push(vox.ts([x, y, zAvg-z]))
          chunksToKeep.push(vox.ts([x, y, zAvg+z]))
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

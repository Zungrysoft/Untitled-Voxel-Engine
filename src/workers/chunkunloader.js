import { writeChunk } from "../database.js";

onmessage = function(e) {
  // Handle STOP message
  if (e.data === 'STOP') {
    close();
  }

  // Retrieve data
  const { chunkKey, chunk, workerIndex } = e.data

  // Make database write
  writeChunk(chunkKey, chunk, (success) => {
    postMessage({
      success: success,
      chunkKey: chunkKey,
      workerIndex: workerIndex,
    });
  })
}

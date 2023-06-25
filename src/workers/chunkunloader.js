import { writeChunk } from "../database.js";

onmessage = function(e) {
  // Handle STOP message
  if (e.data === 'STOP') {
    close();
  }

  // Retrieve data
  const { chunkKeyStr, chunk, workerIndex } = e.data

  // Make database write
  writeChunk(chunkKeyStr, chunk, (success) => {
    postMessage({
      success: success,
      chunkKeyStr: chunkKeyStr,
      workerIndex: workerIndex,
    });
  })
}

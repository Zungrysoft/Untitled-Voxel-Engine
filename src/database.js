export function openDatabase(callback) {
  // Database setup
  const request = indexedDB.open("save0", 1)

  request.onerror = function(e) {
    console.error("Error in opening the database ")
    callback(undefined)
  }

  request.onupgradeneeded = function(e) {
    let db = e.target.result
    db.createObjectStore('chunks', {keyPath: 'chunkKey'})
  }

  request.onsuccess = function(e) {
    let db = e.target.result
    callback(db)
  }
}

export function flush(callback) {
  // Delete the database
  let deleteRequest = indexedDB.deleteDatabase("save0")

  deleteRequest.onsuccess = function() {
    callback(true)
  }

  deleteRequest.onerror = function(e) {
    console.error('Error deleting database', e)
    callback(false)
  }
}

export function readChunk(chunkKey, callback) {
  openDatabase((db) => {
    if (db) {
      const transaction = db.transaction('chunks', 'readonly')
      const store = transaction.objectStore('chunks')

      const idQuery = store.get(chunkKey)
      idQuery.onsuccess = function(e) {
        // Close database connection
        db.close()

        // Return result
        const chunk = e.target.result
        if (chunk) {
          delete chunk.chunkKey
          callback(chunk)
        }
        else {
          callback(undefined)
        }
      }
    }
    else {
      callback(false)
    }
  })
}

export function writeChunk(chunkKey, chunk, callback) {
  openDatabase((db) => {
    if (db) {
      const transaction = db.transaction('chunks', 'readwrite')
      const store = transaction.objectStore('chunks')

      store.put({ chunkKey: chunkKey, ...chunk })

      transaction.oncomplete = function(e) {
        db.close()
        callback(true)
      }
    }
    else {
      callback(false)
    }
  })
}


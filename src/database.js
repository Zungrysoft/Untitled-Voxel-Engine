export function openDatabase(callback) {
  // Database setup
  const request = indexedDB.open("save0", 1)

  request.onerror = function(e) {
    console.error("Error in opening the database ")
    callback(undefined)
  }

  request.onupgradeneeded = function(e) {
    let db = e.target.result
    db.createObjectStore('chunks', {keyPath: 'chunkKeyStr'})
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

export function readChunk(chunkKeyStr, callback) {
  openDatabase((db) => {
    if (db) {
      const transaction = db.transaction('chunks', 'readonly')
      const store = transaction.objectStore('chunks')

      const idQuery = store.get(chunkKeyStr)
      idQuery.onsuccess = function(e) {
        // Close database connection
        db.close()

        // Return result
        const chunk = e.target.result
        if (chunk) {
          delete chunk.chunkKeyStr
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

export function writeChunk(chunkKeyStr, chunk, callback) {
  openDatabase((db) => {
    if (db) {
      const transaction = db.transaction('chunks', 'readwrite')
      const store = transaction.objectStore('chunks')

      store.put({ chunkKeyStr: chunkKeyStr, ...chunk })

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


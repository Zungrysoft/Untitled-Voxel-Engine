class SpatialHash {
  // size of one chunk
  size = 256

  // maps from chunk coord name to a list of things that exist inside it
  hash = {}

  // maps from a thing reference to a list of chunks where that thing exists
  // this is because a thing can overlap multiple chunks at once
  things = new Map()

  // maps from a thing reference to the hitbox of that thing
  hitboxes = new Map()

  constructor (size = 64) {
    this.size = size
  }

  cellCoord (x, y) {
    return [
      Math.floor(x / this.size),
      Math.floor(y / this.size)
    ]
  }

  add (thing, x, y, width, height) {
    this.hitboxes.set(thing, [x, y, width, height])

    const start = this.cellCoord(x, y)
    const end = this.cellCoord(x + width, y + height)
    for (let x = start[0]; x <= end[0]; x++) {
      for (let y = start[1]; y <= end[1]; y++) {
        const key = [x, y]

        // add this thing to this chunk
        if (!this.hash[key]) this.hash[key] = []
        this.hash[key].push(thing)

        // add this chunk to the things map
        if (!this.things.has(thing)) this.things.set(thing, [])
        this.things.get(thing).push(key)
      }
    }
  }

  remove (thing) {
    if (!this.things.has(thing)) {
      console.error(`thing ${thing.constructor.name} is not in this spatial hash!`)
      return
    }

    for (const key of this.things.get(thing)) {
      this.hash[key].splice(this.hash[key].indexOf(thing), 1)

      if (this.hash[key].length === 0) {
        delete this.hash[key]
      }
    }

    this.things.delete(thing)
    this.hitboxes.delete(thing)
  }

  getHitbox (thing) {
    return this.hitboxes.get(thing)
  }

  update (thing, x, y, width, height) {
    this.remove(thing)
    this.add(thing, x, y, width, height)
  }

  query (x, y, width, height) {
    const results = []
    const start = this.cellCoord(x, y)
    const end = this.cellCoord(x + width, y + height)
    for (let x = start[0]; x <= end[0]; x++) {
      for (let y = start[1]; y <= end[1]; y++) {
        results.push(...(this.hash[[x, y]] ?? []))
      }
    }
    return results
  }
}

export default SpatialHash

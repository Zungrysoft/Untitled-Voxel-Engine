import * as vox from './voxel.js'
import * as vec3 from './core/vector3.js'
import * as procBasics from './procbasics.js'

export const MANSION_ATTEMPTS = 10

export function generateMansion({
  width=100,
  length=100,
  height=50,
  roomWidth=15,
  roomLength=15,
  roomHeight=11,
  possibilities={}
}) {
  // Figure out the number of rooms based on dimensions
  const roomsX = Math.floor(width/roomWidth)
  const roomsY = Math.floor(length/roomLength)
  const roomsZ = Math.floor(height/roomHeight)

  // Create more possibilities by rotating and flipping existing possibilites
  const expandedPossibilities = expandPossibilities(possibilities)

  // Solve the mansion
  let attemptResult = false
  for (let i = 0; i < MANSION_ATTEMPTS; i ++) {
    attemptResult = attemptMansion(roomsX, roomsY, roomsZ, expandedPossibilities)
    if (attemptResult) {
      break
    }
  }

  // If the mansion is still unsolved after several attempts, go with the backup, guaranteed solution
  if (!attemptResult) {
    attemptResult = attemptMansion(roomsX, roomsY, roomsZ, expandedPossibilities, true)
  }

  // Construct the mansion
  let ret = vox.emptyStructure()
  for (let x = 0; x < roomsX; x ++) {
    for (let y = 0; y < roomsY; y ++) {
      for (let z = 0; z < roomsZ; z ++) {
        const structure = attemptResult.cells[[x, y, z]].possibilities[0]
        const position = [
          x*roomWidth,
          y*roomLength,
          z*roomHeight,
        ]
        ret = vox.mergeStructureIntoStructure(ret, structure, position)
      }
    }
  }

  // Return
  return ret
}

function attemptMansion(roomsX, roomsY, roomsZ, possibilities, mustSucceed=true) {
  // Create the grid
  let grid = {
    width: roomsX,
    length: roomsY,
    height: roomsZ,
    cells: {}
  }
  for (let x = 0; x < roomsX; x ++) {
    for (let y = 0; y < roomsY; y ++) {
      for (let z = 0; z < roomsZ; z ++) {
        grid.cells[[x, y, z]] = {
          possibilities: [...possibilities],
          picked: false,
        }
      }
    }
  }

  // Remove structures that are disallowed by the edge
  const matchOnSide = (possibilities, face, pattern) => {
    // Empty string always matches
    if (pattern === '') {
      return
    }

    for (let i = possibilities.length-1; i >= 0; i --) {
      if (possibilities[i].connections[face].type !== '') {
        if (possibilities[i].connections[face].type !== pattern) {
          // console.log("Removed possibility " + possibilities[i].assetName + " - " + possibilities[i].connections[face].type + " - " + pattern)
          possibilities.splice(i, 1)
        }
      }
    }
  }
  const edgePattern = ['air', 'air', 'air', 'air', 'air', 'flat']
  for (let x = 0; x < roomsX; x ++) {
    for (let y = 0; y < roomsY; y ++) {
      for (let z = 0; z < roomsZ; z ++) {
        const position = [x, y, z]
        // console.log("Edge-checking at " + position)
        let shouldPropagate = false
        if (x === 0) {
          matchOnSide(grid.cells[position].possibilities, 0, edgePattern[3])
          shouldPropagate = true
        }
        if (y === 0) {
          matchOnSide(grid.cells[position].possibilities, 1, edgePattern[4])
          shouldPropagate = true
        }
        if (z === 0) {
          matchOnSide(grid.cells[position].possibilities, 2, edgePattern[5])
          shouldPropagate = true
        }
        if (x === roomsX-1) {
          matchOnSide(grid.cells[position].possibilities, 3, edgePattern[0])
          shouldPropagate = true
        }
        if (y === roomsY-1) {
          matchOnSide(grid.cells[position].possibilities, 4, edgePattern[1])
          shouldPropagate = true
        }
        if (z === roomsZ-1) {
          matchOnSide(grid.cells[position].possibilities, 5, edgePattern[2])
          shouldPropagate = true
        }
        if (shouldPropagate) {
          propagateChanges(grid, position)
        }
      }
    }
  }

  // Run the algorithm
  const iterations = roomsX * roomsY * roomsZ
  for (let i = 0; i < iterations; i ++) {
    // Pick the cell to change
    const position = pickNextCell(grid)
    grid.cells[position].picked = true

    // Pick a structure at that cell
    const pickedStructure = procBasics.pickStructure(grid.cells[position].possibilities)
    grid.cells[position].possibilities = [pickedStructure]
    // console.log("Picked " + pickedStructure.assetName + " at " + position)

    // Propagate this cell's changes
    propagateChanges(grid, position)
  }

  // Return the resulting grid
  return grid
}

function propagateChanges(grid, position) {
  // If position is out of grid bounds, exit
  if (!vec3.withinBounds(position, [0, 0, 0], [grid.width, grid.length, grid.height])) {
    return
  }
  // console.log("Propagating changes from " + position)

  // Iterate over directions to propagate to
  for (const direction of vec3.allDirections()) {
    // Propagate changes in the current position to the neighbor
    const newPos = vec3.add(position, vec3.directionToVector(direction))
    const changed = removeFromNeighbor(grid, position, direction)

    // If this cell was changed, we need to propagate further
    if (changed) {
      propagateChanges(grid, newPos)
    }
  }
}

function removeFromNeighbor(grid, position, direction) {
  // If position is out of grid bounds, exit
  if (!vec3.withinBounds(position, [0, 0, 0], [grid.width, grid.length, grid.height])) {
    return 0
  }

  // Get position of neighbor
  const delta = vec3.directionToVector(direction)
  const neighborPos = vec3.add(position, delta)

  // If neighbor position is out of grid bounds, exit
  if (!vec3.withinBounds(neighborPos, [0, 0, 0], [grid.width, grid.length, grid.height])) {
    return 0
  }

  // If the neighbor has already been picked, exit
  if (grid.cells[neighborPos].picked) {
    return 0
  }

  // Track if whether we made any changes to the grid
  let changesMade = 0

  // Iterate over possibilites in the neighbor cell
  for (let i = grid.cells[neighborPos].possibilities.length-1; i >= 0; i --) {
    // Loop over possibilites in this cell
    let found = false
    for (let j = 0; j < grid.cells[position].possibilities.length; j ++) {
      // Check if these two structures have a matching connection
      const connectionTo = grid.cells[neighborPos].possibilities[i].connections[vec3.directionToIndex(vec3.oppositeDirection(direction))]
      const connectionFrom = grid.cells[position].possibilities[j].connections[vec3.directionToIndex(direction)]
      if (connectionMatches(connectionTo, connectionFrom)) {
        found = true
        break
      }
    }

    // If we didn't find any matches for this structure, remove it
    // But don't remove it if it's the only possibility left
    if (!found && grid.cells[neighborPos].possibilities.length > 1) {
      // console.log("Removed possibility " + grid.cells[neighborPos].possibilities[i].assetName + " at position " + neighborPos)

      grid.cells[neighborPos].possibilities.splice(i, 1)
      changesMade ++
    }
  }

  // Return number of possibilities removed
  return changesMade
}

function connectionMatches(a, b) {
  // Empty string always matches
  if (a.type === '' || b.type === '') {
    return true
  }

  // Confirm the types match
  if (a.type !== b.type) {
    return false
  }

  // Confirm plug modes are different
  if (a.mode && b.mode) {
    if (a.mode !== b.mode) {
      return false
    }
  }

  // Confirm symmetry
  if (a.symmetry && b.symmetry) {
    for (let i = 0; i < 4; i ++) {
      if (a.symmetry[i] !== b.symmetry[i]) {
        return false
      }
    }
  }
  return true
}

function pickNextCell(grid) {
  let bestCount = Infinity
  let bestPos = [0, 0, 0]
  let bestFound = 1

  // Iterate over all positions
  for (let x = 0; x < grid.width; x ++) {
    for (let y = 0; y < grid.length; y ++) {
      for (let z = 0; z < grid.height; z ++) {
        const position = [x, y, z]
        const count = grid.cells[position].possibilities.length

        // If this cell has already been picked, don't consider it
        if (grid.cells[position].picked) {
          continue
        }

        // If this cell has zero possibilities, it's already a lost cause so disregard it
        if (count === 0) {
          continue
        }

        // If it's as good as the current best, has a chance to become the new best
        if (count === bestCount) {
          bestFound ++
          if (Math.random() < 1.0/bestFound) {
            bestPos = position
          }
        }

        // Better than the current best
        if (count < bestCount) {
          bestCount = count
          bestPos = position
          bestFound = 1
        }
      }
    }
  }

  // Return the best one found
  return bestPos
}

function expandPossibilities(possibilities) {
  let ret = []

  // Include all four rotations of each structure
  for (const possibility of possibilities) {
    ret.push(possibility)
    ret.push(vox.transformStructure(possibility, [
      {
        mode: 'rotate',
        origin: [2, 2, 0],
        amount: 1,
      }
    ]))
    ret.push(vox.transformStructure(possibility, [
      {
        mode: 'rotate',
        origin: [2, 2, 0],
        amount: 2,
      }
    ]))
    ret.push(vox.transformStructure(possibility, [
      {
        mode: 'rotate',
        origin: [2, 2, 0],
        amount: 3,
      }
    ]))
  }
  return ret
}

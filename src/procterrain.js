import * as vox from './voxel.js'
import { add, scale } from './core/vector2.js'
import Noise from './noise.js'

const ROUGHNESS_CONSTANT = 0.5
const SMOOTHING_ITERATIONS = 3

export function generateDiamondSquareTerrain ({width=10, length=10, height=1, variance=14, roughness=0.4, voxel={}}) {
  // Determine how big of a grid we'll need for the requested size
  const greater = Math.max(width, length)
  let size = 2
  while (size + 1 < greater) {
    size *= 2
  }
  size += 1

  // Build the initial object
  let terrain = {}
  terrain[[0, 0]] = diamondSquareRandomize(variance)
  terrain[[0, size - 1]] = diamondSquareRandomize(variance)
  terrain[[size - 1, 0]] = diamondSquareRandomize(variance)
  terrain[[size - 1, size - 1]] = diamondSquareRandomize(variance)

  // Run the algorithm
  let moveDistance = size-1
  let varianceFactor = variance
  while (moveDistance > 1) {
    diamondSquareIterate(terrain, size, moveDistance, varianceFactor, 1)
    moveDistance /= 2
    varianceFactor *= roughness
    diamondSquareIterate(terrain, size, moveDistance, varianceFactor, 0)
  }

  // Round the tile heights to integer
  let terrainLeveled = {}
  for (let x = 0; x < width; x ++) {
    for (let y = 0; y < length; y ++) {
      if ([x, y] in terrain) {
        terrainLeveled[[x, y]] = Math.ceil(terrain[[x, y]])
      }
    }
  }

  // Smoothing step to prevent one-tile holes
  smooth(terrainLeveled, SMOOTHING_ITERATIONS)

  // Convert the 2D heightmap into actual terrain
  let ret = vox.emptyStructure()
  for (let x = 0; x < width; x ++) {
    for (let y = 0; y < length; y ++) {
      if ([x, y] in terrain) {
        const tileHeight = terrainLeveled[[x, y]] + height
        for (let z = 0; z < tileHeight; z ++) {
          ret.voxels[[x, y, z]] = voxel
        }
      }
    }
  }

  // Return
  return ret
}

function smooth (terrain, iterations) {
  for (let i = 0; i < iterations; i++) {
    smoothIteration(terrain)
  }
}

function smoothIteration (terrain) {
  const deltas = [[0, 1], [1, 0], [0, -1], [-1, 0]]

  for (const key in terrain) {
    // Count the number of adjacent spaces with greater height
    let countHigher = 0
    let countLower = 0
    const pos = vox.stringToArray(key)
    for (const delta of deltas) {
      const samplePos = add(pos, delta)

      if (samplePos in terrain) {
        const here = terrain[pos]
        const there = terrain[samplePos]

        // Count spaces
        if (here < there) {
          countHigher += 1
        }
        if (here > there) {
          countLower += 1
        }
      }
    }

    // If this is a gap, fill it
    if (countHigher >= 4) {
      terrain[pos] += 1
    }
    if (countLower >= 3) {
      terrain[pos] -= 1
    }
  }
}

function diamondSquareIterate (terrain, size, moveDistance, variance, mode) {
  // Create delta pattern
  let deltas = []
  let deltaScale = 0
  let offset = 0
  // diamond
  if (mode === 0) {
    deltas = [[0, 1], [1, 0], [0, -1], [-1, 0]]
    deltaScale = moveDistance
  } else {
    // square
    deltas = [[1, 1], [-1, 1], [1, -1], [-1, -1]]
    deltaScale = Math.floor(moveDistance / 2)
    offset = deltaScale
  }

  // Loop over the terrain pattern
  for (let i = offset; i < size; i += moveDistance) {
    for (let j = offset; j < size; j += moveDistance) {
      const pos = [i, j]
      // Make sure this point hasn't already been set
      if (!(pos in terrain)) {
        let count = 0
        let total = 0

        // Collect the four parent points for the average
        for (const delta of deltas) {
          const samplePos = add(pos, scale(delta, deltaScale))
          if (samplePos in terrain) {
            count += 1
            total += terrain[samplePos]
          }
        }

        // Average the four (or fewer) samples and add the random value
        if (count > 0) {
          const value = total / count + diamondSquareRandomize(variance)
          terrain[pos] = value
        }
      }
    }
  }
}

function diamondSquareRandomize (variance) {
  return (Math.random() - 0.5) * variance * ROUGHNESS_CONSTANT
}

export function generateTerrain(seed, {minPosition=[0, 0, 0], maxPosition=[16, 16, 16], scale=16}) {
  // Initialize structure
  let ret = vox.emptyStructure()

  // Create noise object
  let noise = new Noise(seed)

  // Fix min and max coords
  let xMin = Math.min(minPosition[0], maxPosition[0])
  let yMin = Math.min(minPosition[1], maxPosition[1])
  let zMin = Math.min(minPosition[2], maxPosition[2])
  let xMax = Math.max(minPosition[0], maxPosition[0])
  let yMax = Math.max(minPosition[1], maxPosition[1])
  let zMax = Math.max(minPosition[2], maxPosition[2])

  // Iterate over coords in volume
  for (let x = xMin; x <= xMax; x++) {
    for (let y = yMin; y <= yMax; y++) {
      for (let z = zMin; z <= zMax; z++) {
        const density = noise.perlin3(x/scale, y/scale, z/scale)
        if (density > 0) {
          ret.voxels[[x, y, z]] = {solid: true, material: 'dirt'}
        }
        else if (density > -0.1) {
          ret.voxels[[x, y, z]] = {solid: true, material: 'grass'}
        }
      }
    }
  }

  // Return
  return ret
}

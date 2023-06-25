import * as vox from './voxel.js'
import * as vec3 from './core/vector3.js'
import * as u from './core/utils.js'
import { add, scale } from './core/vector2.js'
import Noise from './noise.js'

const ROUGHNESS_CONSTANT = 0.5
const SMOOTHING_ITERATIONS = 3

const DIRT_DEPTH = 4
const GRASS_DEPTH = 1

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

export function buildChunkTerrain(chunks, chunkKey, seed, params={}) {
  // Convert chunkKey to array
  const chunkKeyArray = typeof chunkKey === 'string' ? vox.stringToArray(chunkKey) : chunkKey
  const aboveChunk = vec3.add(chunkKeyArray, [0, 0, 1])

  // Create noise object
  let noise = new Noise(seed)

  // Iterate over coords in volume
  for (let x = 0; x < vox.CHUNK_SIZE; x ++) {
    for (let y = 0; y < vox.CHUNK_SIZE; y ++) {
      let depth = 0
      for (let z = vox.CHUNK_SIZE-1; z >= 0; z --) {
        // Get world position and perlin density at this position
        const position = vox.getWorldPosition(chunkKeyArray, [x, y, z])
        const density = getPerlinDensity(position, noise, params)

        // Build the material
        if (density > 0) {
          // If we are building a block on the top layer, trace upwards to figure out how deep we are
          if (z === vox.CHUNK_SIZE-1) {
            for (let za = 0; za < DIRT_DEPTH; za ++) {
              // Get world position and perlin density at this position
              const position = vox.getWorldPosition(aboveChunk, [x, y, za])
              const density = getPerlinDensity(position, noise, params)
              if (density > 0) {
                depth = za + 1
              }
              else {
                break
              }
            }
          }

          let material = 'grass'
          if (depth >= DIRT_DEPTH) {
            material = 'stone'
          }
          else if (depth >= GRASS_DEPTH) {
            material = 'dirt'
          }

          vox.editVoxel(chunks, [x, y, z], {solid: true, material: material})
          depth ++
        }
        else {
          depth = 0
        }
      }
    }
  }
}

function getPerlinDensity(position, noise, {scale=20, zScale=0.5, heightScale=14}) {
  const [x, y, z] = position

  const steepness = noise.perlin2(x/(scale*50), y/(scale*50))
  const mScale = u.map(steepness, 0, 0.9, 0.7, 15, true)
  const mScale2 = u.map(steepness, 0, 0.9, 0.1, 1.5, true)
  const mScale3 = u.map(steepness, 0, 0.9, 0.3, 1.1, true)

  let density = 0
  density += noise.perlin3(x/(scale/4), y/(scale/4), z/((scale/4)*zScale)) * 0.06 * mScale3
  density += noise.perlin3(x/scale, y/scale, z/(scale*zScale)) * mScale2
  density += noise.perlin3(x/(scale*6), y/(scale*6), z/((scale*6)*1.2)) * mScale /* * 9 */
  density += (4-z)/heightScale
  density -= 0.2
  return density
}

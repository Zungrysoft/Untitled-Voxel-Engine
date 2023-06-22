import * as vox from '../voxel.js'
import * as vec3 from '../core/vector3.js'
import Noise from '../noise.js'

onmessage = function(e) {
  // Handle STOP message
  if (e.data === 'STOP') {
    close();
  }

  // Get parameters
  const {chunkKey, seed} = e.data
  const params = {...{
    scale: 20,
    zScale:  0.5,
    heightScale:  14,
  }, ...(e.data.params || {})}

  // Convert chunkKey to array
  const chunkKeyArray = typeof chunkKey === 'string' ? vox.stringToArray(chunkKey) : chunkKey
  const aboveChunk = vec3.add(chunkKeyArray, [0, 0, 1])

  // Create noise object
  let noise = new Noise(seed)

  // Iterate over coords in volume
  let chunks = {}
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
            for (let za = 0; za < 4; za ++) {
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
          if (depth > 3) {
            material = 'stone'
          }
          else if (depth > 0) {
            material = 'dirt'
          }

          vox.setVoxel(chunks, [x, y, z], {solid: true, material: material})
          depth ++
        }
        else {
          depth = 0
        }
      }
    }
  }

  // If chunk was all air, initialize it anyway
  vox.forceInitChunk(chunks, [0, 0, 0])

  // Return
  postMessage({
    chunk: chunks['0,0,0'],
    chunkKey: chunkKey,
  });
}

function getPerlinDensity(position, noise, params) {
  const [x, y, z] = position

  const {scale, heightScale, zScale} = params

  let density = noise.perlin3(x/scale, y/scale, z/(scale*zScale))
  density += noise.perlin3(x/(scale/4), y/(scale/4), z/((scale/4)*zScale)) / 16
  density += noise.perlin3(x/(scale*6), y/(scale*6), z/((scale*6)/zScale)) * 12
  density += (4-z)/heightScale
  density -= 0.2
  return density
}

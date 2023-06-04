import * as vox from './voxel.js'

export function generateRectangularPrism({width=1, length=1, height=1, voxel={}}) {
  let ret = {}
  for (let x = 0; x < width; x ++) {
    for (let y = 0; y < length; y ++) {
      for (let z = 0; z < height; z ++) {
        ret[[x, y, z]] = voxel
      }
    }
  }
  return ret
}

export function applyPattern(structure, {materialMask=undefined, pattern='flat', voxel1={}, voxel2={}}) {
  let ret = JSON.parse(JSON.stringify(structure))

  const patternMap = {
    flat: () => false,
    checker: (pos) => (pos[0] + pos[1] + pos[2]) % 2,
  }

  for (const position in ret) {
    if (materialMask === undefined || ret[position].material === materialMask) {
      ret[position] = patternMap[pattern](vox.stringToArray(position)) ? voxel2 : voxel1
    }
  }

  return ret
}


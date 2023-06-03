import * as vox from './voxel.js'

export function generateRectangularPrism({width=1, length=1, height=1, colorIndex=2}) {
  let ret = {}
  for (let x = 0; x < width; x ++) {
    for (let y = 0; y < length; y ++) {
      for (let z = 0; z < height; z ++) {
        ret[[x, y, z]] = colorIndex
      }
    }
  }
  return ret
}

export function applyPattern(structure, {colorMask=2, pattern='flat', color1=30, color2=31}) {
  let ret = JSON.parse(JSON.stringify(structure))

  const patternMap = {
    flat: () => false,
    checker: (pos) => (pos[0] + pos[1] + pos[2]) % 2,
  }

  for (const position in ret) {
    if (ret[position] === colorMask) {
      ret[position] = patternMap[pattern](vox.stringToArray(position)) ? color2 : color1
    }
  }

  return ret
}


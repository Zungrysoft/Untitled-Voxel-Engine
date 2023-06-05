import * as vox from './voxel.js'

export function generateRectangularPrism({voxel={}, width=1, length=1, height=1}) {
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

export function generateRoom({
  voxel={},
  width=1,
  length=1,
  height=1,
  wallThickness=1,
  floorThickness=2,
  ceilingThickness=1,
}) {
  let ret = {}
  // Ceiling
  for (let x = 0; x < width; x ++) {
    for (let y = 0; y < length; y ++) {
      for (let z = Math.max(height-ceilingThickness, 0); z < height; z ++) {
        ret[[x, y, z]] = voxel
      }
    }
  }
  // Floor
  for (let x = 0; x < width; x ++) {
    for (let y = 0; y < length; y ++) {
      for (let z = 0; z < Math.min(floorThickness, height); z ++) {
        ret[[x, y, z]] = voxel
      }
    }
  }
  // Y walls
  for (let x = 0; x < width; x ++) {
    for (let y = Math.max(length-wallThickness, 0); y < length; y ++) {
      for (let z = floorThickness; z < height-ceilingThickness; z ++) {
        ret[[x, y, z]] = voxel
      }
    }
  }
  for (let x = 0; x < width; x ++) {
    for (let y = 0; y < Math.min(wallThickness, length); y ++) {
      for (let z = floorThickness; z < height-ceilingThickness; z ++) {
        ret[[x, y, z]] = voxel
      }
    }
  }
  // X walls
  for (let x = Math.max(width-wallThickness, 0); x < width; x ++) {
    for (let y = wallThickness; y < length-wallThickness; y ++) {
      for (let z = floorThickness; z < height-ceilingThickness; z ++) {
        ret[[x, y, z]] = voxel
      }
    }
  }
  for (let x = 0; x < Math.min(wallThickness, width); x ++) {
    for (let y = wallThickness; y < length-wallThickness; y ++) {
      for (let z = floorThickness; z < height-ceilingThickness; z ++) {
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


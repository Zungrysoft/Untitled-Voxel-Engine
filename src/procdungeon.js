import * as vox from './voxel.js'
import * as procBasics from './procbasics.js'
import * as vec3 from './core/vector3.js'
import * as u from './core/utils.js'

export function generateDungeon({
  voxel={},
  width=1,
  length=1,
  height=1,
  beamWidth=7,
}) {
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


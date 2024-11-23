import * as vox from './voxel.js'
import * as vec3 from './core/vector3.js'
import * as u from './core/utils.js'
import { add, scale } from './core/vector2.js'
import Noise from './noise.js'
import { sdfDiamondField, sdfIsland } from './procsdf.js'
import { generateRectangularPrism } from './procbasics.js'

export function generateTree ({
  width=10,
  length=10,
  // height=1,
  variance=14,
  roughness=0.4
} = {}) {
  let ret = vox.emptyStructure();

  vox.mergeStructureIntoStructure(ret, generateRectangularPrism({
    length: 6,
    width: 6,
    height: 4,
    voxel: {material: 'leaves', solid: true},
  }), [-2, -2, 10]);
  vox.mergeStructureIntoStructure(ret, generateRectangularPrism({
    length: 10,
    width: 10,
    height: 4,
    voxel: {material: 'leaves', solid: true},
  }), [-4, -4, 6]);
  vox.mergeStructureIntoStructure(ret, generateRectangularPrism({
    length: 2,
    width: 2,
    height: 12,
    voxel: {material: 'bark', solid: true},
  }));

  return ret
}

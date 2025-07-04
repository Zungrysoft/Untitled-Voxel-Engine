import * as vox from './voxel.js'
import * as vec3 from './core/vector3.js'

export function generateCrystalDome(noise, noisePosition, params) {
  let structure = vox.emptyStructure();
  for (let i = 0; i < 4000; i ++) {
    const voxPos = vec3.scale(noise.randomUnitVector(vec3.add(noisePosition, [0, 0, i])), 25).map(Math.floor);
    structure.voxels[vox.ts(voxPos)] = {
      material: "crystal",
      solid: true,
    }
  }
  return structure;
}

export function generateRingRay(noise, noisePosition, params) {
  const structure = vox.emptyStructure();
  const testVec = noise.randomUnitVector(noisePosition);

  for (let i = 0; i < 40; i ++) {
    const pos = vec3.add(vec3.scale(testVec, i*0.5), [0, 0, 20])
    structure.voxels[vox.ts(pos.map(Math.round))] = {
      material: "bark",
      solid: true,
    }
  }
  structure.voxels['0,0,20'] = {
    material: "crystal",
    solid: true,
  }
  for (let i = 0; i < Math.PI*2; i += 0.05) {
    const pos = vec3.add(vec3.scale(vec3.getPerpendicularVectorAtAngle(testVec, i), 10), [0, 0, 20])
    structure.voxels[vox.ts(pos.map(Math.round))] = {
      material: "bark",
      solid: true,
    }
  }

  return structure;
}

import * as vox from './voxel.js'
import * as game from './core/game.js'
import * as vec3 from './core/vector3.js'

export const LIGHTING_HARD_CUTOFF = 16
export const BOUNCES = 1

export function lightingPass(light) {
  const [px, py, pz] = light.position
  const terrain = game.getThing('terrain')

  // Iterate over voxels in radius
  for (let x = px-LIGHTING_HARD_CUTOFF; x <= px+LIGHTING_HARD_CUTOFF; x ++) {
    for (let y = py-LIGHTING_HARD_CUTOFF; y <= py+LIGHTING_HARD_CUTOFF; y ++) {
      for (let z = pz-LIGHTING_HARD_CUTOFF; z <= pz+LIGHTING_HARD_CUTOFF; z ++) {
        // Create position vector
        const pos = [x, y, z]

        // Check if this is a solid voxel
        if (vox.getVoxel(terrain.chunks, pos).solid) {
          let shades = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]

          // Iterate over faces

          // +X
          if (x + 0.5 < px) {
            const fPos = vec3.add(pos, [0.55, 0, 0])
            const trace = terrain.traceLine(light.position, fPos)
            if (!trace.hit) {
              const shade = light.brightness / Math.pow(trace.distance, 2)
              shades[3] = shade
            }
          }
          // -X
          if (x - 0.5 > px) {
            const fPos = vec3.add(pos, [-0.55, 0, 0])
            const trace = terrain.traceLine(light.position, fPos)
            if (!trace.hit) {
              const shade = light.brightness / Math.pow(trace.distance, 2)
              shades[0] = shade
            }
          }

          // +Y
          if (y + 0.5 < py) {
            const fPos = vec3.add(pos, [0, 0.55, 0])
            const trace = terrain.traceLine(light.position, fPos)
            if (!trace.hit) {
              const shade = light.brightness / Math.pow(trace.distance, 2)
              shades[4] = shade
            }
          }
          // -Y
          if (y - 0.5 > py) {
            const fPos = vec3.add(pos, [0, -0.55, 0])
            const trace = terrain.traceLine(light.position, fPos)
            if (!trace.hit) {
              const shade = light.brightness / Math.pow(trace.distance, 2)
              shades[1] = shade
            }
          }

          // +Z
          if (z + 0.5 < pz) {
            const fPos = vec3.add(pos, [0, 0, 0.55])
            const trace = terrain.traceLine(light.position, fPos)
            if (!trace.hit) {
              const shade = light.brightness / Math.pow(trace.distance, 2)
              shades[5] = shade
            }
          }
          // -Z
          if (z - 0.5 > pz) {
            const fPos = vec3.add(pos, [0, 0, -0.55])
            const trace = terrain.traceLine(light.position, fPos)
            if (!trace.hit) {
              const shade = light.brightness / Math.pow(trace.distance, 2)
              shades[2] = shade
            }
          }

          // Apply the new shading data
          vox.setVoxel(terrain.chunks, pos, {shades: shades})
        }
      }
    }
  }
}
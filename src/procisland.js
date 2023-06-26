import * as u from './core/utils.js'
import * as vec3 from './core/vector3.js'

export function generateIslands() {

}
// -22 32 8
export function islandDensity(position, islandPosition, radius, height, density) {
  const [x, y, z] = vec3.subtract(position, islandPosition)

  if (z > 0) {
    height /= 4
  }

  const parabola = (x, r, d) => {
    return ((Math.pow(x*2*(1/r), 2) - 1)/-2)*d
  }

  return parabola(x, radius, density) + parabola(y, radius, density) + parabola(z, height, density)
}

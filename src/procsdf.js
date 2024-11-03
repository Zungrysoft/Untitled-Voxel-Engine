import * as u from './core/utils.js'
import * as vec3 from './core/vector3.js'
import * as vec2 from './core/vector2.js'

export function sdfDiamondField(position, scale) {
  const mapCoord = (x) => {
    let ret = u.mod(x, scale*2)
    if (ret >= scale) {
      ret = scale*2 - ret
    }
    return ret
  }

  return mapCoord(position[0]) + mapCoord(position[1]) + mapCoord(position[2])
}

export function sdfIsland(position, center, radius, height, depth) {
  const heightDelta = position[2] - center[2]

  // Above ellipsoid
  if (heightDelta > height) {
    return 1 - sdfEllipsoid(position, center, radius*2, height*2)
  }

  // Below ellipsoid
  if (heightDelta < -depth) {
    return 1 - sdfEllipsoid(position, center, radius*2, depth*2)
  }

  // Middle of ellipsoid; blend between the two
  const sdfAbove = 1 - sdfEllipsoid(position, center, radius*2, height*2)
  const sdfBelow = 1 - sdfEllipsoid(position, center, radius*2, depth*2)

  const c = u.map(0, -depth, height, 0, 1)            // Map cutoff point in island height space (0, 1)
  const r = u.map(heightDelta, -depth, height, 0, 1)  // Map heightDelta in island height space (0, 1)
  const f = 1 / ((Math.log(0.5) / Math.log(c)) + 1)   // Find factor value for the bend function such that bend(c, f) = 0.5
  const b = u.sigmoid(u.bend(r, f), 11)
  return u.lerp(sdfBelow, sdfAbove, b)
}

export function sdfEllipsoid(position, center, width, height) {
  const relativePosition3D = vec3.subtract(position, center)
  const relX = vec2.magnitude([
    relativePosition3D[0],
    relativePosition3D[1],
  ])
  const relY = relativePosition3D[2]

  // Wide Ellipsoid
  if (width > height) {
    const a = width / 2
    const b = height / 2
    const focalDist = Math.sqrt(a**2 - b**2)
    return ((Math.sqrt((relX+focalDist)**2 + (relY)**2) + Math.sqrt((relX-focalDist)**2 + (relY)**2)) / 2) - a
  }

  // Tall Ellipsoid
  const a = height / 2
  const b = width / 2
  const focalDist = Math.sqrt(a**2 - b**2)
  return ((Math.sqrt((relX)**2 + (relY+focalDist)**2) + Math.sqrt((relX)**2 + (relY-focalDist)**2)) / 2) - a
}
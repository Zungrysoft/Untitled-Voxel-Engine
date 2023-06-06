import * as vec2 from './vector2.js'

export function equals (a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
}

export function crossProduct (a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ]
}

export function dotProduct (a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function add (a, b) {
  return [
    a[0] + b[0],
    a[1] + b[1],
    a[2] + b[2]
  ]
}

export function subtract (a, b) {
  return [
    a[0] - b[0],
    a[1] - b[1],
    a[2] - b[2]
  ]
}

export function normalize (vector) {
  const magnitude = Math.sqrt(vector[0] ** 2 + vector[1] ** 2 + vector[2] ** 2)

  // prevent dividing by 0 and causing NaNs by ORing with 1
  return [
    vector[0] / (magnitude || 1),
    vector[1] / (magnitude || 1),
    vector[2] / (magnitude || 1)
  ]
}

export function toLength (vector, length) {
  const magnitude = Math.sqrt(vector[0] ** 2 + vector[1] ** 2 + vector[2] ** 2)

  // prevent dividing by 0 and causing NaNs by ORing with 1
  return [
    vector[0] * length / (magnitude || 1),
    vector[1] * length / (magnitude || 1),
    vector[2] * length / (magnitude || 1)
  ]
}

export function magnitude (vector) {
  return Math.sqrt(vector[0] ** 2 + vector[1] ** 2 + vector[2] ** 2)
}

export function scale (vector, scalar) {
  return [
    vector[0] * scalar,
    vector[1] * scalar,
    vector[2] * scalar
  ]
}

export function distance (a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)
}

// modifies vector in-place
export function changeLength (vector, delta) {
  const length = magnitude(vector)
  const newLength = length + delta
  vector[0] *= newLength / length
  vector[1] *= newLength / length
  vector[2] *= newLength / length
}

export function getNormalOf (v1, v2, v3) {
  return normalize(crossProduct(
    subtract(v2, v1),
    subtract(v3, v2)
  ))
}

export function areaOfTriangle (v1, v2, v3) {
  return 0.5 * magnitude(crossProduct(
    subtract(v2, v1),
    subtract(v3, v2)
  ))
}

export function lerp (v1, v2, t) {
  return [
    (1 - t) * v1[0] + t * v2[0],
    (1 - t) * v1[1] + t * v2[1],
    (1 - t) * v1[2] + t * v2[2]
  ]
}

export function anglesToVector (direction, pitch) {
  return normalize([
    Math.cos(direction) * Math.max(Math.cos(pitch), 0.001),
    Math.sin(direction) * Math.max(Math.cos(pitch), 0.001),
    Math.sin(pitch)
  ])
}

export function vectorToAngles (vector) {
  return [
    Math.atan2(vector[1], vector[0]),
    Math.asin(vector[2])
  ]
}

export function lerpAngles(v1, v2, t) {
  return [
    vec2.lerpAngles(v1[0], v2[0], t),
    (1 - t) * v1[1] + t * v2[1],
  ]
}

export function directionToVector(d) {
  const map = {
    up: [0, 0, 1],
    down: [0, 0, -1],
    north: [0, -1, 0],
    south: [0, 1, 0],
    east: [1, 0, 0],
    west: [-1, 0, 0],
  }
  return map[d] || [1, 0, 0]
}

function triEdge (p1, p2, position, normal) {
  const s1x = p2[0] - p1[0]
  const s1y = p2[1] - p1[1]
  const s1z = p2[2] - p1[2]
  const s2x = position[0] - p1[0]
  const s2y = position[1] - p1[1]
  const s2z = position[2] - p1[2]
  const ex = s1y * s2z - s1z * s2y
  const ey = s1z * s2x - s1x * s2z
  const ez = s1x * s2y - s1y * s2x
  return ex * normal[0] + ey * normal[1] + ez * normal[2]
}

export function isInsideTriangle (p1, p2, p3, normal, position) {
  const e1 = triEdge(p1, p2, position, normal)
  const e2 = triEdge(p2, p3, position, normal)
  const e3 = triEdge(p3, p1, position, normal)
  return (e1 >= 0 && e2 >= 0 && e3 >= 0) || (e1 < 0 && e2 < 0 && e3 < 0)
}

export function distanceToTriangle (p1, normal, position) {
  return dotProduct(position, normal) - dotProduct(p1, normal)
}

export function getPointOnPlane (r1, rayDir, p1, normal) {
  const dist = distanceToTriangle(p1, normal, r1)
  const dot = dotProduct(rayDir, normal)

  // don't divide by zero!
  if (dot >= 0) {
    return null
  }

  return add(r1, scale(rayDir, Math.abs(dist / dot)))
}

export function rayTriangleIntersection (r1, rayDir, p1, p2, p3, normal) {
  const point = getPointOnPlane(r1, rayDir, p1, normal)
  if (!point) return point
  return isInsideTriangle(p1, p2, p3, normal, point) ? point : null
}

export function findMostSimilarVector (vector, list) {
  let bestDot = -1 * Infinity
  let bestVector = null

  for (const thing of list) {
    const dot = dotProduct(thing, vector)
    if (dot > bestDot) {
      bestDot = dot
      bestVector = thing
    }
  }

  return bestVector
}

export function raySphere (ray, sphere, radius) {
  const sphereProjection = dotProduct(ray, sphere)
  const testPoint = [
    ray[0] + sphereProjection,
    ray[1] + sphereProjection,
    ray[2] + sphereProjection
  ]

  const dist = distance(testPoint, sphere)
  if (dist < radius) {
    return testPoint
  }
}

export function parseCoords (s) {
  const spl = s.split(',')
  return [parseInt(spl[0]) || 0, parseInt(spl[1]) || 0, parseInt(spl[2]) || 0]
}

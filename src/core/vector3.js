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

  // Return +X vector if zero vector is passed in
  if (magnitude === 0) {
    return [1, 0, 0]
  }

  return [
    vector[0] / magnitude,
    vector[1] / magnitude,
    vector[2] / magnitude,
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

export function directionToIndex(d) {
  const map = {
    up: 5,
    down: 2,
    north: 1,
    south: 4,
    east: 3,
    west: 0,
  }
  return map[d] || 0
}

export function oppositeDirection(d) {
  const map = {
    up: 'down',
    down: 'up',
    north: 'south',
    south: 'north',
    east: 'west',
    west: 'east',
  }
  return map[d] || 'down'
}

export function allDirections() {
  return ['west', 'north', 'down', 'east', 'south', 'up']
}

export function withinBounds(position, bounds1, bounds2) {
  for (let i = 0; i < 3; i ++) {
    if (position[i] >= Math.max(bounds1[i], bounds2[i])) {
      return false
    }
    if (position[i] < Math.min(bounds1[i], bounds2[i])) {
      return false
    }
  }
  return true
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

export function distanceFromLineSegment(segment, point) {
  const [x1, y1, z1] = segment[0];
  const [x2, y2, z2] = segment[1];
  const [px, py, pz] = point;

  // Vector from the first endpoint to the second endpoint
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;

  // Vector from the first endpoint to the point
  const px1 = px - x1;
  const py1 = py - y1;
  const pz1 = pz - z1;

  // Calculate the projection factor `t` onto the line
  const dotProduct = px1 * dx + py1 * dy + pz1 * dz;
  const segmentLengthSquared = dx * dx + dy * dy + dz * dz;
  let t = dotProduct / segmentLengthSquared;

  // Clamp t to the range [0, 1]
  t = Math.max(0, Math.min(1, t));

  // Closest point on the line segment
  const closestPoint = [
      x1 + t * dx,
      y1 + t * dy,
      z1 + t * dz
  ];

  // Distance from the point to the closest point
  const dist = distance([px, py, pz], closestPoint);

  return [dist, t];
}

export function rotateVector(a, b, r) {
  // Normalize vector b to ensure it's a unit vector
  const u = normalize(b);

  const cosTheta = Math.cos(r);
  const sinTheta = Math.sin(r);

  // Dot product of a and u
  const dotProduct = a[0] * u[0] + a[1] * u[1] + a[2] * u[2];

  // Cross product of u and a
  const crossProduct = [
      u[1] * a[2] - u[2] * a[1],
      u[2] * a[0] - u[0] * a[2],
      u[0] * a[1] - u[1] * a[0]
  ];

  // Rodrigues' rotation formula
  const rotatedVector = [
      cosTheta * a[0] + sinTheta * crossProduct[0] + (1 - cosTheta) * dotProduct * u[0],
      cosTheta * a[1] + sinTheta * crossProduct[1] + (1 - cosTheta) * dotProduct * u[1],
      cosTheta * a[2] + sinTheta * crossProduct[2] + (1 - cosTheta) * dotProduct * u[2]
  ];

  return rotatedVector;
}

export function getPerpendicularVectorAtAngle(inputVector, angle) {
  const vector = normalize(inputVector);

  const lengthXY = vec2.magnitude(vector);
  const normXY = vec2.normalize(vector);

  const upVector = [...vec2.scale(normXY, -Math.abs(vector[2])), lengthXY];

  return rotateVector(upVector, vector, angle);
}

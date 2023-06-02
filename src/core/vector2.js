export function equals (a, b) {
  return a[0] === b[0] && a[1] === b[1]
}

export function crossProduct (a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2]
  ]
}

export function dotProduct (a, b) {
  return a[0] * b[0] + a[1] * b[1]
}

export function add (a, b) {
  return [
    a[0] + b[0],
    a[1] + b[1]
  ]
}

export function subtract (a, b) {
  return [
    a[0] - b[0],
    a[1] - b[1]
  ]
}

export function scale (vector, scale) {
  return [
    vector[0] * scale,
    vector[1] * scale
  ]
}

export function normalize (vector) {
  const magnitude = Math.sqrt(vector[0] ** 2 + vector[1] ** 2)

  // prevent dividing by 0 and causing NaNs by ORing with 1
  return [
    vector[0] / (magnitude || 1),
    vector[1] / (magnitude || 1)
  ]
}

export function magnitude (vector) {
  return Math.sqrt(vector[0] ** 2 + vector[1] ** 2)
}

export function distance (a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)
}

// modifies vector in-place
export function changeLength (vector, delta) {
  const length = magnitude(vector)
  const newLength = length + delta
  vector[0] *= newLength / length
  vector[1] *= newLength / length
}

export function toLength (vector, length) {
  return scale(vector, length / magnitude(vector))
}

export function lerp (v1, v2, t) {
  return [
    (1 - t) * v1[0] + t * v2[0],
    (1 - t) * v1[1] + t * v2[1]
  ]
}

export function rotate (x, y, r) {
  return [
    Math.cos(r) * x - Math.sin(r) * y,
    Math.sin(r) * x + Math.cos(r) * y
  ]
}

export function angleToVector (angle, length = 1) {
  return [Math.cos(angle) * length, Math.sin(angle) * length]
}

export function angleDistance(a, b) {
  // Bind angles to be from 0 to 2*PI
  a = a % (Math.PI*2)
  b = b % (Math.PI*2)

  // Find the shortest distance
  let minDist = Math.abs(a - b)

  const d1 = Math.abs((a + (Math.PI*2)) - b)
  if (d1 < minDist) {
    minDist = d1
  }

  const d2 = Math.abs((a - (Math.PI*2)) - b)
  if (d2 < minDist) {
    minDist = d2
  }

  return minDist
}

export function lerpAngles(a, b, t) {
  // Bind angles to be from 0 to 2*PI
  a = a % (Math.PI*2)
  b = b % (Math.PI*2)

  // Determine which direction to lerp yaw in
  let minMode = 0
  let minDist = Math.abs(a - b)

  const d1 = Math.abs((a + (Math.PI*2)) - b)
  if (d1 < minDist) {
    minDist = d1
    minMode = 1
  }

  const d2 = Math.abs((a - (Math.PI*2)) - b)
  if (d2 < minDist) {
    minDist = d2
    minMode = 2
  }

  // Apply mode
  if (minMode === 1) {
    a += Math.PI*2
  }
  else if (minMode === 2) {
    a -= Math.PI*2
  }

  return (1 - t) * a + t * b
}

/*
   given two objects of format
   {
   points: [],
   normals: []
   }
*/
export function sat (a, b) {
  let overlap = Infinity
  let bestNormal

  for (const normal of a.normals) {
    let aMin = Infinity; let aMax = -1 * Infinity
    let bMin = Infinity; let bMax = -1 * Infinity

    for (const point of a.points) {
      aMin = Math.min(dotProduct(point, normal), aMin)
      aMax = Math.max(dotProduct(point, normal), aMax)
    }
    for (const point of b.points) {
      bMin = Math.min(dotProduct(point, normal), bMin)
      bMax = Math.max(dotProduct(point, normal), bMax)
    }

    /*
    if (
      (bMin > aMax && bMax > aMax) ||
      (aMin > bMax && aMax > bMax)
    ) {
    }
    */

    const newOverlap = aMax - bMin
    if (newOverlap <= 0) {
      return [0, null]
    } else if (newOverlap < overlap) {
      overlap = newOverlap
      bestNormal = normal
    }
  }

  return [overlap, bestNormal]
}

export function parseCoords (s) {
  const spl = s.split(',')
  return [parseInt(spl[0]) || 0, parseInt(spl[1]) || 0]
}

import { normalize, dotProduct, crossProduct } from './vector3.js'

export function getPerspective ({ fov = 1.57, aspect = 1, near = 1, far = 100000 } = {}) {
  const f = 1.0 / Math.tan(fov / 2)
  const nf = 1 / (near - far)
  return [
    f / -aspect,
    0,
    0,
    0,

    0,
    f,
    0,
    0,

    0,
    0,
    far * nf,
    -1,

    0,
    0,
    far * near * nf,
    0
  ]
}

export function getTransformation ({ translation = [0, 0, 0], rotation = [0, 0, 0], scale = 1 } = {}) {
  const matrix = getIdentity()

  // translation
  matrix[12] = translation[0]
  matrix[13] = translation[1]
  matrix[14] = translation[2]

  // rotation
  if (typeof rotation === 'number') { rotation = [0, 0, rotation] }
  const ca = Math.cos(rotation[2]); const cb = Math.cos(rotation[1]); const cc = Math.cos(rotation[0])
  const sa = Math.sin(rotation[2]); const sb = Math.sin(rotation[1]); const sc = Math.sin(rotation[0])

  matrix[0] = ca * cb
  matrix[1] = sa * cb
  matrix[2] = -sb
  matrix[4] = ca * sb * sc - sa * cc
  matrix[5] = sa * sb * sc + ca * cc
  matrix[6] = cb * sc
  matrix[8] = ca * sb * cc + sa * sc
  matrix[9] = sa * sb * cc - ca * sc
  matrix[10] = cb * cc

  // scale
  if (typeof scale === 'number') scale = [scale, scale, scale]
  matrix[0] *= scale[0]
  matrix[1] *= scale[0]
  matrix[2] *= scale[0]
  matrix[4] *= scale[1]
  matrix[5] *= scale[1]
  matrix[6] *= scale[1]
  matrix[8] *= scale[2]
  matrix[9] *= scale[2]
  matrix[10] *= scale[2]

  return matrix
}

export function getView ({ position = [0, 0, 0], target = [1, 0, 0], up = [0, 0, 1] } = {}) {
  const z = normalize([
    target[0] - position[0],
    target[1] - position[1],
    target[2] - position[2]
  ])
  const x = normalize(crossProduct(up, z))
  const y = crossProduct(z, x)

  return [
    x[0],
    y[0],
    z[0],
    0,

    x[1],
    y[1],
    z[1],
    0,

    x[2],
    y[2],
    z[2],
    0,

    -1 * dotProduct(x, position),
    -1 * dotProduct(y, position),
    -1 * dotProduct(z, position),
    1
  ]
}

export function getIdentity () {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]
}

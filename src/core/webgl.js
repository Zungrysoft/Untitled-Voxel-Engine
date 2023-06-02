import { loadObj } from './modelloader.js'
import * as game from './game.js'
import * as vec3 from './vector3.js'

let currentShader

// the vertex format used for .obj files
const defaultVertexFormat = [
  {
    name: 'vertexPosition',
    count: 3
  },

  {
    name: 'vertexTexture',
    count: 2
  },

  {
    name: 'vertexNormal',
    count: 3
  }
]

// returns how many bytes there are in a form
// based off of what data type the form is
function byteOffset (form) {
  const { gl } = game
  let bytes = 1
  if (!form.what) form.what = gl.FLOAT
  if (form.what === gl.FLOAT) {
    bytes = 4
  }
  return form.count * bytes
}

/********************************************************************************
   set and draw graphics primitives
 ********************************************************************************/

export function set (name, value, kind = 'float') {
  const { gl } = game

  if (Array.isArray(value)) {
    if (value.length === 16) {
      gl.uniformMatrix4fv(gl.getUniformLocation(currentShader, name), false, value)
      return
    }

    if (value.length === 4) {
      gl.uniform4fv(gl.getUniformLocation(currentShader, name), value)
      return
    }

    if (value.length === 3) {
      gl.uniform3fv(gl.getUniformLocation(currentShader, name), value)
      return
    }

    if (value.length === 2) {
      gl.uniform2fv(gl.getUniformLocation(currentShader, name), value)
      return
    }
  }

  if (kind === 'int') {
    gl.uniform1i(gl.getUniformLocation(currentShader, name), value)
    return
  }

  gl.uniform1f(gl.getUniformLocation(currentShader, name), value)
}

export function setShader (shader) {
  const { gl } = game
  currentShader = shader
  gl.useProgram(shader)
}

export function setTexture (texture, index = 0) {
  const { gl } = game
  gl.activeTexture(gl['TEXTURE' + index])
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.activeTexture(gl.TEXTURE0)
}

export function setFramebuffer (fb = null) {
  const { gl } = game
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb?.framebuffer ? fb.framebuffer : fb)
}

export function drawMesh (mesh, drawType = 'triangles') {
  const { gl } = game
  const {
    buffer,
    format,
    verts
  } = mesh
  const shader = currentShader
  let offset = 0

  // count how much data is in one vertex
  let byteStride = 0
  let stride = 0
  for (const form of format) {
    byteStride += byteOffset(form)
    stride += form.count
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  for (const form of format) {
    gl.vertexAttribPointer(
      gl.getAttribLocation(shader, form.name),
      form.count,
      form.what,
      false, // do not normalize
      byteStride,
      offset
    )
    gl.enableVertexAttribArray(gl.getAttribLocation(shader, form.name))
    offset += byteOffset(form)
  }

  gl.drawArrays(gl[drawType.toUpperCase()], 0, verts.length / stride)
}

let billboardMesh
export function drawBillboard () {
  billboardMesh = billboardMesh || createMesh([
    0, 0, 0, 0, 0, 1, 0, 0,
    0, 0, 0, 1, 0, 1, 0, 0,
    0, 0, 0, 0, 1, 1, 0, 0,
    0, 0, 0, 1, 1, 1, 0, 0
  ])
  drawMesh(billboardMesh, 'triangle_strip')
}

const triVerts = new Float32Array([
  0, 0, 0, 0, 0, 1, 0, 0,
  0, 0, 1, 0, 1, 1, 0, 0,
  1, 0, 0, 1, 0, 1, 0, 0
])
let triMesh
export function drawTri (...points) {
  triMesh = triMesh || createMesh(triVerts, { isStreamed: true })
  if (points) {
    let i = 0
    for (let p = 0; p < points.length; p += 3) {
      triVerts[i] = points[p]
      triVerts[i + 1] = points[p + 1]
      triVerts[i + 2] = points[p + 2]
      i += 8
    }
    modifyMesh(triMesh, triVerts)
  }
  drawMesh(triMesh)
}

const quadVerts = new Float32Array([
  0, 0, 0, 0, 0, 1, 0, 0,
  0, 0, 1, 0, 1, 1, 0, 0,
  1, 0, 0, 1, 0, 1, 0, 0,
  1, 0, 1, 1, 1, 1, 0, 0
])
let quadMesh
export function drawQuad (...points) {
  quadMesh = quadMesh || createMesh(quadVerts, { isStreamed: true })
  if (points) {
    let i = 0
    for (let p = 0; p < points.length; p += 3) {
      quadVerts[i] = points[p]
      quadVerts[i + 1] = points[p + 1]
      quadVerts[i + 2] = points[p + 2]
      i += 8
    }
    modifyMesh(quadMesh, quadVerts)
  }
  drawMesh(quadMesh, 'triangle_strip')
}

export function drawLine (p1, p2, w = 1) {
  const vector = vec3.normalize(vec3.subtract(p1, p2))
  const cross = vec3.crossProduct(vector, game.getCamera3D().lookVector)
  cross[0] *= w
  cross[1] *= w
  cross[2] *= w

  drawQuad(
    p1[0] - cross[0], p1[1] - cross[1], p1[2] - cross[2],
    p1[0] + cross[0], p1[1] + cross[1], p1[2] + cross[2],
    p2[0] - cross[0], p2[1] - cross[1], p2[2] - cross[2],
    p2[0] + cross[0], p2[1] + cross[1], p2[2] + cross[2]
  )

  return cross
}

/********************************************************************************
   graphics primitives creation functions
 ********************************************************************************/

export function createShader (vsSource, fsSource) {
  const { gl } = game
  function compileShader (what, source) {
    const shader = gl.createShader(what)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader))
    }

    return shader
  }

  const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource)
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource)

  // Create the shader program
  const shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram)

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram))
  }

  return shaderProgram
}

export function createTexture (image, filter = 'nearest', edgeClamp = false) {
  const { gl } = game
  if (typeof filter === 'string') {
    filter = {
      min: filter,
      mag: filter
    }
  }

  if (!image) console.error(`No image provided! Got ${image} instead!`)
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)

  const level = 0
  const internalFormat = gl.RGBA
  const srcFormat = gl.RGBA
  const srcType = gl.UNSIGNED_BYTE
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    srcFormat,
    srcType,
    image
  )
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[filter.min.toUpperCase()])
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[filter.mag.toUpperCase()])
  if (edgeClamp) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  }

  return texture
}

export function createMesh (verts, { isStreamed = false, format = defaultVertexFormat } = {}) {
  const { gl } = game
  if (typeof verts === 'string') {
    verts = loadObj(verts, true)
  }

  // make sure verts is a Float32Array
  verts = verts.constructor === Float32Array ? verts : new Float32Array(verts)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    verts,
    isStreamed ? gl.STREAM_DRAW : gl.STATIC_DRAW
  )

  return {
    buffer,
    format,
    verts,
    isStreamed
  }
}

export function modifyMesh (mesh, verts) {
  const { gl } = game
  verts = verts.constructor === Float32Array ? verts : new Float32Array(verts)
  mesh.verts = verts

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    verts,
    mesh.isStreamed ? gl.STREAM_DRAW : gl.STATIC_DRAW
  )
}

export function createFramebuffer () {
  // create the texture that the framebuffer renders to
  const { gl } = game
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  const width = game.getWidth()
  const height = game.getHeight()

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  )
  // gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  const renderbuffer = gl.createRenderbuffer()
  gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer)
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, width, height)

  // create the framebuffer, and bind the texture to it
  const framebuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, renderbuffer)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  return {
    framebuffer,
    texture
  }
}

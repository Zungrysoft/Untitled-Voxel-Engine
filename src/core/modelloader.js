export const loadObj = (fileString, combine = false) => {
  const positions = []
  const uvs = []
  const normals = []
  const objects = {}
  let currentObject

  const makeObject = (name) => {
    objects[name] = {
      verts: [],
      positions: [],
      uvs: [],
      normals: [],
      lines: [],
      name
    }
    currentObject = objects[name]
  }
  makeObject('default')

  for (const line of fileString.split(/\r?\n/)) {
    const words = line.split(/ +/)

    if (words[0] === 'o') {
      makeObject(words[1])
      continue
    }

    if (words[0] === 'usemtl') {
      currentObject.material = words[1]
    }

    if (words[0] === 'f') {
      const verts = words.slice(1) // list of v/vt/vn triplets

      // simple convex triangulation
      for (let i = 2; i < verts.length; i++) {
        for (let vert of [verts[0], verts[i - 1], verts[i]]) {
          vert = vert.split('/').map(x => Number(x) - 1)
          currentObject.verts.push(
            ...positions[vert[0]],
            ...uvs[vert[1]],
            ...normals[vert[2]]
          )
        }
      }
      continue
    }

    const value = words.slice(1).map(Number)

    if (words[0] === 'l') {
      currentObject.lines.push(value.map(i => positions[i]))
      continue
    }

    if (words[0] === 'v') {
      positions.push(value)
      currentObject.positions.push(value)
      continue
    }

    if (words[0] === 'vt') {
      uvs.push(value)
      currentObject.uvs.push(value)
      continue
    }

    if (words[0] === 'vn') {
      normals.push(value)
      currentObject.normals.push(value)
      continue
    }
  }

  if (combine) {
    const result = []
    for (const name in objects) {
      result.push(...objects[name].verts)
    }
    return result
  }

  return objects
}

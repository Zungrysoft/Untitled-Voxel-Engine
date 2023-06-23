import * as vox from '../voxel.js'
import * as pal from '../palette.js'
import * as vec3 from '../core/vector3.js'

onmessage = function(e) {
  // Handle STOP message
  if (e.data === 'STOP') {
    close();
  }

  // Retrieve data
  const { chunkKey, chunk, workerIndex } = e.data

  // Call the mesher function
  let verts = meshChunk(chunk, pal.palette)

  // Return
  postMessage({
    verts: verts,
    chunkKey: chunkKey,
    workerIndex: workerIndex,
  }, [verts]);
}

export function meshChunk(chunk, palette) {
  // Set up chunks object
  const chunks = {'0,0,0': chunk}

  // Build list of faces this chunk needs to render
  let faces = {
    north: {},
    northKeys: [],
    south: {},
    southKeys: [],
    west: {},
    westKeys: [],
    east: {},
    eastKeys: [],
    up: {},
    upKeys: [],
    down: {},
    downKeys: [],
  }
  for (let x = 0; x < vox.CHUNK_SIZE; x ++) {
    for (let y = 0; y < vox.CHUNK_SIZE; y ++) {
      for (let z = 0; z < vox.CHUNK_SIZE; z ++) {
        // Position
        const position = [x, y, z]

        // If the voxel is not air, add its faces
        const voxel = vox.getVoxel(chunks, position)
        if (vox.voxelSolid(voxel)) {
          // Get material and shades
          const material = vox.voxelMaterial(voxel)
          const shades = vox.voxelShades(voxel)

          // Get voxel palette
          const paletteRow = palette[material]

          // Check for adjacent voxels so we don't render faces that are hidden by other voxels
          // East
          if (!vox.getVoxelSolid(chunks, vec3.add(position, [1, 0, 0]))) {
            faces.eastKeys.push(position)
            faces.east[position] = [[x + 0.5, y - 0.5, z - 0.5], [x + 0.5, y + 0.5, z + 0.5], pal.getColor(paletteRow, shades[3])]
          }
          // West
          if (!vox.getVoxelSolid(chunks, vec3.add(position, [-1, 0, 0]))) {
            faces.westKeys.push(position)
            faces.west[position] = [[x - 0.5, y - 0.5, z - 0.5], [x - 0.5, y + 0.5, z + 0.5], pal.getColor(paletteRow, shades[0])]
          }
          // South
          if (!vox.getVoxelSolid(chunks, vec3.add(position, [0, 1, 0]))) {
            faces.southKeys.push(position)
            faces.south[position] = [[x - 0.5, y + 0.5, z - 0.5], [x + 0.5, y + 0.5, z + 0.5], pal.getColor(paletteRow, shades[4])]
          }
          // North
          if (!vox.getVoxelSolid(chunks, vec3.add(position, [0, -1, 0]))) {
            faces.northKeys.push(position)
            faces.north[position] = [[x - 0.5, y - 0.5, z - 0.5], [x + 0.5, y - 0.5, z + 0.5], pal.getColor(paletteRow, shades[1])]
          }
          // Up
          if (!vox.getVoxelSolid(chunks, vec3.add(position, [0, 0, 1]))) {
            faces.upKeys.push(position)
            faces.up[position] = [[x - 0.5, y - 0.5, z + 0.5], [x + 0.5, y + 0.5, z + 0.5], pal.getColor(paletteRow, shades[5])]
          }
          // Down
          if (!vox.getVoxelSolid(chunks, vec3.add(position, [0, 0, -1]))) {
            faces.downKeys.push(position)
            faces.down[position] = [[x - 0.5, y - 0.5, z - 0.5], [x + 0.5, y + 0.5, z - 0.5], pal.getColor(paletteRow, shades[2])]
          }
        }
      }
    }
  }

  // Merge faces together to optimize the mesh
  // Iterate over the six faces
  for (const direction of ['east', 'south', 'down', 'west', 'north', 'up']) {
    // Loop over the three dimensions (X, Y, and Z) for adjacent faces to merge

    // X
    if (direction !== 'east' && direction !== 'west') {
      for (const key of faces[direction + 'Keys']) {
        // Check if the face still exists (it may have been removed by an earlier step)
        const face = faces[direction][key]
        if (face) {
          for (let x = 1; true; x ++) {
            const mergeKey = vec3.add(key, [x, 0, 0])
            const mergeFace = faces[direction][mergeKey]
            // Check that the merge face exists and is of the same color
            if (mergeFace && vec3.equals(face[2], mergeFace[2])) {
              // Delete merged face (since it's being merged in)
              delete faces[direction][mergeKey]

              // Extend the original face to cover the area lost from the deleted face
              faces[direction][key][1][0] += 1
            }
            else {
              break
            }
          }
        }
      }
    }

    // Y
    if (direction !== 'south' && direction !== 'north') {
      for (const key of faces[direction + 'Keys']) {
        // Check if the face still exists (it may have been removed by an earlier step)
        const face = faces[direction][key]
        if (face) {
          for (let y = 1; true; y ++) {
            const mergeKey = vec3.add(key, [0, y, 0])
            const mergeFace = faces[direction][mergeKey]
            // Check that the merge face exists and is of the same color
            // Also check that the faces are of the same length in the X direction
            // since the lengths may have changed in the X step
            if (mergeFace && vec3.equals(face[2], mergeFace[2]) && face[1][0] === mergeFace[1][0]) {
              // Delete merged face (since it's being merged in)
              delete faces[direction][mergeKey]

              // Extend the original face to cover the area lost from the deleted face
              faces[direction][key][1][1] += 1
            }
            else {
              break
            }
          }
        }
      }
    }

    // Z
    if (direction !== 'down' && direction !== 'up') {
      for (const key of faces[direction + 'Keys']) {
        // Check if the face still exists (it may have been removed by an earlier step)
        const face = faces[direction][key]
        if (face) {
          for (let z = 1; true; z ++) {
            const mergeKey = vec3.add(key, [0, 0, z])
            const mergeFace = faces[direction][mergeKey]
            // Check that the merge face exists and is of the same color
            // Also check that the faces are of the same length in the X and Y directions
            // since the lengths may have changed in the X step
            if (mergeFace && vec3.equals(face[2], mergeFace[2]) && face[1][0] === mergeFace[1][0] && face[1][1] === mergeFace[1][1]) {
              // Delete merged face (since it's being merged in)
              delete faces[direction][mergeKey]

              // Extend the original face to cover the area lost from the deleted face
              faces[direction][key][1][2] += 1
            }
            else {
              break
            }
          }
        }
      }
    }
  }

  // Add triangles to the mesh
  const addFace = (v1, v2, rgb, normal, flip) => {
    const addTriangle = (v1, v2, v3, normal, rgb) => {
      const vertices = [v1, v2, v3]
      const [u, v] = pal.getColorMapCoords(rgb)
      let verts = []

      for (const [x, y, z] of vertices) {
        verts.push(
          x, y, z,
          u, v,
          ...normal
        )
      }

      return verts
    }

    // Calculate the other two vertices in the quad
    let v3 = [...v1]
    let v4 = [...v1]
    // X axis
    if (v1[0] === v2[0]) {
      v3[1] = v2[1]
      v4[2] = v2[2]
    }
    // Y axis
    if (v1[1] === v2[1]) {
      v3[2] = v2[2]
      v4[0] = v2[0]
    }
    // Z axis
    if (v1[2] === v2[2]) {
      v3[0] = v2[0]
      v4[1] = v2[1]
    }

    // Flip direction
    if (flip) {
      const swapper = v3
      v3 = v4
      v4 = swapper
    }

    // Two triangles
    const t1 = addTriangle(
      v1,
      v2,
      v3,
      normal,
      rgb,
    )
    const t2 = addTriangle(
      v2,
      v1,
      v4,
      normal,
      rgb,
      // rgb.map(x => x+0.05),
    )

    return [...t1, ...t2]
  }

  // Set up vertex buffer
  let bufferSize = (Object.keys(faces.north).length +
                    Object.keys(faces.south).length +
                    Object.keys(faces.east).length +
                    Object.keys(faces.west).length +
                    Object.keys(faces.up).length +
                    Object.keys(faces.down).length) * (2 * 3 * 8 * 4)
                    // 2 triangles * 3 vertices per triangle * 8 values per vertex * 4 bytes in a Float32
  let verts = new ArrayBuffer(bufferSize);
  let vertsView = new Float32Array(verts);
  let vertIndex = 0

  // Fill buffer with triangle vertex data
  for (const direction of ['north', 'south', 'east', 'west', 'up', 'down']) {
    // Faces facing toward a negative axis need to be flipped for some reason
    const flip = ['north', 'west', 'down'].includes(direction)

    // Rendered triangles
    for (const key in faces[direction]) {
      const face = faces[direction][key]

      // Create triangles
      const newVerts = addFace(...face, vec3.directionToVector(direction), flip)

      // Add new vertices to buffer
      for (const vert of newVerts) {
        vertsView[vertIndex] = vert
        vertIndex ++
      }
    }
  }

  // Return
  return verts
}
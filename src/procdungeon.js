import * as vox from './voxel.js'
import * as procBasics from './procbasics.js'
import * as vec3 from './core/vector3.js'
import * as u from './core/utils.js'

export function copyDungeon(dungeon) {
  return {
    structure: vox.copyStructure(dungeon.structure),
    score: dungeon.score,
    doorways: [...dungeon.doorways],
  }
}

export function generateDungeon(chunks, {
  position = [0, 0, 0],
  direction = 'north',
  voxel={},
  beamWidth=1,
  rooms=7,
}) {
  // Initialize dungeons
  let searchDungeons = [{
    structure: vox.emptyStructure(),
    score: 0,
    doorways: [{direction: direction, position: position}],
  }]

  for (let c = 0; c < rooms; c ++) {
    console.log("Picking room " + c)
    let newSearchDungeons = []

    // Iterate over dungeons in beam width
    for (const dungeon of searchDungeons) {
      // Iterate over doorways
      for (const doorway of dungeon.doorways) {
        // Generate some possible directions to go
        const possibleDungeons = checkRoom(chunks, dungeon, doorway, voxel)
        newSearchDungeons.push(...possibleDungeons)
      }
    }

    // Cull results down to the top candidates
    // newSearchDungeons.sort((a, b) => a.score - b.score)
    newSearchDungeons = u.shuffle(newSearchDungeons)
    newSearchDungeons.splice(beamWidth)

    // Update list for next iteration
    searchDungeons = newSearchDungeons
  }

  return searchDungeons[0]?.structure || vox.emptyStructure()
}

export function checkRoom(chunks, dungeon, doorway, voxel) {
  let possibilities = []

  // Try seven room sizes
  for (let i = 0; i < 7; i ++) {
    // Determine the room dimensions
    const roomWidth = Math.floor(Math.random()*7 + 7)
    const roomLength = Math.floor(Math.random()*7 + 7)
    const roomHeight = 6

    // Determine the room's positioning
    const offset = roomOffset(doorway.direction, roomWidth, roomLength, roomHeight)
    const totalOffset = vec3.add(offset, doorway.position)

    // Build the room
    let room = procBasics.generateRoom({
      voxel: voxel,
      width: roomWidth,
      length: roomLength,
      height: roomHeight,
      ceilingThickness: 0,
    })

    // Shift its position
    room = vox.transformStructure(room, [{mode: "translate", offset: totalOffset}])

    // Check the room against reserve space
    if (vox.checkReservedInStructure(dungeon.structure, [0, 0, 0], room)) {
      continue
    }
    if (vox.checkReservedInWorld(chunks, [0, 0, 0], room)) {
      continue
    }

    // Merge
    let possibility = copyDungeon(dungeon)
    vox.mergeStructureIntoStructure(possibility.structure, room)
    possibility.doorways = []

    // Add doorways
    for (const dir of ['north', 'south', 'east', 'west']) {
      const doorwayPos = vec3.add(totalOffset, doorwayPosition(dir, roomWidth, roomLength, roomHeight))
      possibility.doorways.push({
        position: doorwayPos,
        direction: dir,
      })
    }

    // Push new dungeon
    possibilities.push(possibility)
  }

  return possibilities
}

export function doorwayPosition(direction, width, length, height) {
  if (direction === 'north') {
    return [Math.floor((width-1)/2), 0, 1]
  }
  if (direction === 'south') {
    return [Math.floor((width-1)/2), length-1, 1]
  }
  if (direction === 'west') {
    return [0, Math.floor((length-1)/2), 1]
  }
  return [width-1, Math.floor((length-1)/2), 1]
}

export function roomOffset(direction, width, length, height) {
  // Autocalculate doorway offsets
  let north = doorwayPosition('north', width, length, height)
  let south = doorwayPosition('south', width, length, height)
  let west = doorwayPosition('west', width, length, height)
  let east = doorwayPosition('east', width, length, height)

  // North
  if (direction === 'north') {
    const [x, y, z] = south
    return [-x, -y-1, -z]
  }
  // South
  else if (direction === 'south') {
    const [x, y, z] = north
    return [-x, 1-y, -z]
  }
  // West
  else if (direction === 'west') {
    const [x, y, z] = east
    return [-x-1, -y, -z]
  }
  // East
  else {
    const [x, y, z] = west
    return [1-x, -y, -z]
  }
}

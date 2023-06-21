import * as game from './core/game.js'
import * as gfx from './core/webgl.js'
import Terrain from './terrain.js'
import Player from './player.js'

game.config.width = 640
game.config.height = 360
//game.config.isWebglEnabled = false
document.title = 'Untitled Voxel Shooter'

await game.loadAssets({
  images: {
    background: 'images/bg1.png',
    square: 'images/square.png',
    colorMap: 'images/color_map.png',
    crosshair: 'images/crosshair.png',
  },

  sounds: {
    collect: 'sounds/collect.wav',
    laser: 'sounds/laser2.wav',
    laserHit: 'sounds/laser.wav',
    shift: 'sounds/shift2.wav',
    thump: 'sounds/thump.wav',
    wind: 'sounds/wind.wav',
    fail: 'sounds/fail.wav',
    whoosh: 'sounds/whoosh.wav',
  },

  shaderSources: {
    defaultFrag: 'shaders/default.frag',
    defaultVert: 'shaders/default.vert',

    voxelFrag: 'shaders/voxel.frag',
    voxelVert: 'shaders/voxel.vert',
  },

  models: {
    cube: 'models/cube.obj',
    skybox: 'models/skybox.obj',
    chunkOutline: 'models/chunk_outline.obj',
  },

  json: {
    parameters: 'json/parameters.json',
    structureArchesBottomCenter: 'json/structures/arches/bottomCenter.json',
    structureArchesBottomEdge: 'json/structures/arches/bottomEdge.json',
    structureArchesBottomEdgePillar: 'json/structures/arches/bottomEdgePillar.json',
    structureArchesBottomCornerPillar: 'json/structures/arches/bottomCornerPillar.json',
    structureArchesBottomJunctionPillar: 'json/structures/arches/bottomJunctionPillar.json',
    structureArchesTopEdge: 'json/structures/arches/topEdge.json',
    structureArchesTopEdgePillar: 'json/structures/arches/topEdgePillar.json',
    structureArchesTopCornerPillar: 'json/structures/arches/topCornerPillar.json',
    structureArchesTopJunctionPillar: 'json/structures/arches/topJunctionPillar.json',
    structureArchesRoofCorner: 'json/structures/arches/roofCorner.json',
    structureArchesRoofEdge: 'json/structures/arches/roofEdge.json',
    structureArchesRoofJunction: 'json/structures/arches/roofJunction.json',
    structureArchesRoofCenterEnd: 'json/structures/arches/roofCenterEnd.json',
    structureArchesRoofCenterQuad: 'json/structures/arches/roofCenterQuad.json',
    structureArchesRoofCenterStraight: 'json/structures/arches/roofCenterStraight.json',
    structureArchesRoofCenterTee: 'json/structures/arches/roofCenterTee.json',
    structureArchesRoofCenterTurn: 'json/structures/arches/roofCenterTurn.json',
    structureFlat: 'json/structures/util/flat.json',
    structureAir: 'json/structures/util/air.json',
    structureAny: 'json/structures/util/any.json',
  },
})


const { assets } = game
assets.shaders = {
  default: gfx.createShader(
    assets.shaderSources.defaultVert,
    assets.shaderSources.defaultFrag
  ),
  voxel: gfx.createShader(
    assets.shaderSources.voxelVert,
    assets.shaderSources.voxelFrag
  ),
}

assets.textures = Object.fromEntries(
  Object.entries(assets.images).map(([name, image]) => [
    name, gfx.createTexture(image)
  ])
)

assets.meshes = Object.fromEntries(
  Object.entries(assets.models).map(([name, model]) => [
    name, gfx.createMesh(model)
  ])
)

// console.log(assets)

game.setScene(() => {
  game.addThing(new Terrain())
  game.addThing(new Player([7, 7, 7]))
})

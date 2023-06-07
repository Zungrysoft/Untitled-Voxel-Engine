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

    shadedFrag: 'shaders/shaded.frag',
    shadedVert: 'shaders/shaded.vert',
  },

  models: {
    cube: 'models/cube.obj',
    skybox: 'models/skybox.obj',
    chunkOutline: 'models/chunk_outline.obj',
  }
})


const { assets } = game
assets.shaders = {
  default: gfx.createShader(
    assets.shaderSources.defaultVert,
    assets.shaderSources.defaultFrag
  ),
  shaded: gfx.createShader(
    assets.shaderSources.shadedVert,
    assets.shaderSources.shadedFrag
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
  game.addThing(new Player([4, 3, 15]))
})

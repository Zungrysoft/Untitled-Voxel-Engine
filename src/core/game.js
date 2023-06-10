/* global requestAnimationFrame, localStorage, Image, Audio */

import Scene from './scene.js'
import * as u from './utils.js'
import * as soundmanager from './soundmanager.js'

export const globals = {}
export const assets = {}
export const config = {
  width: 1280,
  height: 720,
  isWebglEnabled: true,
  catchupFrames: 5,
  preventLeave: false,
  isFramerateUncapped: false
}

// inputs
export const gamepads = []
export const keysDown = {}
export const lastKeysDown = {}
export const keysPressed = {}
export const buttonsDown = {}
export const lastButtonsDown = {}
export const buttonsPressed = {}
export const mouse = {
  position: [0, 0],
  delta: [0, 0],
  scrollDelta: [0, 0],
  leftButton: false,
  leftClick: false,
  rightButton: false,
  rightClick: false,
  lock () {
    // document.body.requestPointerLock()
    document.querySelector('#canvas2d').requestPointerLock()
  },
  unlock () {
    document.exitPointerLock()
  },
  isLocked () {
    return Boolean(document.pointerLockElement)
  },
  setStyle (style = 'default') {
    document.body.style.cursor = style
  }
}

// engine internal variables
let scene
let nextScene
let lastScene
let previousFrameTime = null
let accumulator = 0
let frameCount = 0
let isFocused = true
let requestedAnimationFrame = false
let frameRate = 0
let updateSpeed = 1
let impactFrameCount = 0
let gameTime = 0
let startGameTime

// canvas setup
const canvasStyle = `
position: absolute;
object-fit: contain;
image-rendering: pixelated;
width: 100vw;
height: 100vh;
`
const backgroundCanvas = document.createElement('canvas')
backgroundCanvas.width = config.width
backgroundCanvas.height = config.height
backgroundCanvas.id = 'backgroundCanvas'
backgroundCanvas.style = canvasStyle
document.body.appendChild(backgroundCanvas)
const backgroundCtx = backgroundCanvas.getContext('2d')
backgroundCtx.fillStyle = 'black'
backgroundCtx.fillRect(0, 0, config.width, config.height)
export const canvas3d = document.createElement('canvas')
canvas3d.width = config.width
canvas3d.height = config.height
canvas3d.id = 'canvas3d'
canvas3d.style = canvasStyle
document.body.appendChild(canvas3d)
export const canvas2d = document.createElement('canvas')
canvas2d.width = config.width
canvas2d.height = config.height
canvas2d.id = 'canvas2d'
canvas2d.style = canvasStyle
document.body.appendChild(canvas2d)
document.body.style.backgroundColor = '#001'
document.body.style.margin = '0'
export const ctx = canvas2d.getContext('2d')
ctx.imageSmoothingEnabled = false
export const gl = canvas3d.getContext('webgl', { antialias: false })
export const ext = gl.getExtension("OES_standard_derivatives");

function frame (frameTime) {
  let delta = previousFrameTime === null ? 0 : (frameTime - previousFrameTime) / 1000
  previousFrameTime = frameTime

  if (!startGameTime) {
    startGameTime = frameTime
  }

  delta *= 60
  if (delta >= 0.98 && delta <= 1.02) {
    delta = 1
  }
  delta *= updateSpeed

  // bypass adding to the accumulator during impact frames
  // so objects don't interpolate weirdly during impacts
  if (impactFrameCount > 0) {
    impactFrameCount -= delta
  } else {
    accumulator += delta
  }

  // make sure we update at 60hz
  let times = 0
  let rerender = false
  while (accumulator >= 1 && times < config.catchupFrames) {
    rerender = update() || rerender
    gameTime = frameTime
    accumulator -= 1
    times += 1
  }
  accumulator %= 1

  if (rerender || config.isFramerateUncapped) {
    draw()
    frameCount += 1
  }

  mouse.delta[0] = 0
  mouse.delta[1] = 0
  mouse.scrollDelta[0] = 0
  mouse.scrollDelta[1] = 0
  requestAnimationFrame(frame)
}

function update () {
  handleCanvasResize()
  handleTabbingInAndOut()
  handleSceneChange()

  if (!isFocused) {
    return
  }

  // update keys pressed
  for (const key in keysPressed) delete keysPressed[key]
  for (const key in keysDown) {
    if (!lastKeysDown[key]) keysPressed[key] = true
  }

  // Update buttons down
  for (const button in buttonsDown) delete buttonsDown[button]
  if (navigator?.getGamepads) {
    for (const [i, gamepad] of Object.entries(navigator.getGamepads())) {
      gamepads[i] = gamepad

      if (gamepad?.buttons) {
        for (const [i, button] of Object.entries(gamepad.buttons)) {
          if (button.pressed) {
            buttonsDown[i] = true
          }
        }
      }
    }
  }

  // update buttons pressed
  for (const button in buttonsPressed) delete buttonsPressed[button]
  for (const button in buttonsDown) {
    if (!lastButtonsDown[button]) buttonsPressed[button] = true
  }

  // update last buttons down
  for (const button in lastButtonsDown) delete lastButtonsDown[button]
  for (const button in buttonsDown) lastButtonsDown[button] = true

  if (scene) {
    scene.clearScreen()
    scene.update()
  }
  soundmanager.update()

  // update the last keys down
  for (const key in lastKeysDown) delete lastKeysDown[key]
  for (const key in keysDown) lastKeysDown[key] = true
  mouse.leftClick = false
  mouse.rightClick = false

  // successfully updated, we should rerender
  return true
}

function draw () {
  if (!document.hasFocus()) { return }
  scene?.draw()
}

function loseFocus () {
  for (const key in keysDown) delete keysDown[key]
  for (const sound of Object.values(assets.sounds)) {
    sound.wasPlayingWhenFocused = !sound.paused
    sound.pause()
  }
}

function gainFocus () {
  accumulator = 0
  for (const sound of Object.values(assets.sounds)) {
    if (sound.wasPlayingWhenFocused) {
      sound.play()
    }
  }
}

// handle tabbing in / out of the game
// pause the game and all sound effects when tabbed out
function handleTabbingInAndOut () {
  const focused = document.hasFocus()
  if (!focused && isFocused) {
    loseFocus()
  }
  if (focused && !isFocused) {
    gainFocus()
  }
  isFocused = focused
}

function handleSceneChange () {
  if (!nextScene) return
  if (scene) {
    scene.onUnload()
    const persistent = scene.things.filter(thing => thing.isPersistent)
    const persistentNames = (
      Object.fromEntries(
        Object.entries(scene.namedThings)
              .filter(([_name, thing]) => thing.isPersistent)
      )
    )
    scene = new Scene()
    persistent.forEach(addThing)
    for (const name in persistentNames) {
      scene.namedThings[name] = persistentNames[name]
    }
  } else {
    scene = new Scene()
  }
  nextScene()
  lastScene = nextScene
  nextScene = null
}

// update canvas dimensions if they don't match the config
function handleCanvasResize () {
  if (config.width !== canvas2d.width || config.height !== canvas2d.height) {
    canvas2d.width = config.width
    canvas2d.height = config.height
    canvas3d.width = config.width
    canvas3d.height = config.height
    backgroundCanvas.width = config.width
    backgroundCanvas.height = config.height
    backgroundCtx.fillStyle = 'black'
    backgroundCtx.fillRect(0, 0, config.width, config.height)
    gl.viewport(0, 0, config.width, config.height)
  }
}

/********************************************************************************
   input handling
 ********************************************************************************/

document.onkeydown = (event) => {
  keysDown[event.code] = true
  if (config.preventLeave) {
    event.preventDefault()
    return false
  }
  return true
}

document.onkeyup = (event) => {
  delete keysDown[event.code]
  if (config.preventLeave) {
    event.preventDefault()
    return false
  }
  return true
}

document.onmouseup = (event) => {
  mouse.leftButton = event.buttons & 1
  mouse.rightButton = event.buttons & 2
}

document.onmousedown = (event) => {
  mouse.leftButton = event.buttons & 1
  mouse.leftClick = event.buttons & 1
  mouse.rightButton = event.buttons & 2
  mouse.rightClick = event.buttons & 2
}

document.onwheel = (event) => {
  event.preventDefault()
  mouse.scrollDelta[0] += event.deltaX
  mouse.scrollDelta[1] += event.deltaY
}

window.onbeforeunload = (event) => {
  if (config.preventLeave) {
    event.preventDefault()

    // chrome requires returnValue to be set
    event.returnValue = 'Really want to quit the game?'
  }
}

window.oncontextmenu = (event) => {
  event.preventDefault()
}

canvas2d.onmousemove = (e) => {
  const aspect = Math.min(canvas2d.offsetWidth / config.width, canvas2d.offsetHeight / config.height)
  mouse.position[0] = u.map(
    e.offsetX,
    canvas2d.offsetWidth / 2 - aspect * config.width / 2,
    canvas2d.offsetWidth / 2 + aspect * config.width / 2,
    0,
    config.width,
    true
  )
  mouse.position[1] = u.map(
    e.offsetY,
    canvas2d.offsetHeight / 2 - aspect * config.height / 2,
    canvas2d.offsetHeight / 2 + aspect * config.height / 2,
    0,
    config.height,
    true
  )
  mouse.delta[0] += e.movementX
  mouse.delta[1] += e.movementY
}

/********************************************************************
   scene management
 ********************************************************************/

// sets the scene (or starts the game if it hasn't already)
export function setScene (initFunction) {
  // start the game loop if it hasn't already been started
  if (!requestedAnimationFrame) {
    requestedAnimationFrame = true
    requestAnimationFrame(frame)
    setInterval(() => {
      frameRate = frameCount
      frameCount = 0
    }, 1000)
  }

  if (!initFunction) {
    throw new Error('No function given to setScene!')
  }

  nextScene = initFunction
}

export function resetScene () {
  if (!lastScene) {
    throw new Error('No scene has been set yet!')
  }

  nextScene = lastScene
}

// load an object into the game.assets object
export async function loadAssets ({ images, sounds, ...rest }) {
  handleCanvasResize()
  const loadImage = location => {
    if (location[0] === '#') {
      const image = document.querySelector(location)
      return image
    }
    const image = new Image()
    image.src = location
    return image
  }
  const loadSound = location => {
    if (location[0] === '#') {
      const sound = document.querySelector(location)
      return sound
    }
    const sound = new Audio()
    sound.src = location
    return sound
  }
  const apply = (object, loader) => (
    Object.fromEntries(
      Object.entries(object).map(([name, url]) => [
        name, loader(url)
      ])
    )
  )
  const resolveObject = async (object) => {
    const values = await Promise.all(Object.values(object))
    return Object.fromEntries(
      Object.keys(object).map((name, i) => [name, values[i]])
    )
  }

  backgroundCtx.font = 'italic bold 32px Arial'
  const announce = (text) => {
    backgroundCtx.fillStyle = 'black'
    backgroundCtx.fillRect(0, 0, config.width, config.height)
    backgroundCtx.fillStyle = 'gray'
    backgroundCtx.fillText(text, 64, config.height - 64)
  }

  /* load images into assets.images and wait for them all to load */
  assets.images = {
    ...assets.images,
    ...apply(images, loadImage)
  }
  announce('Loading images...')
  await Promise.all(
    Object.values(assets.images).map(image => (
      new Promise(resolve => {
        if (image.complete) resolve()
        image.onload = () => resolve()
      })
    ))
  )

  /* load sounds into assets.sounds and wait for them all to load */
  assets.sounds = {
    ...assets.sounds,
    ...(await resolveObject(apply(sounds, loadSound)))
  }
  announce('Loading sounds...')
  await Promise.all(
    Object.values(assets.sounds).map(sound => (
      new Promise(resolve => {
        if (sound.complete) resolve()
        sound.oncanplay = () => resolve()
      })
    ))
  )

  /* all fields not named images or sound are treated as text files */
  for (const field in rest) {
    announce(`Loading ${field}...`)
    assets[field] = assets[field] || {}
    for (const [name, source] of Object.entries(rest[field])) {
      assets[field][name] = (
        source[0] === '#'
        ? document.querySelector(source)
        : (await (await fetch(source)).text())
      )
    }
  }

  announce('Initializing...')
}

/********************************************************************
   thing management
 ********************************************************************/

// get reference to a specific thing by its name
export function getThing (name) {
  return scene.namedThings[name]
}

export function getNameOfThing (thing) {
  for (const [name, check] of Object.entries(scene.namedThings)) {
    if (thing === check) {
      return name
    }
  }
}

export function getThingsInAabb (x1, y1, x2, y2) {
  return scene.spatialHash.query(x1, y1, x2, y2)
}

export function getThings () {
  return scene.things
}

// give a thing a name so it can be referenced by it
export function setThingName (thing, name) {
  scene.namedThings[name] = thing
}

// add a thing to the game's scene
export function addThing (thing) {
  return scene.addThing(thing)
}

/********************************************************************************
   pausing
 ********************************************************************************/

export function pause (...excludedThings) {
  scene.paused = true
  scene.excludedThings = excludedThings
}

export function unpause () {
  scene.paused = false
}

/********************************************************************************
   getters
 ********************************************************************************/

export function getMapData () {
  return scene.mapData
}

export function getCamera2D () {
  return scene.camera2D
}

export function getCamera3D () {
  return scene.camera3D
}

export function getFramerate () {
  return frameRate
}

export function getInterpolation () {
  return (
    config.isFramerateUncapped
      ? u.clamp(accumulator % 1, 0, 1)
      : 1
  )
}

export function getTime () {
  return (gameTime - startGameTime) / 1000
}

/********************************************************************************
   juice
 ********************************************************************************/

export function setUpdateSpeed (speed = 1) {
  updateSpeed = speed
}

export function setScreenShake (amount = 6, strength = 2) {
  scene.screenShakes.push({
    vector: [0, 0],
    amount,
    strength
  })
}

export function setImpactFrames (frames = 1) {
  impactFrameCount = frames
}

/********************************************************************************
   saving / loading
 ********************************************************************************/

export const saveData = new Proxy(localStorage, {
  set (object, prop, value) {
    object.setItem(prop, value)
  },

  get (object, prop) {
    return object.getItem(prop)
  },

  delete (object, prop) {
    object.removeItem(prop)
  }
})

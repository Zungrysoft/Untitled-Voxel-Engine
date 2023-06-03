import * as game from './core/game.js'
import * as u from './core/utils.js'
import * as soundmanager from './core/soundmanager.js'
import * as gfx from './core/webgl.js'
import * as mat from './core/matrices.js'
import * as vec2 from './core/vector2.js'
import * as vec3 from './core/vector3.js'
import Thing from './core/thing.js'
import { getLevel } from './levelloader.js'

export default class Board extends Thing {
  state = {}
  animState = []
  advancementData = {
    control: '',
    queue: ['fall'],
  }
  stateStack = []
  backgroundScroll = [0, 0]
  backgroundPattern = game.ctx.createPattern(game.assets.images.background, 'repeat')
  viewAngle = [Math.PI/2, Math.PI*(1/4)]
  viewAngleTarget = this.viewAngle
  viewDistance = 4
  viewPosition = [0, 0, 0]
  time = 0
  actionTime = 0
  colorMap = {
    'red': [0.5, 0.0, 0.0, 1],
    'green': [0.0, 0.6, 0.0, 1],
    'blue': [0.0, 0.0, 0.4, 1],
    'yellow': [0.9, 0.9, 0.0, 1],
    'cyan': [0.0, 0.5, 0.5, 1],
    'purple': [0.5, 0.0, 0.8, 1],
    'orange': [1.0, 0.5, 0.0, 1],
    'white': [1.0, 1.0, 1.0, 1],
  }
  controlMap = {}

  constructor () {
    super()
    game.setThingName(this, 'board')

    // Build board state from level file
    if (game.globals.level === 0) {
      this.state = JSON.parse(game.globals.customLevelState)
    }
    else {
      this.state = getLevel(game.globals.level)
    }

    // Consistency
    this.state.level = game.globals.level
    this.state.cratesDelivered = 0

    // Set up camera based on level params
    this.setupCamera(this.state)

    // Initial setup of animations
    this.resetAnimations()

    // Choose controls
    this.setupControls()
  }

  setupCamera(state) {
    this.viewDistance = state.cameraDistance + 0.1
    this.viewPosition = state.cameraPosition
    this.viewAngle = state.cameraStartAngle
    this.viewAngleTarget = state.cameraStartAngle
  }

  setupControls() {
    const fullControlMap = {
      red: {keyCode: "KeyR", name: "R", buttonId: 1, buttonName: "B", priority: 0},
      green: {keyCode: "KeyG", name: "G", buttonId: 0, buttonName: "A", priority: 1},
      blue: {keyCode: "KeyB", name: "B", buttonId: 2, buttonName: "X", priority: 2},
      yellow: {keyCode: "KeyY", name: "Y", buttonId: 3, buttonName: "Y", priority: 3},
      cyan: {keyCode: "KeyC", name: "C", buttonId: 9, buttonName: "Select", priority: 4},
      purple: {keyCode: "KeyP", name: "P", buttonId: 8, buttonName: "Start", priority: 5},
      orange: {keyCode: "KeyO", name: "O", buttonId: 11, buttonName: "RS", priority: 6},
      white: {keyCode: "KeyW", name: "W", buttonId: 10, buttonName: "LS", priority: 7},
    }
    this.controlMap = []

    for (const element of this.state.elements) {
      const c = element.color
      if (c && !(c in this.controlMap)) {
        this.controlMap[c] = fullControlMap[c]
      }
    }
  }

  update () {
    super.update()

    this.time ++
    this.actionTime --
    this.errorTime --

    // Decide whether to show keyboard controls or gamepad controls based on which was used most recently
    if (Object.keys(game.buttonsPressed).length) {
      game.globals.usingGamepad = true
    }
    if (Object.keys(game.keysPressed).length && !game.keysPressed.KeyL) {
      game.globals.usingGamepad = false
    }

    // Level controls
    if (this.time > 5) {
      if (game.keysPressed.Backspace || game.buttonsPressed[4]) {
        game.resetScene()
      }
      if (game.keysPressed.BracketLeft || game.keysPressed.Minus || game.keysPressed.NumpadSubtract || game.buttonsPressed[6]) {
        if (game.globals.level > 1) {
          game.globals.level --
          game.resetScene()
        }
      }
      if (game.keysPressed.BracketRight || game.keysPressed.Equal || game.keysPressed.NumpadAdd || game.buttonsPressed[7]) {
        if (game.globals.level < game.globals.levelCount) {
          game.globals.level ++
          game.resetScene()
        }
      }

      // Load custom level
      if (game.keysPressed.KeyL) {
        try {
          navigator.clipboard.readText()
          .then(text => {
            try {
              const stateData = JSON.parse(text)
              game.globals.customLevelState = text
              game.globals.level = 0
              game.resetScene()
            }
            catch (error) {
              this.errorMessage = "Failed to parse JSON"
              this.errorTime = 300
            }
          })
          .catch(err => {
            this.errorMessage = "Failed to access clipboard"
            this.errorTime = 300
          });
        }
        catch (error) {
          this.errorMessage = "Clipboard is disabled in this browser"
          this.errorTime = 300
        }
      }
    }

    // Camera controls
    if (game.keysPressed.ArrowRight || game.buttonsPressed[15]) {
      this.viewAngleTarget[0] -= Math.PI/4
    }
    if (game.keysPressed.ArrowLeft || game.buttonsPressed[14]) {
      this.viewAngleTarget[0] += Math.PI/4
    }
    if (game.keysPressed.ArrowUp || game.buttonsPressed[12]) {
      this.viewAngleTarget[1] += Math.PI/8
    }
    if (game.keysPressed.ArrowDown || game.buttonsPressed[13]) {
      this.viewAngleTarget[1] -= Math.PI/8
    }
    this.viewAngleTarget[1] = u.clamp(this.viewAngleTarget[1], 0, Math.PI/2)
    this.viewAngle = vec2.lerp(this.viewAngle, this.viewAngleTarget, 0.2)
    this.updateCamera()

    // Undo function
    if (game.keysPressed.KeyU || game.keysPressed.Space || game.buttonsPressed[5]) {
      // Make sure there are actually things to undo
      if (this.stateStack.length > 0) {
        let newState = this.stateStack.pop()
        let oldState = JSON.stringify(this.state)

        // If the new state matches the old state, that means one duplicate state got pushed
        // So go to the next state
        if (newState === oldState && this.stateStack.length > 0) {
          newState = this.stateStack.pop()
        }
        this.state = JSON.parse(newState)

        // Reset all animations
        this.resetAnimations()

        // Clear advancement queue
        this.advancementData.queue = []
      }
    }

    // =============
    // Game controls
    // =============

    // Determine if blocked
    let blocked = this.isAnimationBlocking()

    // If not blocked...
    if (!blocked) {
      // If advancement queue is empty, accept user input
      if (this.advancementData.queue.length === 0) {
        for (const control in this.controlMap) {
          // If the user pressed a control key...
          if (this.actionTime <= 0 && (game.keysDown[this.controlMap[control].keyCode] || game.buttonsDown[this.controlMap[control].buttonId])) {
            // Create action queue
            this.advancementData = {
              control: control,
              queue: [
                'conveyor',
                'fall',
                'rotator',
                'fan0',
                'fall',
                'fan1',
                'fall',
                'fan2',
                'fall',
                'fan3',
                'fall',
                'laser',
                'fall',
                'fall', // Hack for now
                'fall',
                'fall',
                'fall',
              ]
            }

            // Push current state to undo stack (but only if it's different from the previous state)
            const curState = JSON.stringify(this.state)
            if (this.stateStack[this.stateStack.length-1] !== curState) {
              this.stateStack.push(curState)
            }

            // Limit the player to one action every n frames
            // this.actionTime = 0

            // Done looking for controls
            break
          }
        }
      }

      // If there are elements in advancement queue, execute them
      while (!blocked && this.advancementData.queue.length > 0) {
        const adv = this.advancementData.queue.shift()
        if (adv === 'conveyor') {
          this.advanceConveyor(this.advancementData.control)
        }
        else if (adv === 'fall') {
          this.advanceFall()
        }
        else if (adv === 'fan0') {
          this.advanceFan(this.advancementData.control, 0)
        }
        else if (adv === 'fan1') {
          this.advanceFan(this.advancementData.control, 1)
        }
        else if (adv === 'fan2') {
          this.advanceFan(this.advancementData.control, 2)
        }
        else if (adv === 'fan3') {
          this.advanceFan(this.advancementData.control, 3)
        }
        else if (adv === 'laser') {
          this.advanceLaser(this.advancementData.control)
        }
        else if (adv === 'rotator') {
          this.advanceRotator(this.advancementData.control)
        }

        blocked = this.isAnimationBlocking()
      }
    }

    // Advance animations
    this.advanceAnimations()

    // Check for win
    if (this.state.cratesDelivered >= this.state.cratesRequired && this.state.level > 0) {
      game.globals.levelCompletions[this.state.level-1] = true
    }

  }

  updateCamera() {
    // Set up 3D camera
    const cam = game.getCamera3D()
    cam.position[0] = Math.cos(this.viewAngle[0]) * Math.cos(this.viewAngle[1]) * this.viewDistance
    cam.position[1] = Math.sin(this.viewAngle[0]) * Math.cos(this.viewAngle[1]) * this.viewDistance
    cam.position[2] = Math.sin(this.viewAngle[1]) * this.viewDistance + 1
    cam.position = vec3.add(cam.position, this.viewPosition)
    cam.lookVector = vec3.anglesToVector(this.viewAngle[0], this.viewAngle[1])
  }

  defaultAnimation() {
    return {
      position: [0, 0, 0],
      endPosition: [0, 0, 0],
      speed: 0,
      moveType: 'none',
      spinSpeed: 0,
      spinAngle: 0,
      scale: 1.0,
      scrollTime: 0,
      scrollPosition: 0,
      laserThickness: 0,
      laserLength: 0,
      rotation: 0,
      endRotation: 0,
      shrinkHeight: 0,
    }
  }

  resetAnimations() {
    this.animState = this.state.elements.map(e => this.defaultAnimation())
  }

  advanceAnimations() {
    const MOVE_LINEAR_SPEED = 0.07
    const GRAVITY = -0.02
    const MOVE_FRICTION_TIME = 15
    const MOVE_FRICTION_FRICTION = 0.005
    const MOVE_FRICTION_THRESHOLD = 0.02
    const SPIN_FRICTION = 0.04
    const MOVE_SHRINK_RATE = 0.1
    const LASER_SHRINK_RATE = 0.004
    const ROTATE_LINEAR_SPEED = 0.1

    for (let i = 0; i < this.animState.length; i ++) {
      const anim = this.animState[i]

      // Linear movement (such as from conveyor belts)
      if (anim.moveType === 'linear') {
        // If this is already really close, end the animation
        const delta = vec3.subtract(anim.endPosition, anim.position)
        if (vec3.magnitude(delta) < MOVE_LINEAR_SPEED) {
          anim.moveType = 'none'
        }
        // Otherwise, move toward it at a constant velocity
        else {
          const vel = vec3.scale(vec3.normalize(delta), MOVE_LINEAR_SPEED)
          anim.position = vec3.add(anim.position, vel)
        }
      }

      // Friction movement (such as from fans)
      if (anim.moveType === 'friction') {
        // Find distance between start and end
        const delta = vec3.subtract(anim.endPosition, anim.position)

        // If velocity is at zero, we've just started. So set initial values.
        // Initial speed is calculated such that the animation will complete in MOVE_FRICTION_TIME frames
        if (anim.speed === 0) {
          anim.speed = (vec3.magnitude(delta) - (0.5 * (-MOVE_FRICTION_FRICTION) * Math.pow(MOVE_FRICTION_TIME, 2))) / MOVE_FRICTION_TIME
        }

        // If this is already really close, end the animation
        if (vec3.magnitude(delta) < MOVE_FRICTION_THRESHOLD) {
          anim.moveType = 'none'
        }

        // Otherwise, move toward it
        else {
          anim.speed -= MOVE_FRICTION_FRICTION
          const vel = vec3.scale(vec3.normalize(delta), anim.speed)
          anim.position = vec3.add(anim.position, vel)
        }
      }

      // Falling movement
      if (anim.moveType === 'fall' || anim.moveType === 'deliver') {
        // Accelerate and move
        anim.speed += GRAVITY
        anim.position[2] += anim.speed

        // If we've hit the ground, end the animation
        if (anim.position[2] <= anim.endPosition[2]) {
          // Play a sound effect
          if (Math.abs(anim.speed) > Math.abs(GRAVITY * 5) && anim.moveType !== 'deliver') {
            soundmanager.playSound("thump")
          }

          anim.moveType = 'none'
        }
      }

      // Shrinking when falling into a chute
      if (anim.moveType === 'deliver') {
        // Get smaller the closer we get to our target
        const dist = vec3.magnitude(vec3.subtract(anim.position, anim.endPosition))
        anim.scale = u.map(dist, 0, 1.0, 0, 1.0, true)
      }

      // Shrinking from a laser
      if (anim.moveType === 'shrink') {
        // If we've hit zero, end the animation
        anim.scale -= MOVE_SHRINK_RATE

        if (anim.scale <= 0) {
          anim.moveType = 'none'
        }
      }

      // Rotator rotating
      if (anim.moveType === 'rotate' || anim.moveType === 'rotateShrink') {
        // If this is already really close, end the animation
        const dist = vec2.angleDistance(anim.rotation, anim.endRotation)
        if (dist < ROTATE_LINEAR_SPEED) {
          anim.moveType = 'none'
          anim.scale = 1.0
        }
        // Otherwise, move toward it at a constant velocity
        else {
          anim.rotation = vec2.lerpAngles(anim.rotation, anim.endRotation, ROTATE_LINEAR_SPEED/dist)

          // Object rotating
          // Scale element down so its rotation doesn't cause it to intersect with adjacent tiles
          const angleScale = Math.max(Math.abs(Math.cos(anim.rotation + Math.PI/4)), Math.abs(Math.sin(anim.rotation + Math.PI/4)))
          const scale = (1/angleScale) * 0.7071
          let heightAdjust = (2*anim.shrinkHeight)
          if (anim.moveType === 'rotateShrink') {
            anim.scale = scale
            heightAdjust ++
          }

          // Move the element downward to counteract rotateShrink shrinking
          anim.position = [...anim.endPosition]
          anim.position[2] -= ((1-scale)/2) * heightAdjust
        }
      }

      // Fan spinning
      if (anim.spinSpeed > 0) {
        anim.spinSpeed *= 1.0-SPIN_FRICTION
        anim.spinAngle = (anim.spinAngle + anim.spinSpeed) % (Math.PI*2)
      }

      // Texture scrolling
      if (anim.scrollTime > 0) {
        anim.scrollTime -= 1
        anim.scrollPosition += MOVE_LINEAR_SPEED
      }

      // Laser beam
      if (anim.laserThickness > 0) {
        anim.laserThickness -= Math.max(0, LASER_SHRINK_RATE)
      }
    }
  }

  isAnimationBlocking() {
    for (const anim of this.animState) {
      if (anim.moveType != 'none') {
        return true
      }
    }
    return false
  }

  moveable(type) {
    return ['crate', 'fan', 'laser'].includes(type)
  }

  pushable(type) {
    return ['crate', 'fan', 'laser'].includes(type)
  }

  mustShrinkWhenRotating(type) {
    return !(['rotator', 'fan', 'laser'].includes(type))
  }

  angleToRotation(angle) {
    return -(angle || 0) * (Math.PI/2)
  }

  getElementAt(pos) {
    for (let i = 0; i < this.state.elements.length; i ++) {
      if (vec3.equals(this.state.elements[i].position, pos)) {
        return i
      }
    }
    return -1
  }

  getElementDownward(position) {
    // Loop over positions below crate
    let pos = [...position]
    while (pos[2] > this.state.floorHeight) {
      pos[2] --

      // Loop over elements that could be there
      const index = this.getElementAt(pos)
      if (index >= 0) {
        const elem = this.state.elements[index]
        if (vec3.equals(elem.position, pos)) {
          return index
        }
      }
    }

    // Didn't find anything, return -1 for falling into the void
    return -1
  }

  // Return the new state of the element
  tryToMoveInto(pos, moveDir, eState, dState) {
    // Loop over elements
    for (let i = 0; i < eState.length; i ++) {
      const es = eState[i]
      const ds = dState[i]

      // Check if that element is in that space
      if (vec3.equals(pos, es.position)) {
        // If the element in that space is blocked, this element is blocked too
        if (ds.decision === 'blocked') {
          // console.log("Blocked by blocked element " + es.letter)
          return 'blocked'
        }

        // If the element in that space is undecided, this element is undecided too
        if (ds.decision === 'undecided') {
          return 'undecided'
        }

        // If the element in that space is moving out of this space, this element is moving if it's in the same direction
        // If it's moving in a different direction, it is blocked since it would hit the corner
        if (ds.decision === 'moving') {
          if (moveDir === ds.moveDirection) {
            return 'moving'
          }
          else {
            // console.log("Blocked by element " + es.letter + " moving out of space in wrong direction")
            return 'blocked'
          }
        }
      }

      // Check if that element is moving into this space
      if (ds.decision === 'moving') {
        if (vec3.equals(pos, ds.movePosition)) {
          // console.log(es.letter + " was blocked by element moving into space")
          return 'blocked'
        }
      }
    }
    return 'moving'
  }

  advanceConveyor(color) {
    // Track which elements are blocked and which ones have moved
    const states = this.state.elements.map((e) => {return{
      decision: 'blocked',
      moveDirection: -1,
      movePosition: [...e.position]
    }})

    // Mark moveable elements as undecided
    for (const i in this.state.elements) {
      const element = this.state.elements[i]
      if (this.moveable(element.type)) {
        states[i].decision = 'undecided'
      }
    }

    // Direction to move vector
    const dirs = [[0, 1, 0], [1, 0, 0], [0, -1, 0], [-1, 0, 0]]

    // Iterate until all elements have decided how to move
    let maxIter = 50
    while (states.filter(e => e.decision === 'undecided').length > 0 && maxIter > 0) {
      // Limit the number of iterations so that if we have a cyclical state, it won't cause an infinite loop
      maxIter --

      // Loop over undecided elements
      for (const i in this.state.elements) {
        const element = this.state.elements[i]
        if (states[i].decision === 'undecided') {
          // Check what this element is sitting on top of
          const below = this.getElementAt(vec3.add(element.position, [0, 0, -1]))
          if (below !== -1) {
            // If on top of an active conveyor
            if (this.state.elements[below].type === 'conveyor' && this.state.elements[below].color === color && !this.state.elements[below].destroyed) {
              // Set move direction
              const moveDir = this.state.elements[below].angle || 0
              states[i].moveDirection = moveDir

              // Get position it wants to move into
              const moveSpace = vec3.add(element.position, dirs[moveDir])
              states[i].movePosition = moveSpace
              // console.log(element.letter + " is moving into " + moveSpace)

              // Check if the space to move into is (or has been claimed as) occupied
              states[i].decision = this.tryToMoveInto(moveSpace, moveDir, this.state.elements, states)
            }

            // If on top of a moving element
            else if (states[below].decision === 'moving') {
              // Set move direction
              const moveDir = states[below].moveDirection || 0
              states[i].moveDirection = moveDir

              // Get position it wants to move into
              const moveSpace = vec3.add(element.position, dirs[moveDir])
              states[i].movePosition = moveSpace

              // Check if the space to move into is (or has been claimed as) occupied
              states[i].decision = this.tryToMoveInto(moveSpace, moveDir, this.state.elements, states)
            }

            // If on top of blocked element, set it as blocked
            else if (states[below].decision === 'blocked') {
              // console.log(element.letter + " was blocked by sitting on top of non-moving element")
              states[i].decision = 'blocked'
              continue
            }

            // If on top of undecided element, wait for that element to decide
            else if (states[below].decision === 'undecided') {
              continue
            }
          }
          else {
            // Sitting on air. Don't move it until the fall step
            // console.log(this.state.elements[i].letter + " was blocked by sitting on top of air")
            states[i].decision = 'blocked'
            continue
          }
        }
      }
    }

    // Sound
    let didMoveSomething = false

    // Advance state based on decisions
    for (let i = 0; i < this.state.elements.length; i ++) {
      if (states[i].decision === 'moving') {
        // Animation
        this.animState[i].moveType = 'linear'
        this.animState[i].position = [...this.state.elements[i].position]
        this.animState[i].endPosition = [...states[i].movePosition]

        // Move the element's position
        this.state.elements[i].position = [...states[i].movePosition]

        didMoveSomething = true
      }

      // Conveyor Belt Scroll Animation
      if (this.state.elements[i].type === 'conveyor' && this.state.elements[i].color === color) {
        this.animState[i].scrollTime = 14
      }
    }

    if (didMoveSomething) {
      soundmanager.playSound("shift", 0.3)
    }
  }

  fanPushElement(position, direction) {
    const index = this.getElementAt(position)

    // Base case: this is air
    if (index === -1) {
      return true
    }
    // Base case: element is not pushable
    if (!this.pushable(this.state.elements[index].type)) {
      return false
    }

    // Recursion case: Check the next element behind
    const canPush = this.fanPushElement(vec3.add(position, direction), direction)

    // If the result is that we can push this element, do it
    if (canPush) {
      // Animation
      this.animState[index].moveType = 'friction'
      this.animState[index].position = [...this.state.elements[index].position]
      this.animState[index].endPosition = vec3.add(position, direction)
      this.animState[index].speed = 0

      // Move
      this.state.elements[index].position = vec3.add(position, direction)
    }

    // Return result to previous element
    return canPush
  }

  advanceFan(color, angle) {
    // To simplify logic, we do each fan direction separately

    // Direction to move vector
    const dirs = [[0, 1, 0], [1, 0, 0], [0, -1, 0], [-1, 0, 0]]

    // Sound
    let didPushSomething = false
    let didSpin = false

    // Iterate over fans...
    for (const i in this.state.elements) {
      const element = this.state.elements[i]
      // If this is a fan of the right color and angle...
      if (element.type === 'fan' && element.angle === angle && element.color === color && !element.destroyed) {
        // Find elements in this fan's line
        let pos = [...element.position]
        while (vec2.magnitude(pos) < 50) {
          pos = vec3.add(pos, dirs[angle])
          const index = this.getElementAt(pos)

          // If this is a moveable element, try to push it
          if (index !== -1) {
            let result = this.fanPushElement(pos, dirs[angle])
            if (result === true) {
              didPushSomething = true
            }
            break
          }
        }

        // Fan spinning animation
        this.animState[i].spinSpeed = 0.6
        didSpin = true
      }
    }

    if (didPushSomething) {
      soundmanager.playSound("wind", 0.3)
    }
    if (didSpin) {
      soundmanager.playSound("whoosh", 0.3)
    }
  }

  rotatorRotateElement(position, rotateDirection, shrinkHeight) {
    const index = this.getElementAt(position)

    // Don't rotate air
    if (index === -1) {
      return
    }

    // Rotate it
    let angle = this.state.elements[index].angle || 0
    let newAngle = angle
    if (rotateDirection === 'ccw') {
      // State
      newAngle ++
      if (newAngle > 3) newAngle = 0;
      this.state.elements[index].angle = newAngle
    }
    else {
      // State
      newAngle --
      if (newAngle < 0) newAngle = 3;
      this.state.elements[index].angle = newAngle
    }

    // Animation
    const shrink = this.mustShrinkWhenRotating(this.state.elements[index].type) || this.state.elements[index].scaffold
    this.animState[index].moveType = shrink ? 'rotateShrink' : 'rotate'
    this.animState[index].rotation = this.angleToRotation(angle)
    this.animState[index].endRotation = this.angleToRotation(newAngle)
    this.animState[index].position = this.state.elements[index].position
    this.animState[index].endPosition = this.state.elements[index].position
    this.animState[index].shrinkHeight = shrinkHeight
  }

  rotatorRotate(position, rotateDirection, shrinkHeight, height) {
    const index = this.getElementAt(position)

    // Base case: this is air
    if (index === -1) {
      return false
    }
    // Base case: element is not moveable
    // Ignore this base case if height <= 1 since the rotator can always rotate itself and the element on top of it
    if (!this.moveable(this.state.elements[index].type) && height > 1) {
      return false
    }

    // Perform the rotation and animation
    this.rotatorRotateElement(position, rotateDirection, shrinkHeight)

    // Track stack height
    const shrink = this.mustShrinkWhenRotating(this.state.elements[index].type) || this.state.elements[index].scaffold
    if (shrink) {
      shrinkHeight ++
    }

    // Since this element was rotated, try to rotate the element on top of it
    this.rotatorRotate(vec3.add(position, [0, 0, 1]), rotateDirection, shrinkHeight, height + 1)

    // Return result to previous element
    return true
  }

  advanceRotator(color) {
    // Sound
    let didRotateSomething = false

    // Iterate over rotators...
    for (const i in this.state.elements) {
      const element = this.state.elements[i]
      // If this is a fan of the right color and angle...
      if (element.type === 'rotator' && element.color === color && !element.destroyed) {
        let pos = [...element.position]

        // Rotate everything
        let result = this.rotatorRotate(pos, element.rotateDirection, 0, 0)
        if (result === true) {
          didRotateSomething = true
        }
      }
    }

    if (didRotateSomething) {
      soundmanager.playSound("shift", 0.3)
    }
  }

  advanceFall() {
    // Track which elements are blocked and which ones have moved
    const states = this.state.elements.map((e) => {return{
      decision: 'blocked',
      movePosition: [...e.position],
      fellInChute: false,
    }})

    // Mark moveable elements as undecided
    for (const i in this.state.elements) {
      const element = this.state.elements[i]
      if (this.moveable(element.type)) {
        states[i].decision = 'undecided'
      }
    }

    // Iterate until all elements have decided how to move
    let maxIter = 50
    while (states.filter(e => e.decision === 'undecided').length > 0 && maxIter > 0) {
      // Limit the number of iterations so that if we have a cyclical state, it won't cause an infinite loop
      maxIter --

      // Loop over undecided elements
      for (const i in this.state.elements) {
        const element = this.state.elements[i]
        if (states[i].decision === 'undecided') {
          // Check what this element is sitting on top of
          const below = this.getElementDownward([...element.position])
          if (below !== -1) {
            // If on top of a chute, destroy self
            if (this.state.elements[below].type === 'chute') {
              states[i].decision = 'moving'
              states[i].movePosition = [...states[below].movePosition]
              states[i].fellInChute = this.state.elements[below].letter
            }

            // If on top of a decided element, move down to it
            else if (states[below].decision === 'blocked' || states[below].decision === 'moving') {
              states[i].decision = 'moving'
              states[i].movePosition = vec3.add(states[below].movePosition, [0, 0, 1])
              if (states[below].movePosition[2] <= this.state.floorHeight) {
                states[i].movePosition[2] = this.state.floorHeight
              }
              continue
            }

            // If on top of undecided element, wait for that element to decide
            else if (states[below].decision === 'undecided') {
              continue
            }
          }
          else {
            // Sitting on the void. Fall into it.
            // console.log(element.letter + " fell into the void")
            states[i].decision = 'moving'
            states[i].movePosition[2] = this.state.floorHeight
            continue
          }
        }
      }
    }

    // Advance state based on decisions
    let didCollect = false
    let didFail = false
    for (let i = 0; i < this.state.elements.length; i ++) {
      if (states[i].decision === 'moving') {
        // Animation
        this.animState[i].moveType = 'fall'
        this.animState[i].position = [...this.state.elements[i].position]
        this.animState[i].endPosition = [...states[i].movePosition]
        this.animState[i].speed = 0

        // If fell into the void, make it disappear
        if (this.animState[i].endPosition[2] <= this.state.floorHeight && !this.state.elements[i].destroyed) {
          this.animState[i].moveType = 'deliver'
          this.state.elements[i].destroyed = true
        }

        // If it fell in a chute, special rules apply
        if (states[i].fellInChute) {
          this.state.elements[i].destroyed = true
          this.state.elements[i].position = [0, 0, this.state.floorHeight]
          if (this.state.elements[i].letter === states[i].fellInChute) {
            this.state.cratesDelivered ++
            didCollect = true
          }
          else {
            didFail = true
          }

          this.animState[i].moveType = 'deliver'
        }
        // Otherwise, just move it where it's headed
        else {
          this.state.elements[i].position = states[i].movePosition
        }
      }
    }

    if (didCollect) {
      soundmanager.playSound("collect", 0.3)
    }
    if (didFail) {
      soundmanager.playSound("fail", 0.3)
    }
  }

  advanceLaser(color) {
    // Track which elements are destroyed
    const destroyed = this.state.elements.map(_ => false)

    // Direction to move vector
    const dirs = [[0, 1, 0], [1, 0, 0], [0, -1, 0], [-1, 0, 0]]

    // Sound effects
    let didShootLaser = false
    let didHitLaser = false

    // Iterate over elements...
    for (const i in this.state.elements) {
      const element = this.state.elements[i]
      // If this is a laser of the right color...
      if (element.type === 'laser' && element.color === color && !element.destroyed) {
        // Laser animation
        this.animState[i].laserLength = 50
        this.animState[i].laserThickness = 0.04
        didShootLaser = true

        // Find elements in this fan's line
        let pos = [...element.position]
        while (vec2.magnitude(pos) < 50) {
          pos = vec3.add(pos, dirs[element.angle])
          const index = this.getElementAt(pos)

          // If this is a moveable element, mark it for destruction
          if (index !== -1) {
            destroyed[index] = true

            // Animation
            this.animState[i].laserLength = vec2.magnitude(vec3.subtract(pos, element.position))

            didHitLaser = true

            break
          }
        }
      }
    }

    if (didShootLaser) {
      soundmanager.playSound("laser", 0.2)
    }
    if (didHitLaser) {
      soundmanager.playSound("laserHit", 0.8)
    }

    for (const i in this.state.elements) {
      if (destroyed[i]) {
        // Animation
        this.animState[i].moveType = 'shrink'
        this.animState[i].scale = 1.0
        this.animState[i].position = [...this.state.elements[i].position]

        // State update
        this.state.elements[i].destroyed = true
        this.state.elements[i].position = [0, 0, this.state.floorHeight]
      }
    }
  }

  postDraw () {
    const { ctx } = game

    // Skybox
    gfx.setShader(assets.shaders.default)
    game.getCamera3D().setUniforms()
    gfx.set('color', [1, 1, 1, 1])
    gfx.setTexture(assets.textures.background)
    gfx.set('modelMatrix', mat.getTransformation({
      scale: [200, 200, -100],
    }))
    gfx.drawMesh(assets.meshes.skybox)
  }

  draw () {
    const { ctx } = game
    // Draw each of the game elements
    for (let i = 0; i < this.state.elements.length; i ++) {
      this.drawElement(this.state.elements[i], this.animState[i])
    }

    // Draw the control HUD
    {
      ctx.save()
      ctx.translate(32, game.config.height)
      ctx.font = 'italic 40px Times New Roman'
      const controls = Object.keys(this.controlMap).sort((a, b) => {return this.controlMap[a].priority < this.controlMap[b].priority ? 1 : -1})
      for (const key of controls) {
        const control = this.controlMap[key]
        const keyName = game.globals.usingGamepad ? control.buttonName : control.name

        ctx.translate(0, -48)

        const str = keyName + ': ' + key
        ctx.fillStyle = 'black'
        ctx.fillText(str, 0, 0)
        ctx.fillStyle = 'white'
        ctx.fillText(str, 4, -4)
      }
      ctx.restore()
    }

    {
      const auxControls = [
        "Arrow Keys: Camera",
        "Space / U: Undo",
        "Backspace: Restart",
      ].reverse()
      const auxControlsGamepad = [
        "DPad: Camera",
        "RB: Undo",
        "LB: Restart",
      ].reverse()
      ctx.save()
      ctx.translate(game.config.width - 48, game.config.height)
      ctx.font = 'italic 40px Times New Roman'
      ctx.textAlign = 'right'
      for (const control of (game.globals.usingGamepad ? auxControlsGamepad : auxControls)) {
        ctx.translate(0, -48)
        const str = control
        ctx.fillStyle = 'black'
        ctx.fillText(str, 0, 0)
        ctx.fillStyle = 'white'
        ctx.fillText(str, 4, -4)
      }
      ctx.restore()
    }

    // Draw the score HUD
    {
      ctx.save()
      ctx.translate(32, 72)
      ctx.font = 'italic 40px Times New Roman'
      const str = this.state.cratesDelivered + "/" + this.state.cratesRequired + " crates correctly sorted"
      ctx.fillStyle = 'black'
      ctx.fillText(str, 0, 0)
      ctx.fillStyle = 'white'
      ctx.fillText(str, 4, -4)
      ctx.restore()
    }

    // Draw the victory text
    const victory = this.state.cratesDelivered >= this.state.cratesRequired
    if (victory) {
      // You win message
      {
        ctx.save()
        ctx.translate(game.config.width/2, game.config.height/2 - 100)
        ctx.font = 'italic 130px Times New Roman'
        ctx.textAlign = 'center'
        const str = this.state.level === 0 ? "Level Complete!" : "Level " + this.state.level + " Complete!"
        ctx.fillStyle = 'black'
        ctx.fillText(str, 0, 0)
        ctx.fillStyle = 'white'
        ctx.fillText(str, 4, -4)
        ctx.restore()
      }

      // Level change guide
      if (this.state.level !== 0) {
        ctx.save()
        ctx.translate(game.config.width/2, game.config.height/2 + 100)
        ctx.font = 'italic bold 50px Times New Roman'
        ctx.textAlign = 'center'
        const str = game.globals.usingGamepad ? "Use LT and RT to change levels" : "Use - and + to change levels"
        ctx.fillStyle = 'black'
        ctx.fillText(str, 0, 0)
        ctx.fillStyle = 'white'
        ctx.fillText(str, 4, -4)
        ctx.restore()
      }
    }
    if (!victory || this.state.level === 0) {
      // Draw the level Name
      {
        ctx.save()
        ctx.translate(game.config.width/2, 112)
        ctx.font = 'italic 80px Times New Roman'
        ctx.textAlign = 'center'
        const str = this.state.level === 0 ? this.state.levelTitle : "Level " + this.state.level
        ctx.fillStyle = 'black'
        ctx.fillText(str, 0, 0)
        ctx.fillStyle = 'white'
        ctx.fillText(str, 4, -4)
        ctx.restore()
      }

      // Draw completion text
      if (game.globals.levelCompletions[this.state.level-1] === true) {
        ctx.save()
        ctx.translate(game.config.width/2, 180)
        ctx.font = 'italic 40px Times New Roman'
        ctx.textAlign = 'center'
        const str = "Complete!"
        ctx.fillStyle = 'black'
        ctx.fillText(str, 0, 0)
        ctx.fillStyle = 'white'
        ctx.fillText(str, 4, -4)
        ctx.restore()
      }
    }

    // Error text
    if (this.errorTime > 0) {
      ctx.save()
      ctx.translate(game.config.width/2, game.config.height - 30)
      ctx.font = 'italic 50px Times New Roman'
      ctx.textAlign = 'center'
      const str = "Error: " + this.errorMessage
      ctx.fillStyle = u.colorToString(0.4, 0, 0, u.map(this.errorTime, 0, 60, 0, 1, true))
      ctx.fillText(str, 0, 0)
      ctx.fillStyle = u.colorToString(1, 1, 1, u.map(this.errorTime, 0, 60, 0, 1, true))
      ctx.fillText(str, 4, -4)
      ctx.restore()
    }
  }

  // Draws one game element
  drawElement (elementState, animState) {
    // Don't render if destroyed
    if (elementState.destroyed && animState.moveType !== 'deliver' && animState.moveType !== 'shrink') {
      return
    }

    // Shader
    let rShader = assets.shaders.shaded

    // Color
    let rColor = this.colorMap[elementState.color]
    if (elementState.type === 'fan' || elementState.type === 'rotator') {
      rColor = [0.4, 0.4, 0.4, 1]
    }

    // Texture
    let rTexture = assets.textures['uv_' + elementState.type]
    if (elementState.type === 'crate' || elementState.type === 'chute') {
      rTexture = assets.textures['uv_' + elementState.type + "_" + (elementState.letter || '')]
    }

    // Mesh
    let rMesh = assets.meshes[elementState.type]

    // Position
    let rPos = elementState.position
    if (animState.moveType !== 'none') {
      rPos = animState.position
    }

    // Scale
    let rScale = [1.0, 1.0, 1.0]
    if (animState.moveType !== 'none') {
      rScale = [animState.scale, animState.scale, animState.scale]
    }
    if (elementState.type === 'rotator' && elementState.rotateDirection === 'ccw') {
      rScale[0] *= -1
    }

    // Angle
    let rAngle = this.angleToRotation(elementState.angle || 0)
    if (animState.moveType === 'rotate' || animState.moveType === 'rotateShrink') {
      rAngle = animState.rotation
    }

    // Perform the draw operations
    gfx.setShader(rShader)
    game.getCamera3D().setUniforms()
    gfx.set('color', rColor || [1, 1 ,1, 1])
    gfx.set('scroll', 0)
    gfx.setTexture(rTexture || assets.textures.square)
    gfx.set('modelMatrix', mat.getTransformation({
      translation: rPos,
      rotation: [Math.PI/2, 0, rAngle],
      scale: rScale
    }))
    gfx.drawMesh(rMesh || assets.meshes.cube)

    // If this is a fan, render the blade as well
    if (elementState.type === 'fan') {
      let offset = vec2.rotate(0, -0.1, rAngle + Math.PI)
      offset.push(0.1)

      const spin = animState.spinAngle
      gfx.setShader(rShader)
      game.getCamera3D().setUniforms()
      gfx.set('color', this.colorMap[elementState.color])
      gfx.set('scroll', 0)
      gfx.setTexture(rTexture || assets.textures.square)
      gfx.set('modelMatrix', mat.getTransformation({
        translation: vec3.add(rPos, offset),
        rotation: [Math.PI/2, spin, rAngle + Math.PI],
        scale: rScale
      }))
      gfx.drawMesh(assets.meshes.fanBlade)
    }

    // If this is a rotator, render the blade as well
    if (elementState.type === 'rotator') {
      gfx.setShader(rShader)
      game.getCamera3D().setUniforms()
      gfx.set('color', this.colorMap[elementState.color])
      gfx.set('scroll', 0)
      gfx.setTexture(assets.textures.square)
      gfx.set('modelMatrix', mat.getTransformation({
        translation: rPos,
        rotation: [Math.PI/2, 0, rAngle],
        scale: rScale
      }))
      gfx.drawMesh(assets.meshes.rotatorArrows)
    }

    // If this is a conveyor, render the belt as well
    if (elementState.type === 'conveyor') {
      const scroll = -animState.scrollPosition
      gfx.setShader(rShader)
      game.getCamera3D().setUniforms()
      gfx.set('color', [1, 1, 1, 1])
      gfx.set('scroll', scroll)
      gfx.setTexture(assets.textures.uv_conveyorBelt)
      gfx.set('modelMatrix', mat.getTransformation({
        translation: rPos,
        rotation: [Math.PI/2, 0, rAngle],
        scale: rScale
      }))
      gfx.drawMesh(assets.meshes.conveyorBelt)
    }

    // Built-in scaffolding
    if (elementState.scaffold) {
      const rfTexture = assets.textures["uv_" + elementState.type + "Scaffold"] || assets.textures.uv_scaffold
      const rfMesh = assets.meshes[elementState.type + "Scaffold"] || assets.meshes.scaffold
      gfx.setShader(rShader)
      game.getCamera3D().setUniforms()
      gfx.set('color', [1, 1, 1, 1])
      gfx.set('scroll', 0)
      gfx.setTexture(rfTexture)
      gfx.set('modelMatrix', mat.getTransformation({
        translation: rPos,
        rotation: [Math.PI/2, 0, rAngle],
        scale: rScale
      }))
      gfx.drawMesh(rfMesh)
    }

    // If this is a laser, render the beam as well
    if (elementState.type === 'laser') {
      let offset = vec2.rotate(0, animState.laserLength/2, rAngle)
      offset.push(0)

      gfx.setShader(assets.shaders.default)
      game.getCamera3D().setUniforms()
      gfx.set('color', rColor)
      gfx.set('scroll', 0)
      gfx.setTexture(assets.textures.square)
      gfx.set('modelMatrix', mat.getTransformation({
        translation: vec3.add(rPos, offset),
        rotation: [Math.PI/2, 0, rAngle + Math.PI/2],
        scale: [animState.laserLength, animState.laserThickness, animState.laserThickness]
      }))
      gfx.drawMesh(assets.meshes.cube)
    }
  }
}

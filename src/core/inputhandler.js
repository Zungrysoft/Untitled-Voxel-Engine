import {
  keysDown,
  mouse,
  gamepads
} from './game.js'

export default class InputHandler {
  inputs = {}
  active = {}
  lastActive = {}

  constructor (data = {}) {
    for (const [name, listener] of Object.entries(data)) {
      this.addInput(name, listener)
    }
  }

  addInput (name, listener) {
    this.inputs[name] = listener
  }

  update () {
    // replace last active with active, and empty active
    for (const input in this.lastActive) delete this.lastActive[input]
    for (const input in this.active) {
      this.lastActive[input] = this.active[input]
      delete this.active[input]
    }

    for (const input in this.inputs) {
      const listener = this.inputs[input]
      this.active[input] = listener(keysDown, mouse, gamepads[0])
    }
  }

  get (input) {
    return this.active[input]
  }

  pressed (input) {
    return this.active[input] && !this.lastActive[input]
  }
}

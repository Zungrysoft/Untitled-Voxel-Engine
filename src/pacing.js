import * as u from './core/utils.js'

const MIN_SIDE = 0.33

const DEFAULT_PACING_CURVE = {
  beat: 0,
  beatTime: 1,
  beats: [
    {
      type: 'combat',
      duration: 2.0,
      intensity: 0.5,
    },
    {
      type: 'rest',
      duration: 2.0,
    },
    {
      type: 'combat',
      duration: 4.0,
      intensity: 0.2,
    },
    {
      type: 'combat',
      duration: 3.0,
      intensity: 0.35,
    },
    {
      type: 'checkpoint',
      duration: 2.0,
    },
    {
      type: 'combat',
      duration: 3.0,
      intensity: 0.5,
    },
    {
      type: 'combat',
      duration: 3.0,
      intensity: 0.7,
    },
    {
      type: 'combat',
      duration: 5.0,
      intensity: 1.0,
    },
    {
      type: 'finale',
    },
  ]
}

export default class PacingCurve {
  beat = 0
  beatTime = 0
  beats = []

  constructor (curve) {
    if (curve) {
      this.beats = JSON.parse(JSON.stringify(curve))
    } else {
      beats = DEFAULT_PACING_CURVE
    }
  }

  advanceIntensity(time) {
    // If the current beat has no duration, exit
    if (!this.beat.duration) {
      return this.getCurrentIntensity()
    }

    // Move to the next beat
    if (this.beatTime >= this.beats[this.beat].duration) {
      this.beat += 1
      this.beatTime = 0
    }
    // Continue with the current beat
    else {
      this.beatTime += time
    }

    return this.getCurrentIntensity()
  }

  getCurrentIntensity() {
    const curBeat = this.beats[this.beat]
    const intensity = u.map(this.beatTime, 0, curBeat.duration, curBeat.intensity*MIN_SIDE, curBeat.intensity, true)
    return intensity
  }
}

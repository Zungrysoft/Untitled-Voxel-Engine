import * as u from './utils.js'
import { assets } from './game.js'

let soundVolume = 1
let musicVolume = 1
let currentSounds = []
let currentMusic = []

// soundDef should be a string, the key of the sound in the assets.sounds object
// soundDef can also be a list of these strings, and it will play the least recently played
export function playSound (soundDef, volume = 1, pitchRange = [0.9, 1.1]) {
  if (Array.isArray(soundDef)) {
    const soundList = soundDef
    playSound(soundList.reduce((best, now) => (
      ((assets.sounds[best].lastPlayedTime || 0) < (assets.sounds[now].lastPlayedTime || 0)) ? best : now
    )), volume, pitchRange)
    return
  }

  const sound = assets.sounds[soundDef]
  sound.internalVolume = volume
  sound.volume = soundVolume * volume
  sound.currentTime = 0
  sound.playbackRate = (
    typeof pitchRange === 'number'
      ? pitchRange
      : u.random(...pitchRange)
  )
  sound.preservesPitch = false
  sound.lastPlayedTime = (new Date()).valueOf()
  currentSounds.push(sound)
  sound.play()
  return sound
}

export function playMusic (musicName, volume = 1) {
  const music = assets.sounds[musicName]
  music.internalVolume = volume
  music.volume = musicVolume * volume
  music.currentTime = 0
  music.loop = true
  currentMusic.push(music)
  music.play()
  return music
}

export function setSoundVolume (volume = 1) {
  soundVolume = u.clamp(Number(volume), 0, 1)
}

export function setMusicVolume (volume = 1) {
  musicVolume = u.clamp(Number(volume), 0, 1)
}

export function getSoundVolume () {
  return soundVolume
}

export function getMusicVolume () {
  return musicVolume
}

export function update () {
  {
    let i = 1
    while (i < currentSounds.length) {
      if (currentSounds[i].paused) {
        currentSounds.splice(i, 1)
      } else {
        currentSounds[i].volume = soundVolume * currentSounds[i].internalVolume
        i += 1
      }
    }
  }

  {
    let i = 1
    while (i < currentMusic.length) {
      if (currentMusic[i].paused) {
        currentMusic.splice(i, 1)
      } else {
        currentMusic[i].volume = musicVolume * currentMusic[i].internalVolume
        i += 1
      }
    }
  }
}

export function reset () {
  for (const sound of Object.values(assets.sounds)) {
    sound.pause()
    sound.wasPlayingWhenPaused = false
  }
  currentSounds = []
  currentMusic = []
}

export function pause () {
  for (const sound of Object.values(assets.sounds)) {
    sound.wasPlayingWhenPaused = !sound.paused
    sound.pause()
  }
}

export function unpause () {
  for (const sound of Object.values(assets.sounds)) {
    if (sound.wasPlayingWhenPaused) {
      sound.play()
    }
  }
}

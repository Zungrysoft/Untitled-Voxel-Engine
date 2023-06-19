import * as u from './core/utils.js'
import { assets } from './core/game.js'

export function rollParameters(seed, scope) {
  // Create random object
  let random = u.randomizer(seed)

  // Create parameter object
  let ret = {}

  // Iterate over params
  const allParams = assets.json.parameters
  for (const paramName in allParams) {
    const param = allParams[paramName]
    if (param.scope === scope) {
      ret[paramName] = rollParameter(random, param)
    }
  }

  // Return
  return ret
}

function rollParameter(random, parameter) {
  // Normal distribution / Bell curve
  if (parameter.mode === "bell") {
    // Generate the random number
    let val = gaussianRandom(random, parameter.mean, parameter.standardDeviation)

    // Clamp it between the min and max
    if (parameter.has("min")) {
      val = Math.max(val, parameter.min)
    }
    if (parameter.has("max")) {
      val = Math.min(val, parameter.max)
    }

    // Return
    return val
  }

  // Linear random
  return u.map(random.random(parameter.min, parameter.max))
}

function gaussianRandom(random, mean = 0, standardDeviation = 1) {
  const u = 1 - random.random();
  const v = random.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * standardDeviation + mean;
}

function mutateParameters(seed, parameters, count, scale) {
  return parameters
}
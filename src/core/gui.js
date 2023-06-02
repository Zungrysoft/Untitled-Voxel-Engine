let renderStack
let cache

function htmlify (what) {
  if (!Array.isArray(what)) {
    return what
  }

  const tagDef = typeof what[0] === 'string' ? what[0] : what[0].tag
  const [tag, ...modifiers] = tagDef.split(' ')

  const parser = document.createElement('div')
  parser.innerHTML = `<${tag} ${modifiers.join(' ')}></${tag}>`
  const parent = parser.firstElementChild
  if (typeof what[0] !== 'string') {
    for (const [key, value] of Object.entries(what[0])) {
      if (key === 'tag') { continue }
      parent[key] = value
    }
  }

  what.slice(1).map(htmlify).forEach(element => {
    if (element instanceof HTMLElement) {
      parent.appendChild(element)
    } else if (element !== undefined && element !== null) {
      parent.append(element)
    }
  })

  return parent
}

export function createComponent (func) {
  return (...args) => {
    if (!cache[renderStack]) {
      cache[renderStack] = {
        prevArgs: '',
        element: null
      }
    }
    const myCache = cache[renderStack]
    renderStack.push(1)
    const newArgs = JSON.stringify(args)
    if (newArgs !== myCache.prevArgs || !myCache.element) {
      myCache.prevArgs = newArgs
      myCache.element = htmlify(func(...args))
    }
    renderStack.pop()
    renderStack[renderStack.length - 1] += 1
    return myCache.element
  }
}

export class Renderer {
  renderStack = []
  cache = {}

  constructor (element) {
    this.element = element
  }

  render (component, ...args) {
    this.renderStack = [0]
    renderStack = this.renderStack
    cache = this.cache
    const result = component(...args)
    if (!result) {
      this.element.innerHTML = ''
    } else if (result.outerHTML !== this.element.innerHTML) {
      this.element.innerHTML = ''
      this.element.appendChild(result)
    }
    return result
  }

  clearCache () {
    this.renderStack = []
    this.cache = {}
  }

  clear () {
    this.element.innerHTML = ''
    this.clearCache()
  }
}

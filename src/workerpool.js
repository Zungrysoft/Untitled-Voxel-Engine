import Queue from './queue.js'

export default class WorkerPool {
  tasks = new Queue()
  callbackFunction = () => {}
  workers = []
  workerCount = 0
  workerActive = []
  idempotencyKeys = []
  idempotency = {}
  workerIdempotencies = []

  constructor (workerFile, workerCount, { idempotencyKeys=[] }, callbackFunction, assignmentCallbackFunction) {
    this.workerCount = workerCount
    this.callbackFunction = callbackFunction
    this.assignmentCallbackFunction = assignmentCallbackFunction
    this.idempotencyKeys = idempotencyKeys

    // Create workers
    for (let i = 0; i < workerCount; i ++) {
      const newWorker = new Worker(workerFile, { type: "module" })
      newWorker.onmessage = (message) => {this.#callback(message)}
      this.workers.push(newWorker)
      this.workerActive.push(false)
      this.workerIdempotencies.push({})
    }

    // Create idempotency sets
    for (const key of idempotencyKeys) {
      this.idempotency[key] = new Set()
    }
  }

  clearQueue() {
    // Clear idempotency
    this.idempotency = {}
    for (const key of this.idempotencyKeys) {
      this.idempotency[key] = new Set()
    }

    // Reset queue
    this.tasks = new Queue()
  }

  push(...messages) {
    for (const message of messages) {
      // Make sure this entry doesn't already exist in the queue
      if (this.#checkIdempotency(message)) {
        continue
      }
      this.#addIdempotency(message)
      this.tasks.push(message)
    }
    this.assign()
  }

  assign() {
    // Iterate over workers and assign tasks to any inactive ones
    for (let i = 0; i < this.workerCount; i ++) {
      // If there are no tasks left to assign, we're done
      if (this.tasks.isEmpty()) {
        break
      }

      // If this worker is inactive, assign it
      if (!this.workerActive[i]) {
        this.workerActive[i] = true

        // Get the next task
        let taskMessage = this.tasks.pop()

        // Add the workerIndex to the task so we can identify it later
        taskMessage.workerIndex = i

        // Transfer idempotency
        this.#transferIdempotencyToWorker(taskMessage, i)

        // Post the message to the worker
        this.workers[i].postMessage(taskMessage)

        // Run the assignment callback function
        if (this.assignmentCallbackFunction) {
          this.assignmentCallbackFunction(taskMessage)
        }
      }
    }
  }

  #checkIdempotency(message) {
    for (const key of this.idempotencyKeys) {
      if (this.idempotency[key].has(message[key].toString())) {
        return true
      }
      for (const workerIdempotency of this.workerIdempotencies) {
        if (workerIdempotency[key] === message[key].toString()) {
          return true
        }
      }
    }
    return false
  }

  #addIdempotency(message) {
    for (const key of this.idempotencyKeys) {
      this.idempotency[key].add(message[key].toString())
    }
  }

  #transferIdempotencyToWorker(message, workerIndex) {
    // Remove idempotency from the queue
    for (const key of this.idempotencyKeys) {
      this.idempotency[key].delete(message[key].toString())
    }
    // Add it to the worker
    for (const key of this.idempotencyKeys) {
      this.workerIdempotencies[workerIndex][key] = message[key].toString()
    }
  }

  #resetWorker(workerIndex) {
    this.workerIdempotencies[workerIndex] = {}
    this.workerActive[workerIndex] = false
  }

  #callback(message) {
    // Set this worker as inactive
    this.#resetWorker(message.data.workerIndex)

    // Perform the callback action
    this.callbackFunction(message.data)

    // Get this worker working again
    this.assign()
  }
}
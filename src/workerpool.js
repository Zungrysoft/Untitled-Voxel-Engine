import Queue from './queue.js'

export default class WorkerPool {
  callbackFunction = () => {}
  workers = []
  idempotencyKeys = []
  workerCount = 0
  workerActive = []
  tasks = new Queue()

  constructor (workerFile, workerCount, callbackFunction, idempotencyKeys=[]) {
    this.workerCount = workerCount
    this.callbackFunction = callbackFunction
    this.idempotencyKeys = idempotencyKeys

    // Create workers
    for (let i = 0; i < workerCount; i ++) {
      const newWorker = new Worker(workerFile, { type: "module" })
      newWorker.onmessage = (message) => {this.#callback(message)}
      this.workers.push(newWorker)
      this.workerActive.push(false)
    }
  }

  clearQueue() {
    this.tasks = new Queue()
  }

  push(...entries) {
    // TODO: Idempotency check
    for (const entry of entries) {
      this.tasks.push(entry)
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

        // Post the message to the worker
        this.workers[i].postMessage(taskMessage)
      }
    }
  }

  #callback(message) {
    // Set this worker as inactive
    const i = message.data.workerIndex
    this.workerActive[i] = false

    // Perform the callback action
    this.callbackFunction(message)

    // Get this worker working again
    this.assign()
  }
}
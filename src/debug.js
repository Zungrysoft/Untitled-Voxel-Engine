let printLimit = 10;
export function limitPrint(...p) {
  if (printLimit > 0) {
    printLimit --;
    console.log(...p)
  }
}

export function randomPrint(r, ...p) {
  if (Math.random() < r) {
    console.log(...p)
  }
}

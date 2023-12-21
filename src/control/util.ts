export function assert(condition: boolean, message = 'Assertion Failed'): asserts condition {
  if (!condition) {
    throw new Error('Internal Error: ' + message);
  }
}

export class UnreachableCaseError extends Error {
  constructor(val: never) {
    super(`No code branch was prepared to handle the unexpected value: ${String(val)}`);
  }
}

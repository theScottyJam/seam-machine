import { SeamBehaviorAlreadyInUseError, setSeamBehavior } from '#src/seams/index.js';
import { testModeSeamBehavior } from './testModeSeamBehavior.js';
import { assert } from './util.js';
export { SeamControl } from './testModeSeamBehavior.js';

let testModeType: null | 'unit' | 'integration' = null;

export function setTestMode(testModeType_: 'unit' | 'integration'): void {
  assert(testModeType_ === 'unit' || testModeType_ === 'integration', 'The testModeType parameter must be set to either "unit" or "integration".');
  if (testModeType !== null) {
    throw new Error('You can only call setTestMode() once.');
  }

  try {
    setSeamBehavior(testModeSeamBehavior);
  } catch (error: any) {
    if (error instanceof SeamBehaviorAlreadyInUseError) {
      throw new Error('Instances of Seam were constructed before setTestMode() got called, which is not permitted.');
    } else {
      throw error;
    }
  }

  testModeType = testModeType_;
}

export function getTestModeType() {
  return testModeType;
}

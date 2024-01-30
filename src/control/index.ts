import { DependencyBehaviorAlreadyInUseError, setDependencyBehavior } from '#src/seams/index.js';
import { testModeDependencyBehavior } from './testModeDependencyBehavior.js';
export { VerifiableResult, verifyResult, type ResultVerifier } from './VerifiableResult.js';
export { replaceDependencyWith, validateDependencyReplacement, permitUseOf, reset } from './testModeDependencyBehavior.js';

let inTestMode = false;

export function setTestMode(): void {
  if (inTestMode) {
    throw new Error('You can only call setTestMode() once.');
  }

  try {
    setDependencyBehavior(testModeDependencyBehavior);
  } catch (error: any) {
    if (error instanceof DependencyBehaviorAlreadyInUseError) {
      throw new Error('You must call setTestMode() before you start creating Dependency instances.');
    } else {
      throw error;
    }
  }

  inTestMode = true;
}

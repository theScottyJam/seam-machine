"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dependency = exports.setDependencyBehavior = exports.DependencyBehaviorAlreadyInUseError = void 0;
let dependencyBehavior = {
    define: (self, fnName, realImplementation) => {
        return realImplementation;
    },
    defineSync: (self, fnName, realImplementation) => realImplementation,
};
/** Thrown when you attempt to change the behavior of Dependency after instances of it have already been made. */
class DependencyBehaviorAlreadyInUseError extends Error {
}
exports.DependencyBehaviorAlreadyInUseError = DependencyBehaviorAlreadyInUseError;
let hasDependencyInstancesBeenCreated = false;
/**
 * Changes the behavior of the Dependency class.
 * If instances of Dependency have already been created, DependencyBehaviorAlreadyInUseError will be thrown.
 */
function setDependencyBehavior(behavior) {
    if (hasDependencyInstancesBeenCreated) {
        throw new DependencyBehaviorAlreadyInUseError('Can not change the behavior of the Dependency class after it has been used.');
    }
    dependencyBehavior = behavior;
}
exports.setDependencyBehavior = setDependencyBehavior;
class Dependency {
    constructor() {
        hasDependencyInstancesBeenCreated = true;
    }
    define(fnName, realImplementation) {
        return dependencyBehavior.define(this, fnName, realImplementation);
    }
    defineSync(fnName, realImplementation) {
        return dependencyBehavior.defineSync(this, fnName, realImplementation);
    }
}
exports.Dependency = Dependency;

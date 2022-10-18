import { ChildDeletion, Fiber, FiberRoot, ForwardRef, FunctionComponent, NoFlags, Passive, PassiveMask, ProfileMode, Profiler, SimpleMemoComponent } from "../type";
import { cEffect } from "./scheduler";

import { ensureCorrectReturnPointer } from "./commitRoot";
import { enableProfilerCommitHooks, enableProfilerTimer, FunctionComponentUpdateQueue, HookFlags } from "../type/constant";
import { now } from "../reactDom/tools";
import { Time } from "./time";
import {   NoFlags as NoHookEffect,
  HasEffect as HookHasEffect,
  Layout as HookLayout,
  Passive as HookPassive, } from "../type/constant";
export function commitPassiveUnmountEffects(firstChild: Fiber|null): void {
  cEffect.nextEffect = firstChild;
  commitPassiveUnmountEffects_begin();
}


function commitPassiveUnmountEffects_begin() {
  
  while (cEffect.nextEffect !== null) {
    const fiber = cEffect.nextEffect;
    const child = fiber.child;
    // 
    if ((cEffect.nextEffect.flags & ChildDeletion) !== NoFlags) {
      const deletions = fiber.deletions;
      if (deletions !== null) {
        for (let i = 0; i < deletions.length; i++) {
          const fiberToDelete = deletions[i];
          cEffect.nextEffect = fiberToDelete;
          // commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
          //   fiberToDelete,
          //   fiber,
          // );

          // Now that passive effects have been processed, it's safe to detach lingering pointers.
          const alternate = fiberToDelete.alternate;
          // detachFiberAfterEffects(fiberToDelete);
          if (alternate !== null) {
            // detachFiberAfterEffects(alternate);
          }
        }
        cEffect.nextEffect = fiber;
      }
    }

    if ((fiber.subtreeFlags & PassiveMask) !== NoFlags && child !== null) {
      ensureCorrectReturnPointer(child, fiber);
      cEffect.nextEffect = child;
    } else {
      commitPassiveUnmountEffects_complete();
    }
  }
}

function commitPassiveUnmountEffects_complete() {
  while (cEffect.nextEffect !== null) {
    const fiber = cEffect.nextEffect;
    if ((fiber.flags & Passive) !== NoFlags) {
      // setCurrentDebugFiberInDEV(fiber);
      commitPassiveUnmountOnFiber(fiber);
      // resetCurrentDebugFiberInDEV();
    }

    const sibling = fiber.sibling;
    if (sibling !== null) {
      ensureCorrectReturnPointer(sibling, fiber.return);
      cEffect.nextEffect = sibling;
      return;
    }

    cEffect.nextEffect = fiber.return;
  }
}


function commitPassiveUnmountOnFiber(finishedWork: Fiber): void {
  

  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent: {
      if (
        enableProfilerTimer &&
        enableProfilerCommitHooks &&
        finishedWork.mode & ProfileMode
      ) {
        startPassiveEffectTimer();
        commitHookEffectListUnmount(
          HookPassive | HookHasEffect,
          finishedWork,
          finishedWork.return,
        );
        recordPassiveEffectDuration(finishedWork);
      } else {
        commitHookEffectListUnmount(
          HookPassive | HookHasEffect,
          finishedWork,
          finishedWork.return,
        );
      }
      break;
    }
  }
}

function startPassiveEffectTimer(): void {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return;
  }
  Time.passiveEffectStartTime = now();
}

function commitHookEffectListUnmount(
  flags: HookFlags,
  finishedWork: Fiber,
  nearestMountedAncestor: Fiber | null,
) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue as any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if(effect === null) {
        break;
      }
      if ((effect.tag & flags) === flags) {
        // Unmount
        const destroy = effect.destroy;
        effect.destroy = undefined;
        if (destroy !== undefined) {
          safelyCallDestroy(finishedWork, nearestMountedAncestor, destroy);
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

function safelyCallDestroy(
  current: Fiber,
  nearestMountedAncestor: Fiber | null,
  destroy: () => void,
) {

    try {
      destroy();
    } catch (error) {

      // captureCommitPhaseError(current, nearestMountedAncestor, error);
    }
  
}

function recordPassiveEffectDuration(fiber: Fiber): void {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return;
  }

  if (Time.passiveEffectStartTime >= 0) {
    const elapsedTime = now() - Time.passiveEffectStartTime;

    Time.passiveEffectStartTime = -1;

    // Store duration on the next nearest Profiler ancestor.
    let parentFiber = fiber.return;
    while (parentFiber !== null) {
      if (parentFiber.tag === Profiler) {
        const parentStateNode = parentFiber.stateNode;
        if (parentStateNode !== null) {
          // Detached fibers have their state node cleared out.
          // In this case, the return pointer is also cleared out,
          // so we won't be able to report the time spent in this Profiler's subtree.
          parentStateNode.passiveEffectDuration += elapsedTime;
        }
        break;
      }
      parentFiber = parentFiber.return;
    }
  }
}





export function commitPassiveMountEffects(
  root: FiberRoot,
  finishedWork: Fiber|null,
): void {
  cEffect.nextEffect = finishedWork;
  commitPassiveMountEffects_begin(finishedWork, root);
}

function commitPassiveMountEffects_begin(subtreeRoot: Fiber|null, root: FiberRoot) {
  while (cEffect.nextEffect !== null) {
    const fiber = cEffect.nextEffect;
    const firstChild = fiber.child;
    if ((fiber.subtreeFlags & PassiveMask) !== NoFlags && firstChild !== null) {
      ensureCorrectReturnPointer(firstChild, fiber);
      cEffect.nextEffect = firstChild;
    } else {
      commitPassiveMountEffects_complete(subtreeRoot, root);
    }
  }
}

function commitPassiveMountEffects_complete(
  subtreeRoot: Fiber|null,
  root: FiberRoot,
) {
  while (cEffect.nextEffect !== null) {
    const fiber = cEffect.nextEffect;
    if ((fiber.flags & Passive) !== NoFlags) {
      // if (__DEV__) {
      //   setCurrentDebugFiberInDEV(fiber);
      //   invokeGuardedCallback(
      //     null,
      //     commitPassiveMountOnFiber,
      //     null,
      //     root,
      //     fiber,
      //   );
      //   if (hasCaughtError()) {
      //     const error = clearCaughtError();
      //     captureCommitPhaseError(fiber, fiber.return, error);
      //   }
      //   resetCurrentDebugFiberInDEV();
      // } else {
        try {
          commitPassiveMountOnFiber(root, fiber);
        } catch (error) {
          // captureCommitPhaseError(fiber, fiber.return, error);
        }
      // }
    }

    if (fiber === subtreeRoot) {
      cEffect.nextEffect = null;
      return;
    }

    const sibling = fiber.sibling;
    if (sibling !== null) {
      ensureCorrectReturnPointer(sibling, fiber.return);
      cEffect.nextEffect = sibling;
      return;
    }

    cEffect.nextEffect = fiber.return;
  }
}

function commitPassiveMountOnFiber(
  finishedRoot: FiberRoot,
  finishedWork: Fiber,
): void {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent: {
      if (
        enableProfilerTimer &&
        enableProfilerCommitHooks &&
        finishedWork.mode & ProfileMode
      ) {
        startPassiveEffectTimer();
        try {
          commitHookEffectListMount(HookPassive | HookHasEffect, finishedWork);
        } finally {
          recordPassiveEffectDuration(finishedWork);
        }
      } else {
        commitHookEffectListMount(HookPassive | HookHasEffect, finishedWork);
      }
      break;
    }
  }
}
// 两处调用，注意区分
export function commitHookEffectListMount(tag: number, finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue as any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if(!effect) {
        break;
      }
      if ((effect.tag & tag) === tag) {
        // Mount
        const create = effect.create;
        effect.destroy = create();

      
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
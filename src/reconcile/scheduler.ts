

import { now } from "../reactDom/tools";
import { NoTimestamp } from "../reactDom/workInprogress";
import scheduler from "../scheduler";
import { ExecutionContext, Fiber, FiberRoot, Lane, Lanes, mixed, ReactPriorityLevel, SchedulerCallback, SchedulerCallbackOptions, StackCursor } from "../type";
import { decoupleUpdatePriorityFromScheduler } from "../type/constant";

import { runWithPriority } from "./commitRoot";
import { createCursor } from "./fiberStack";
export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
export const NoContext = /*             */ 0b0000000;
const {
  unstable_scheduleCallback: Scheduler_scheduleCallback,
  unstable_cancelCallback: Scheduler_cancelCallback,
  unstable_ImmediatePriority: Scheduler_ImmediatePriority,
  unstable_UserBlockingPriority: Scheduler_UserBlockingPriority,
  unstable_NormalPriority: Scheduler_NormalPriority,
  unstable_LowPriority: Scheduler_LowPriority,
  unstable_IdlePriority: Scheduler_IdlePriority,

} = scheduler;

export const ImmediatePriority: ReactPriorityLevel = 99;
export const UserBlockingPriority: ReactPriorityLevel = 98;
export const NormalPriority: ReactPriorityLevel = 97;
export const LowPriority: ReactPriorityLevel = 96;
export const IdlePriority: ReactPriorityLevel = 95;
// NoPriority is the absence of priority. Also React-only.
export const NoPriority: ReactPriorityLevel = 90;

interface effectConstant {
  rootWithPendingPassiveEffects : FiberRoot | null;
  rootDoesHavePassiveEffects: boolean;
  pendingPassiveEffectsLanes: Lanes;
  pendingPassiveEffectsRenderPriority: ReactPriorityLevel
}
export const cEffect: effectConstant = {
  rootWithPendingPassiveEffects: null,
  rootDoesHavePassiveEffects: false,
  pendingPassiveEffectsLanes: NoLanes,
  pendingPassiveEffectsRenderPriority: NoPriority
}



const NoSchedulerPriority = NoPriority
const NormalSchedulerPriority = NormalPriority

type RootExitStatus = 0 | 1 | 2 | 3 | 4 | 5;
const RootIncomplete = 0;
const RootFatalErrored = 1;
const RootErrored = 2;
const RootSuspended = 3;
const RootSuspendedWithDelay = 4;
const RootCompleted = 5;

// Describes where we are in the React execution stack

// The root we're working on
let workInProgressRoot: FiberRoot | null = null;
// The fiber we're working on
let workInProgress: Fiber | null = null;
// The lanes we're rendering
let workInProgressRootRenderLanes: Lanes = NoLanes;

// Stack that allows components to change the render lanes for its subtree
// This is a superset of the lanes we started working on at the root. The only
// case where it's different from `workInProgressRootRenderLanes` is when we
// enter a subtree that is hidden and needs to be unhidden: Suspense and
// Offscreen component.
//
// Most things in the work loop should deal with workInProgressRootRenderLanes.
// Most things in begin/complete phases should deal with subtreeRenderLanes.
export let subtreeRenderLanes: Lanes = NoLanes;
const subtreeRenderLanesCursor: StackCursor<Lanes> = createCursor(NoLanes);

// Whether to root completed, errored, suspended, etc.
let workInProgressRootExitStatus: RootExitStatus = RootIncomplete;
// A fatal error, if one is thrown
let workInProgressRootFatalError: mixed = null;
// "Included" lanes refer to lanes that were worked on during this render. It's
// slightly different than `renderLanes` because `renderLanes` can change as you
// enter and exit an Offscreen tree. This value is the combination of all render
// lanes for the entire render phase.
let workInProgressRootIncludedLanes: Lanes = NoLanes;
// The work left over by components that were visited during this render. Only
// includes unprocessed updates, not work in bailed out children.
let workInProgressRootSkippedLanes: Lanes = NoLanes;
// Lanes that were updated (in an interleaved event) during this render.
let workInProgressRootUpdatedLanes: Lanes = NoLanes;
// Lanes that were pinged (in an interleaved event) during this render.
let workInProgressRootPingedLanes: Lanes = NoLanes;

// The most recent time we committed a fallback. This lets us ensure a train
// model where we don't commit new loading states in too quick succession.
let globalMostRecentFallbackTime: number = 0;
const FALLBACK_THROTTLE_MS: number = 500;

// The absolute time for when we should start giving up on rendering
// more and prefer CPU suspense heuristics instead.
let workInProgressRootRenderTargetTime: number = Infinity;
// How long a render is supposed to take before we start following CPU
// suspense heuristics and opt out of rendering more content.
const RENDER_TIMEOUT_MS = 500;

function resetRenderTimer() {
  workInProgressRootRenderTargetTime = now() + RENDER_TIMEOUT_MS;
}

export function getRenderTargetTime(): number {
  return workInProgressRootRenderTargetTime;
}

let hasUncaughtError = false;
let firstUncaughtError = null;
let legacyErrorBoundariesThatAlreadyFailed: Set<mixed> | null = null;

// Only used when enableProfilerNestedUpdateScheduledHook is true;
// to track which root is currently committing layout effects.
let rootCommittingMutationOrLayoutEffects: FiberRoot | null = null;


let pendingPassiveEffectsRenderPriority: ReactPriorityLevel = NoPriority;
// let pendingPassiveEffectsLanes: Lanes = NoLanes;
let pendingPassiveProfilerEffects: Array<Fiber> = [];

let rootsWithPendingDiscreteUpdates: Set<FiberRoot> | null = null;

// Use these to prevent an infinite loop of nested updates
const NESTED_UPDATE_LIMIT = 50;
let nestedUpdateCount: number = 0;
let rootWithNestedUpdates: FiberRoot | null = null;

const NESTED_PASSIVE_UPDATE_LIMIT = 50;
let nestedPassiveUpdateCount: number = 0;

// Marks the need to reschedule pending interactions at these lanes
// during the commit phase. This enables them to be traced across components
// that spawn new work during render. E.g. hidden boundaries, suspended SSR
// hydration or SuspenseList.
// TODO: Can use a bitmask instead of an array
let spawnedWorkDuringRender: null | Array<Lane | Lanes> = null;

// If two updates are scheduled within the same event, we should treat their
// event times as simultaneous, even if the actual clock time has advanced
// between the first and second call.
let currentEventTime: number = NoTimestamp;
let currentEventWipLanes: Lanes = NoLanes;
let currentEventTransitionLane: Lanes = NoLanes;

// Dev only flag that tracks if passive effects are currently being flushed.
// We warn about state updates for unmounted components differently in this case.
let isFlushingPassiveEffects = false;




export function flushPassiveEffects(): boolean {
  // debugger
  console.log('flushPassiveEffects')
  // Returns whether passive effects were flushed.
  if (pendingPassiveEffectsRenderPriority !== NoSchedulerPriority) {
    const priorityLevel =
      pendingPassiveEffectsRenderPriority > NormalSchedulerPriority
        ? NormalSchedulerPriority
        : pendingPassiveEffectsRenderPriority;
    pendingPassiveEffectsRenderPriority = NoSchedulerPriority;
    if (decoupleUpdatePriorityFromScheduler) {
      // const previousLanePriority = getCurrentUpdateLanePriority();
      // try {
      //   setCurrentUpdateLanePriority(
      //     schedulerPriorityToLanePriority(priorityLevel),
      //   );
      //   return runWithPriority(priorityLevel, flushPassiveEffectsImpl);
      // } finally {
      //   setCurrentUpdateLanePriority(previousLanePriority);
      // }
      console.log('flushPassiveEffects if逻辑 未实现')
    } else {
      return runWithPriority(priorityLevel, flushPassiveEffectsImpl);
    }
  }
  console.log('flushPassiveEffects', 'false')
  return false;
}

function flushPassiveEffectsImpl(): boolean {
  // 这个变量是在renderRootSync中被赋值的
  if (cEffect.rootWithPendingPassiveEffects === null) { 
    return false;
  }

  return false;
}

function reactPriorityToSchedulerPriority(reactPriorityLevel: ReactPriorityLevel) {
  switch (reactPriorityLevel) {
    case ImmediatePriority:
      return Scheduler_ImmediatePriority;
    case UserBlockingPriority:
      return Scheduler_UserBlockingPriority;
    case NormalPriority:
      return Scheduler_NormalPriority;
    case LowPriority:
      return Scheduler_LowPriority;
    case IdlePriority:
      return Scheduler_IdlePriority;
    default:
      console.log('reactPriority 转schedulerPriority失败')
  }
}

export function scheduleCallback(
  reactPriorityLevel: ReactPriorityLevel,
  callback: SchedulerCallback,
  options: SchedulerCallbackOptions | void | null,
) {
  const priorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel);
  return Scheduler_scheduleCallback(priorityLevel, callback, options);
}

export function cancelCallback(callbackNode: mixed) {
  Scheduler_cancelCallback(callbackNode);
}
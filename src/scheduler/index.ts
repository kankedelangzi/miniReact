/* eslint-disable import/no-anonymous-default-export */
import { NormalPriority, ImmediatePriority, UserBlockingPriority,LowPriority, IdlePriority} from './propity'
var currentPriorityLevel = NormalPriority;

export const enableSchedulerDebugging = false;
const enableProfiling = false;//
var maxSigned31BitInt = 1073741823;

// Times out immediately
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
var NORMAL_PRIORITY_TIMEOUT = 5000;
var LOW_PRIORITY_TIMEOUT = 10000;
// Never times out
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;


var taskIdCounter = 1;

export const enableIsInputPending = false;
let deadline = 0;
let needsPaint = false;
const maxYieldInterval = 300;
let getCurrentTime: () => number;
const hasPerformanceNow =
  typeof performance === 'object' && typeof performance.now === 'function';

if (hasPerformanceNow) {
  const localPerformance = performance;
  getCurrentTime = () => localPerformance.now();
} else {
  const localDate = Date;
  const initialTime = localDate.now();
  getCurrentTime = () => localDate.now() - initialTime;
}

function requestPaint() {
  if (
    enableIsInputPending &&
    navigator !== undefined 
  ) {
    needsPaint = true;
  }

  // Since we yield every frame regardless, `requestPaint` has no effect.
}


function unstable_getCurrentPriorityLevel() {
  return currentPriorityLevel;
}
function unstable_runWithPriority(priorityLevel: any, eventHandler: any) {
  switch (priorityLevel) {
    case ImmediatePriority:
    case UserBlockingPriority:
    case NormalPriority:
    case LowPriority:
    case IdlePriority:
      break;
    default:
      priorityLevel = NormalPriority;
  }

  var previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;

  try {
    return eventHandler();
  } finally {
    currentPriorityLevel = previousPriorityLevel;
  }
}
function shouldYieldToHost() {
  if (
    enableIsInputPending &&
    navigator !== undefined 
  
  ) {
    // 浏览器环境
    const scheduling = { isInputPending: () => false}  // 
    const currentTime = getCurrentTime();
    if (currentTime >= deadline) {
      // There's no time left. We may want to yield control of the main
      // thread, so the browser can perform high priority tasks. The main ones
      // are painting and user input. If there's a pending paint or a pending
      // input, then we should yield. But if there's neither, then we can
      // yield less often while remaining responsive. We'll eventually yield
      // regardless, since there could be a pending paint that wasn't
      // accompanied by a call to `requestPaint`, or other main thread tasks
      // like network events.
      if (needsPaint || scheduling.isInputPending()) {
        // There is either a pending paint or a pending input.
        return true;
      }
      // There's no pending input. Only yield if we've reached the max
      // yield interval.
      return currentTime >= maxYieldInterval;
    } else {
      // There's still time left in the frame.
      return false;
    }
  } else {
    // `isInputPending` is not available. Since we have no way of knowing if
    // there's pending input, always yield at the end of the frame.
    return getCurrentTime() >= deadline;
  }
}
function unstable_scheduleCallback(priorityLevel: any, callback: any, options: any) {
  var currentTime = getCurrentTime();

  var startTime;
  if (typeof options === 'object' && options !== null) {
    var delay = options.delay;
    if (typeof delay === 'number' && delay > 0) {
      startTime = currentTime + delay;
    } else {
      startTime = currentTime;
    }
  } else {
    startTime = currentTime;
  }

  var timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT;
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
      break;
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT;
      break;
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT;
      break;
    case NormalPriority:
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT;
      break;
  }
  var expirationTime = startTime + timeout;

  var newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
    isQueued: true,
  };
  if (enableProfiling) {
    newTask.isQueued = false;
  }

  if (startTime > currentTime) {
  //   // This is a delayed task.
  //   newTask.sortIndex = startTime;
  //   push(timerQueue, newTask);
  //   if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
  //     // All tasks are delayed, and this is the task with the earliest delay.
  //     if (isHostTimeoutScheduled) {
  //       // Cancel an existing timeout.
  //       cancelHostTimeout();
  //     } else {
  //       isHostTimeoutScheduled = true;
  //     }
  //     // Schedule a timeout.
  //     requestHostTimeout(handleTimeout, startTime - currentTime);
  //   }
  // } else {
  //   newTask.sortIndex = expirationTime;
  //   push(taskQueue, newTask);
  //   if (enableProfiling) {
  //     markTaskStart(newTask, currentTime);
  //     newTask.isQueued = true;
  //   }
  //   // Schedule a host callback, if needed. If we're already performing work,
  //   // wait until the next time we yield.
  //   if (!isHostCallbackScheduled && !isPerformingWork) {
  //     isHostCallbackScheduled = true;
  //     requestHostCallback(flushWork);
  //   }
  }

  return newTask;

}
export default {
  unstable_ImmediatePriority: ImmediatePriority,
  unstable_runWithPriority: unstable_runWithPriority,
  unstable_scheduleCallback: unstable_scheduleCallback,
  unstable_cancelCallback: null,
  unstable_shouldYield: shouldYieldToHost,
  unstable_requestPaint: null,
  unstable_now: null,
  unstable_getCurrentPriorityLevel: unstable_getCurrentPriorityLevel,
  unstable_UserBlockingPriority: UserBlockingPriority,
  unstable_NormalPriority: NormalPriority,
  unstable_LowPriority: LowPriority,
  unstable_IdlePriority: IdlePriority,
}
/* eslint-disable import/no-anonymous-default-export */
import { enableSchedulerTracing } from '../type/constant';
import { push,peek, Node,pop } from './heap';
import { NormalPriority, ImmediatePriority, UserBlockingPriority,LowPriority, IdlePriority, PriorityLevel} from './propity'
var currentPriorityLevel = NormalPriority;

export const enableSchedulerDebugging = false;
const enableProfiling = false;//
var maxSigned31BitInt = 1073741823;

var taskQueue: Task[]= [];
var timerQueue: Task[] = [];

var currentTask: Task|null = null;

var isHostCallbackScheduled = false;
var isPerformingWork = false;
let scheduledHostCallback: any = null;
let isMessageLoopRunning = false;
var isHostCallbackScheduled = false;
var isHostTimeoutScheduled = false;
let taskTimeoutID:NodeJS.Timeout|null = null;

var isSchedulerPaused = false;


const performWorkUntilDeadline = () => {
  console.log('执行performWorkUntilDeadline')
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime();
    // Yield after `yieldInterval` ms, regardless of where we are in the vsync
    // cycle. This means there's always time remaining at the beginning of
    // the message event.
    deadline = currentTime + yieldInterval;
    console.log('给deadline赋值',deadline)
    const hasTimeRemaining = true;

    // If a scheduler task throws, exit the current browser task so the
    // error can be observed.
    //
    // Intentionally not using a try-catch, since that makes some debugging
    // techniques harder. Instead, if `scheduledHostCallback` errors, then
    // `hasMoreWork` will remain true, and we'll continue the work loop.
    let hasMoreWork = true;
    try {
      hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
    } finally {
      if (hasMoreWork) {
        // If there's more work, schedule the next message event at the end
        // of the preceding one.
        schedulePerformWorkUntilDeadline();
      } else {
        isMessageLoopRunning = false;
        scheduledHostCallback = null;
      }
    }
  } else {
    isMessageLoopRunning = false;
  }
  // Yielding to the browser will give it a chance to paint, so we can
  // reset this.
  needsPaint = false;
};
let schedulePerformWorkUntilDeadline: () => void;
if (typeof setImmediate === 'function') {
  // Node.js and old IE.
  // There's a few reasons for why we prefer setImmediate.
  //
  // Unlike MessageChannel, it doesn't prevent a Node.js process from exiting.
  // (Even though this is a DOM fork of the Scheduler, you could get here
  // with a mix of Node.js 15+, which has a MessageChannel, and jsdom.)
  // https://github.com/facebook/react/issues/20756
  //
  // But also, it runs earlier which is the semantic we want.
  // If other browsers ever implement it, it's better to use it.
  // Although both of these would be inferior to native scheduling.
  schedulePerformWorkUntilDeadline = () => {
    console.log('setImmediate')
    setImmediate(performWorkUntilDeadline);
  };
} else {
  const channel = new MessageChannel();
  const port = channel.port2;
  channel.port1.onmessage = performWorkUntilDeadline;
  schedulePerformWorkUntilDeadline = () => {
    console.log('post message')
    port.postMessage(null);
  };
}
// 这个5就是5ms的意思，也就是每个任务执行时时间是5ms 这就是在16.7这一帧时间内用来执行调度的时间
let yieldInterval = 5;




export interface Task extends Node {
  id: number,
  callback: any,
  priorityLevel: PriorityLevel,
  startTime: number,
  expirationTime: number,
  sortIndex: number,
  isQueued: boolean
};
export type Interaction = {
  __count: number,
  id: number,
  name: string,
  timestamp: number,
};
export type Subscriber = {
  // A new interaction has been created via the trace() method.
  onInteractionTraced: (interaction: Interaction) => void,

  // All scheduled async work for an interaction has finished.
  onInteractionScheduledWorkCompleted: (interaction: Interaction) => void,

  // New async work has been scheduled for a set of interactions.
  // When this work is later run, onWorkStarted/onWorkStopped will be called.
  // A batch of async/yieldy work may be scheduled multiple times before completing.
  // In that case, onWorkScheduled may be called more than once before onWorkStopped.
  // Work is scheduled by a "thread" which is identified by a unique ID.
  onWorkScheduled: (interactions: Set<Interaction>, threadID: number) => void,

  // A batch of scheduled work has been canceled.
  // Work is done by a "thread" which is identified by a unique ID.
  onWorkCanceled: (interactions: Set<Interaction>, threadID: number) => void,

  // A batch of work has started for a set of interactions.
  // When this work is complete, onWorkStopped will be called.
  // Work is not always completed synchronously; yielding may occur in between.
  // A batch of async/yieldy work may also be re-started before completing.
  // In that case, onWorkStarted may be called more than once before onWorkStopped.
  // Work is done by a "thread" which is identified by a unique ID.
  onWorkStarted: (interactions: Set<Interaction>, threadID: number) => void,

  // A batch of work has completed for a set of interactions.
  // Work is done by a "thread" which is identified by a unique ID.
  onWorkStopped: (interactions: Set<Interaction>, threadID: number) => void,
};

// Times out immediately
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
var NORMAL_PRIORITY_TIMEOUT = 5000;
var LOW_PRIORITY_TIMEOUT = 10000;
// Never times out
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;

export type InteractionsRef = {current: Set<Interaction>};

export type SubscriberRef = {current: Subscriber | null};

var taskIdCounter = 1;

let interactionsRef: InteractionsRef = (null as any);

// Listener(s) to notify when interactions begin and end.
let subscriberRef: SubscriberRef = (null as any);

if (enableSchedulerTracing) {
  interactionsRef = {
    current: new Set(),
  };
  subscriberRef = {
    current: null,
  };
}
export {interactionsRef as __interactionsRef, subscriberRef as __subscriberRef};
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
function unstable_scheduleCallback(priorityLevel: any, callback: any, options?: any) {
  var currentTime = getCurrentTime();
  console.info('unstable_scheduleCallback')
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
  console.log('unstable_scheduleCallback', priorityLevel)
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
  /**
   * 
   * 每当生成了一个这样的任务，它就会被挂载到root节点的callbackNode属性上，以表示当前已经有任务被调度了，
   * 同时会将任务优先级存储到root的callbackPriority上，
   * 表示如果有新的任务进来，必须用它的任务优先级和已有任务的优先级
   * （root.callbackPriority）比较，来决定是否有必要取消已经有的任务。
   */
  var newTask: Task = {
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
  } else {
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);
    if (enableProfiling) {
      // markTaskStart(newTask, currentTime);
      newTask.isQueued = true;
    }
    // Schedule a host callback, if needed. If we're already performing work,
    // wait until the next time we yield.
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    }
  }

  return newTask;

}
function requestHostCallback(callback: any) {
  scheduledHostCallback = callback;
  console.log('requestHostCallback')
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
  }
}

function cancelHostTimeout() {
  if(taskTimeoutID) 
  clearTimeout(taskTimeoutID);
  taskTimeoutID = null;
}

function flushWork(hasTimeRemaining: boolean, initialTime: number) {
  if (enableProfiling) {
    // markSchedulerUnsuspended(initialTime);
  }

  // We'll need a host callback the next time work is scheduled.
  isHostCallbackScheduled = false;
  if (isHostTimeoutScheduled) {
    // We scheduled a timeout but it's no longer needed. Cancel it.
    isHostTimeoutScheduled = false;
    cancelHostTimeout();
  }

  isPerformingWork = true;
  const previousPriorityLevel = currentPriorityLevel;
  try {
    if (enableProfiling) {
      try {
        return workLoop(hasTimeRemaining, initialTime);
      } catch (error) {
        if (currentTask !== null) {
          const currentTime = getCurrentTime();
          // markTaskErrored(currentTask, currentTime);
          currentTask.isQueued = false;
        }
        throw error;
      }
    } else {
      // No catch in prod code path.
      return workLoop(hasTimeRemaining, initialTime);
    }
  } finally {
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
    if (enableProfiling) {
      const currentTime = getCurrentTime();
      // markSchedulerSuspended(currentTime);
    }
  }
}

function advanceTimers(currentTime: number) {
  // Check for tasks that are no longer delayed and add them to the queue.
  let timer: Task|null = peek(timerQueue) as Task;
  while (timer !== null) {
    if (timer.callback === null) {
      // Timer was cancelled.
      pop(timerQueue);
    } else if (timer.startTime <= currentTime) {
      // Timer fired. Transfer to the task queue.
      pop(timerQueue);
      timer.sortIndex = timer.expirationTime;
      push(taskQueue, timer);
      if (enableProfiling) {
        // markTaskStart(timer, currentTime);
        timer.isQueued = true;
      }
    } else {
      // Remaining timers are pending.
      return;
    }
    timer = peek(timerQueue) as Task|null;
  }
}

function workLoop(hasTimeRemaining: boolean, initialTime: number) {
  let currentTime = initialTime;
  advanceTimers(currentTime);
  currentTask = peek(taskQueue) as Task|null;
  try {
    console.log('workLoop' )
    console.log(JSON.stringify(currentTask))
    console.log(taskQueue.length)
  } catch (error) {

  }

  while (
    currentTask !== null &&
    !(enableSchedulerDebugging && isSchedulerPaused)
  ) {
    if (
      currentTask.expirationTime > currentTime &&
      (!hasTimeRemaining || shouldYieldToHost())
    ) {
      // This currentTask hasn't expired, and we've reached the deadline.
      break;
    }
    const callback = currentTask.callback;
    if (typeof callback === 'function') {
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      if (enableProfiling) {
        // markTaskRun(currentTask, currentTime);
      }
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime();
      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback;
        if (enableProfiling) {
          // markTaskYield(currentTask, currentTime);
        }
      } else {
        if (enableProfiling) {
          // markTaskCompleted(currentTask, currentTime);
          currentTask.isQueued = false;
        }
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
      }
      advanceTimers(currentTime);
    } else {
      pop(taskQueue);
    }
    currentTask = peek(taskQueue) as Task|null;
  }
  // Return whether there's additional work
  if (currentTask !== null) {
    return true;
  } else {
    const firstTimer = peek(timerQueue) as Task;
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    return false;
  }
}

function handleTimeout(currentTime: number) {
  isHostTimeoutScheduled = false;
  advanceTimers(currentTime);

  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    } else {
      const firstTimer = peek(timerQueue) as Task;
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}

function requestHostTimeout(callback: any, ms: number) {
  taskTimeoutID = setTimeout(() => {
    callback(getCurrentTime());
  }, ms);
}



export function markTaskCanceled(
  task: Task,
  ms: number,
) {
  console.log('markTaskCanceled')
  if (enableProfiling) {
    // if (eventLog !== null) {
    //   // logEvent([TaskCancelEvent, ms * 1000, task.id]);
    // }
  }
}

function unstable_cancelCallback(task: Task) {
  console.log('unstable_cancelCallback', enableProfiling)
  if (enableProfiling) {
    if (task.isQueued) {
      const currentTime = getCurrentTime();
      markTaskCanceled(task, currentTime);
      task.isQueued = false;
    }
  }

  // Null out the callback to indicate the task has been canceled. (Can't
  // remove from the queue because you can't remove arbitrary nodes from an
  // array based heap, only the first one.)
  task.callback = null;
}

let threadIDCounter: number = 0;
export function unstable_getThreadID(): number {
  return ++threadIDCounter;
}
export default {
  unstable_ImmediatePriority: ImmediatePriority,
  unstable_runWithPriority: unstable_runWithPriority,
  unstable_scheduleCallback: unstable_scheduleCallback,
  unstable_cancelCallback,
  unstable_shouldYield: shouldYieldToHost,
  unstable_requestPaint: null,
  unstable_now: getCurrentTime,
  unstable_getCurrentPriorityLevel: unstable_getCurrentPriorityLevel,
  unstable_UserBlockingPriority: UserBlockingPriority,
  unstable_NormalPriority: NormalPriority,
  unstable_LowPriority: LowPriority,
  unstable_IdlePriority: IdlePriority,
}
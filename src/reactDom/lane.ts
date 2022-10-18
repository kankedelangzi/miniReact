import { Fiber, Lane, Lanes,FiberRoot,BlockingMode, NoMode,
  LanePriority,
   ConcurrentMode, LaneMap, SharedQueue, mixed, SchedulerCallback, ReactPriorityLevel } from '../type/index'
import { getCurrentPriorityLevel, ImmediatePriority as ImmediateSchedulerPriority, 
  UserBlockingPriority as UserBlockingSchedulerPriority,
  NoPriority as NoSchedulerPriority,
  IdlePriority as IdleSchedulerPriority,
  NormalPriority as NormalSchedulerPriority} from './tools'
import { Cxt, NoContext, RenderContext} from "./context";
import { NoTimestamp, WorkIn } from './workInprogress';
import { cancelCallback, scheduleMicrotask, scheduleSyncCallback } from "./scheduler";
import scheduler from '../scheduler';
import { performConcurrentWorkOnRoot, performSyncWorkOnRoot } from '../reconcile/commit';
import { scheduleCallback } from '../reconcile/scheduler';

const {
  unstable_scheduleCallback: Scheduler_scheduleCallback,
  unstable_cancelCallback: Scheduler_cancelCallback,


} = scheduler;


export const SyncLanePriority: LanePriority = 15;
export const SyncBatchedLanePriority: LanePriority = 14;

const InputDiscreteHydrationLanePriority: LanePriority = 13;
export const InputDiscreteLanePriority: LanePriority = 12;

const InputContinuousHydrationLanePriority: LanePriority = 11;
export const InputContinuousLanePriority: LanePriority = 10;

const DefaultHydrationLanePriority: LanePriority = 9;
export const DefaultLanePriority: LanePriority = 8;

const TransitionHydrationPriority: LanePriority = 7;
export const TransitionPriority: LanePriority = 6;

const RetryLanePriority: LanePriority = 5;

const SelectiveHydrationLanePriority: LanePriority = 4;

const IdleHydrationLanePriority: LanePriority = 3;
export const IdleLanePriority: LanePriority = 2;

const OffscreenLanePriority: LanePriority = 1;

export const NoLanePriority: LanePriority = 0;

export const TotalLanes = 31;

export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;
// 除了下边两个之外其他30个位全部是concurrent的优先级
// 同步优先级
export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000001;
// 同步批量优先级
export const SyncBatchedLane: Lane = /*                 */ 0b0000000000000000000000000000010;

export const InputDiscreteHydrationLane: Lane = /*      */ 0b0000000000000000000000000000100;
export const InputDiscreteLane: Lanes = /*              */ 0b0000000000000000000000000001000;

const InputContinuousHydrationLane: Lane = /*           */ 0b0000000000000000000000000010000;
export const InputContinuousLane: Lanes = /*            */ 0b0000000000000000000000000100000;

export const DefaultHydrationLane: Lane = /*            */ 0b0000000000000000000000001000000;
export const DefaultLane: Lanes = /*                    */ 0b0000000000000000000000010000000;

const TransitionHydrationLane: Lane = /*                */ 0b0000000000000000000000100000000;
const TransitionLanes: Lanes = /*                       */ 0b0000000011111111111111000000000;
const TransitionLane1: Lane = /*                        */ 0b0000000000000000000001000000000;
const TransitionLane2: Lane = /*                        */ 0b0000000000000000000010000000000;
const TransitionLane3: Lane = /*                        */ 0b0000000000000000000100000000000;
const TransitionLane4: Lane = /*                        */ 0b0000000000000000001000000000000;
const TransitionLane5: Lane = /*                        */ 0b0000000000000000010000000000000;
const TransitionLane6: Lane = /*                        */ 0b0000000000000000100000000000000;
const TransitionLane7: Lane = /*                        */ 0b0000000000000001000000000000000;
const TransitionLane8: Lane = /*                        */ 0b0000000000000010000000000000000;
const TransitionLane9: Lane = /*                        */ 0b0000000000000100000000000000000;
const TransitionLane10: Lane = /*                       */ 0b0000000000001000000000000000000;
const TransitionLane11: Lane = /*                       */ 0b0000000000010000000000000000000;
const TransitionLane12: Lane = /*                       */ 0b0000000000100000000000000000000;
const TransitionLane13: Lane = /*                       */ 0b0000000001000000000000000000000;
const TransitionLane14: Lane = /*                       */ 0b0000000010000000000000000000000;

const RetryLanes: Lanes = /*                            */ 0b0000111100000000000000000000000;
const RetryLane1: Lane = /*                             */ 0b0000000100000000000000000000000;
const RetryLane2: Lane = /*                             */ 0b0000001000000000000000000000000;
const RetryLane3: Lane = /*                             */ 0b0000010000000000000000000000000;
const RetryLane4: Lane = /*                             */ 0b0000100000000000000000000000000;

export const SomeRetryLane: Lane = RetryLane1;

export const SelectiveHydrationLane: Lane = /*          */ 0b0001000000000000000000000000000;

const NonIdleLanes = /*                                 */ 0b0001111111111111111111111111111;

export const IdleHydrationLane: Lane = /*               */ 0b0010000000000000000000000000000;
export const IdleLane: Lanes = /*                              */ 0b0100000000000000000000000000000;

export const OffscreenLane: Lane = /*                   */ 0b1000000000000000000000000000000;


export const RetryAfterError = /*       */ 0b1000000;
/**
 * 在计算机中，负数以其正值的补码形式表达
 * 补码 = 反码 + 1
 * 反码 = 将二进制数按位取反 即0 变1  1 变0 
 * 原数字  & -原数字
 * eg  原数：  68736258048 =   0000 0000 0000 0000 0001 0001 0001 0000
 *     反码：  68736258048 =   1111 1111 1111 1111 1110 1110 1110 1111
 *     补码： -68736258048 =   1111 1111 1111 1111 1110 1110 1111 0000
 *     原数& -原数         =   0000 0000 0000 0000 0000 0000 0001 0000
 *     
 * 所以这个函数取到了最右边的位，那么位越靠右优先级就越高所以函数名字getHighestPriorityLane 就是这样
 * 
 */

function getHighestPriorityLane(lanes: Lanes) {
  return lanes & -lanes;
}


export function pickArbitraryLane(lanes: Lanes): Lane {
  // This wrapper function gets inlined. Only exists so to communicate that it
  // doesn't matter which bit is selected; you can pick any bit without
  // affecting the algorithms where its used. Here I'm using
  // getHighestPriorityLane because it requires the fewest operations.
  return getHighestPriorityLane(lanes);
}





let workInProgressRootRenderLanes: Lanes = NoLanes;

export const deferRenderPhaseUpdateToNextBatch = true;

export function requestUpdateLane(fiber: Fiber): Lane {
  const mode = fiber.mode;
  if ((mode & BlockingMode) === NoMode) {
    return (SyncLane as Lane);
  } else if ((mode & ConcurrentMode) === NoMode) {
    return getCurrentPriorityLevel() === ImmediateSchedulerPriority ? 
    (SyncLane as Lane) : (SyncBatchedLane as Lane);
  } else if (
    !deferRenderPhaseUpdateToNextBatch &&
    (Cxt.executionContext & RenderContext) !== NoContext &&
    workInProgressRootRenderLanes !== NoLanes
  ) {
   
    return pickArbitraryLane(workInProgressRootRenderLanes);
  }
  // todo
  return SyncLane;
}
export function createLaneMap<T>(initial: T): LaneMap<T> {
  // Intentionally pushing one by one.
  // https://v8.dev/blog/elements-kinds#avoid-creating-holes
  const laneMap = [];
  for (let i = 0; i < TotalLanes; i++) {
    laneMap.push(initial);
  }
  return laneMap;
}
export function includesSomeLane(a: Lanes | Lane, b: Lanes | Lane) {
  return (a & b) !== NoLanes;
}
// return_highestLanePriority就是任务优先级，它有如下这些值，值越大，优先级越高
/*
export const SyncLanePriority: LanePriority = 17;
export const SyncBatchedLanePriority: LanePriority = 16;

const InputDiscreteHydrationLanePriority: LanePriority = 15;
export const InputDiscreteLanePriority: LanePriority = 14;

const InputContinuousHydrationLanePriority: LanePriority = 13;
export const InputContinuousLanePriority: LanePriority = 12;

const DefaultHydrationLanePriority: LanePriority = 11;
export const DefaultLanePriority: LanePriority = 10;

const TransitionShortHydrationLanePriority: LanePriority = 9;
export const TransitionShortLanePriority: LanePriority = 8;

const TransitionLongHydrationLanePriority: LanePriority = 7;
export const TransitionLongLanePriority: LanePriority = 6;

const RetryLanePriority: LanePriority = 5;

const SelectiveHydrationLanePriority: LanePriority = 4;

const IdleHydrationLanePriority: LanePriority = 3;
const IdleLanePriority: LanePriority = 2;

const OffscreenLanePriority: LanePriority = 1;

export const NoLanePriority: LanePriority = 0;


*/
let return_highestLanePriority: LanePriority = DefaultLanePriority;
function getHighestPriorityLanes(lanes: Lanes | Lane): Lanes {
  switch (getHighestPriorityLane(lanes)) {
    case SyncLane:
      return_highestLanePriority = SyncLanePriority;
      return SyncLane;
    case SyncBatchedLane:
      return_highestLanePriority = SyncBatchedLanePriority;
      return SyncBatchedLane;
    case InputDiscreteHydrationLane:
      return_highestLanePriority = InputDiscreteHydrationLanePriority;
      return InputDiscreteHydrationLane;
    case InputDiscreteLane:
      return_highestLanePriority = InputDiscreteLanePriority;
      return InputDiscreteLane;
    case InputContinuousHydrationLane:
      return_highestLanePriority = InputContinuousHydrationLanePriority;
      return InputContinuousHydrationLane;
    case InputContinuousLane:
      return_highestLanePriority = InputContinuousLanePriority;
      return InputContinuousLane;
    case DefaultHydrationLane:
      return_highestLanePriority = DefaultHydrationLanePriority;
      return DefaultHydrationLane;
    case DefaultLane:
      return_highestLanePriority = DefaultLanePriority;
      return DefaultLane;
    case TransitionHydrationLane:
      return_highestLanePriority = TransitionHydrationPriority;
      return TransitionHydrationLane;
    case TransitionLane1:
    case TransitionLane2:
    case TransitionLane3:
    case TransitionLane4:
    case TransitionLane5:
    case TransitionLane6:
    case TransitionLane7:
    case TransitionLane8:
    case TransitionLane9:
    case TransitionLane10:
    case TransitionLane11:
    case TransitionLane12:
    case TransitionLane13:
    case TransitionLane14:
      return_highestLanePriority = TransitionPriority;
      return lanes & TransitionLanes;
    case RetryLane1:
    case RetryLane2:
    case RetryLane3:
    case RetryLane4:
      return_highestLanePriority = RetryLanePriority;
      return lanes & RetryLanes;
    case SelectiveHydrationLane:
      return_highestLanePriority = SelectiveHydrationLanePriority;
      return SelectiveHydrationLane;
    case IdleHydrationLane:
      return_highestLanePriority = IdleHydrationLanePriority;
      return IdleHydrationLane;
    case IdleLane:
      return_highestLanePriority = IdleLanePriority;
      return IdleLane;
    case OffscreenLane:
      return_highestLanePriority = OffscreenLanePriority;
      return OffscreenLane;
    default:
     
      // This shouldn't be reachable, but as a fallback, return the entire bitmask.
      return_highestLanePriority = DefaultLanePriority;
      return lanes;
  }
}

const log = Math.log;
const LN2 = Math.LN2

function clz32Fallback(lanes: Lanes | Lane) {
  if (lanes === 0) {
    return 32;
  }
  return (31 - ((log(lanes) / LN2) | 0)) | 0;
}

const clz32 = Math.clz32 ? Math.clz32 : clz32Fallback;

function pickArbitraryLaneIndex(lanes: Lanes) {
  return 31 - clz32(lanes);
}

// 当前不完整
/*
  通过调用getNextLanes去计算在本次更新中应该处理的这批lanes（nextLanes），
  getNextLanes会调用getHighestPriorityLanes去计算任务优先级。
  任务优先级计算的原理是这样：更新优先级（update的lane），
  它会被并入root.pendingLanes，root.pendingLanes经过getNextLanes处理后，
  挑出那些应该处理的lanes，传入getHighestPriorityLanes，
  根据nextLanes找出这些lanes的优先级作为任务优先级。
*/
export function getNextLanes(root: FiberRoot, wipLanes: Lanes): Lanes{
  const pendingLanes = root.pendingLanes;
  if (pendingLanes === NoLanes) {
    // return_highestLanePriority = NoLanePriority;
    return NoLanes;
  }

  let nextLanes = NoLanes;
  let nextLanePriority = NoLanePriority;

  const expiredLanes = root.expiredLanes;
  const suspendedLanes = root.suspendedLanes;
  const pingedLanes = root.pingedLanes;

  if (expiredLanes !== NoLanes) {
    // TODO: Should entangle with SyncLane
    nextLanes = expiredLanes;
    nextLanePriority = return_highestLanePriority = SyncLanePriority;
  } else {
    // Do not work on any idle work until all the non-idle work has finished,
    // even if the work is suspended.
    const nonIdlePendingLanes = pendingLanes & NonIdleLanes;
    if (nonIdlePendingLanes !== NoLanes) {
      const nonIdleUnblockedLanes = nonIdlePendingLanes & ~suspendedLanes;
      if (nonIdleUnblockedLanes !== NoLanes) {
        nextLanes = getHighestPriorityLanes(nonIdleUnblockedLanes);
        nextLanePriority = return_highestLanePriority;
      } else {
        const nonIdlePingedLanes = nonIdlePendingLanes & pingedLanes;
        if (nonIdlePingedLanes !== NoLanes) {
          nextLanes = getHighestPriorityLanes(nonIdlePingedLanes);
          nextLanePriority = return_highestLanePriority;
        }
      }
    } else {
      // The only remaining work is Idle.
      const unblockedLanes = pendingLanes & ~suspendedLanes;
      if (unblockedLanes !== NoLanes) {
        nextLanes = getHighestPriorityLanes(unblockedLanes);
        nextLanePriority = return_highestLanePriority;
      } else {
        if (pingedLanes !== NoLanes) {
          nextLanes = getHighestPriorityLanes(pingedLanes);
          nextLanePriority = return_highestLanePriority;
        }
      }
    }
  }

  if (nextLanes === NoLanes) {
   
    return NoLanes;
  }

  if (
    wipLanes !== NoLanes &&
    wipLanes !== nextLanes &&
    // If we already suspended with a delay, then interrupting is fine. Don't
    // bother waiting until the root is complete.
    (wipLanes & suspendedLanes) === NoLanes
  ) {
    getHighestPriorityLanes(wipLanes);
    const wipLanePriority = return_highestLanePriority;
    if (
      nextLanePriority <= wipLanePriority ||
     
      (nextLanePriority === DefaultLanePriority &&
        wipLanePriority === TransitionPriority)
    ) {
      // Keep working on the existing in-progress tree. Do not interrupt.
      return wipLanes;
    } else {
      return_highestLanePriority = nextLanePriority;
    }
  }

  const entangledLanes = root.entangledLanes;
  if (entangledLanes !== NoLanes) {
    const entanglements = root.entanglements;
    let lanes = nextLanes & entangledLanes;
    while (lanes > 0) {
      const index = pickArbitraryLaneIndex(lanes);
      const lane = 1 << index;

      nextLanes |= entanglements[index];

      lanes &= ~lane;
    }
  }

  return  nextLanes;

}
export function mergeLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a | b;
}

export function isSubsetOfLanes(set: Lanes, subset: Lanes | Lane) {
  return (set & subset) === subset;
}

export function computeThreadID(root: FiberRoot, lane: Lane | Lanes) {
  // Interaction threads are unique per root and expiration time.
  // NOTE: Intentionally unsound cast. All that matters is that it's a number
  // and it represents a batch of work. Could make a helper function instead,
  // but meh this is fine for now.
  return (lane as any) * 1000 + root.interactionThreadID;
}

export function isTransitionLane(lane: Lane) {
  return (lane & TransitionLanes) !== 0;
}
export function intersectLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a & b;
}

function markRootEntangled(root: FiberRoot, entangledLanes: Lanes) {
  console.log('markRootEntangled', root, entangledLanes );
}

export function entangleTransitions(root: FiberRoot, fiber: Fiber, lane: Lane) {
  const updateQueue = fiber.updateQueue;
  if (updateQueue === null) {
    // Only occurs if the fiber has been unmounted.
    return;
  }
  const sharedQueue: SharedQueue<mixed> = (updateQueue as any).shared;
  if (isTransitionLane(lane)) {
    let queueLanes = sharedQueue.lanes;

    // If any entangled lanes are no longer pending on the root, then they must
    // have finished. We can remove them from the shared queue, which represents
    // a superset of the actually pending lanes. In some cases we may entangle
    // more than we need to, but that's OK. In fact it's worse if we *don't*
    // entangle when we should.
    queueLanes = intersectLanes(queueLanes, root.pendingLanes);

    // Entangle the new transition lane with the other transition lanes.
    const newQueueLanes = mergeLanes(queueLanes, lane);
    sharedQueue.lanes = newQueueLanes;
    // Even if queue.lanes already include lane, we don't know for certain if
    // the lane finished since the last time we entangled it. So we need to
    // entangle it again, just to be sure.
    markRootEntangled(root, newQueueLanes); //TODO
  }

}

const supportsMicrotasks = false
export function ensureRootIsScheduled(root: FiberRoot, currentTime: number) {
  console.log('ensureRootIsScheduled')
  // 获取旧任务
  const existingCallbackNode = root.callbackNode;

  // Check if any lanes are being starved by other work. If so, mark them as
  // expired so we know to work on those next.
  // 记录任务的过期时间，检查是否有过期任务，有则立即将它放到root.expiredLanes，
  // 便于接下来将这个任务以同步模式立即调度
  /*
    通过markStarvedLanesAsExpired的标记，过期任务得以被放到root.expiredLanes中在随后获取任务优先级时，
    会优先从root.expiredLanes中取值去计算优先级，这时得出的优先级是同步级别，
    因此走到下面会以同步优先级调度。实现过期任务被立即执行。
  */
  markStarvedLanesAsExpired(root, currentTime);

  // Determine the next lanes to work on, and their priority.

  const nextLanes = getNextLanes(
    root,
    root === WorkIn.workInProgressRoot ? workInProgressRootRenderLanes : NoLanes,
  );
  // This returns the priority level computed during the `getNextLanes` call.
  const newCallbackPriority = returnNextLanesPriority();

  if (nextLanes === NoLanes) {
    // Special case: There's nothing to work on.
      // 如果渲染优先级为空，则不需要调度
    if (existingCallbackNode !== null) {
      cancelCallback(existingCallbackNode);
    }
    root.callbackNode = null;
    root.callbackPriority = NoLanePriority;
    return;
  }

  // 当某一优先级任务正在渲染时，进来一个低优先级的任务，恰好这两个任务的优先级不同
    // 理论上，前者的优先级获取到的callbackPriority是一个，后者的优先级获取到的
    // callbackPriority是另一个，二者肯定不相同。

    // 但是，getHighestPriorityLanes总会获取到本次renderLanes里优先级最高的那
    // 些lanes，所以获取到的callbackPriority总是高优先级任务的，低优先级任务的callbackPriority
    // 无法获取到。也就是说，即使低优先级任务的lanes被加入了renderLanes，但是获取
    // 到的还是先前已经在执行的高优先级任务的lane，即：如果existingCallbackPriority
    // 和 newCallbackPriority不相等，说明newCallbackPriority 一定大于 existingCallbackPriority
    // 所以要取消掉原有的低优先级任务，相等的话说明没必要再重新调度一个，直接复用已有的任务
    // 去做更新
  // Check if there's an existing task. We may be able to reuse it.
  const existingCallbackPriority = root.callbackPriority;
  // ensureRootIsScheduled会在获取到新任务的任务优先级之后，去和旧任务的任务优先级去比较，
  // 从而做出是否需要重新发起调度的决定，若需要发起调度，那么会去计算调度优先级。
  /*
    为什么新旧任务的优先级如果不相等，那么新任务的优先级一定高于旧任务？
    这是因为每次调度去获取任务优先级的时候，都只获取root.pendingLanes中最紧急的那部分lanes对应的优先级，
    低优先级的update持有的lane对应的优先级是无法被获取到的。通过这种办法，
    可以将来自同一事件中的多个更新收敛到一个任务中去执行，言外之意就是同一个事件触发的多次更新的优先级是一样的，
    没必要发起多次任务调度
  */
  if (existingCallbackPriority === newCallbackPriority) {
    
    // The priority hasn't changed. We can reuse the existing task. Exit.
    return;
  }

    // 如果存在旧任务，取消旧任务调度一个新的任务
  if (existingCallbackNode != null) {
    // Cancel the existing callback. We'll schedule a new one below.
    cancelCallback(existingCallbackNode);
  }

  // Schedule a new callback.
  let newCallbackNode;
  if (newCallbackPriority === SyncLanePriority) {
    // Special case: Sync React callbacks are scheduled on a special
    // internal queue
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    newCallbackNode = null;
  } else if (newCallbackPriority === SyncBatchedLanePriority) {
    newCallbackNode = scheduleCallback(
      ImmediateSchedulerPriority,
      performSyncWorkOnRoot.bind(null, root),
    );
  } else if (
    supportsMicrotasks &&
    newCallbackPriority === InputDiscreteLanePriority
  ) {
    scheduleMicrotask(performSyncWorkOnRoot.bind(null, root));
    newCallbackNode = null;
  } else {
    // 计算调度优先级的过程是根据任务优先级找出对应的调度优先级。
    const schedulerPriorityLevel = lanePriorityToSchedulerPriority(
      newCallbackPriority,
    );
    newCallbackNode = scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root),
    );
  }

  root.callbackPriority = newCallbackPriority;
  root.callbackNode = newCallbackNode;
  console.log('callbackNode被赋值')
}


export function markStarvedLanesAsExpired(
  root: FiberRoot,
  currentTime: number,
): void {
  const pendingLanes = root.pendingLanes;
  const suspendedLanes = root.suspendedLanes;
  const pingedLanes = root.pingedLanes;
  // 获取root上已有的过期时间
  const expirationTimes = root.expirationTimes;

  let lanes = pendingLanes;
  // 遍历待处理的lanes，检查是否到了过期时间，如果过期，
  // 这个更新被视为饥饿状态，并把它的lane放到expiredLanes
  while (lanes > 0) {
    /*
     pickArbitraryLaneIndex是找到lanes中最靠左的那个1在lanes中的index
     也就是获取到当前这个lane在expirationTimes中对应的index
     比如 0b0010，得出的index就是2，就可以去expirationTimes中获取index为2
     位置上的过期时间
    */
    const index = pickArbitraryLaneIndex(lanes);
    // 这个操作是通过index还原出当前的位
    //  比如  lanes = 0011 --> pickArbitraryLaneIndex(lanes) --> 1 --> 1<< 1 --> 0010
    //        lanes = 0111 --> pickArbitraryLaneIndex(lanes) --> 2 --> 1<< 2 --> 0100
    // 这样就取出了最左边的那一位
    const lane = 1 << index;

    // 取出对应位置的过期时间
    const expirationTime = expirationTimes[index];
    
     //如果 发现一个没有过期时间并且待处理的lane，
   
    if (expirationTime === NoTimestamp) {
      // Found a pending lane with no expiration time. If it's not suspended, or
      // if it's pinged, assume it's CPU-bound. Compute a new expiration time
      // using the current time.
      // 如果它没被挂起，或者被触发了，那么去计算过期时间
      if (
        (lane & suspendedLanes) === NoLanes ||
        (lane & pingedLanes) !== NoLanes
      ) {
        // Assumes timestamps are monotonically increasing.
        // 根据获取的lane 转换成优先级，再计算出一个过期时间，放在这个lane对应的位上
        expirationTimes[index] = computeExpirationTime(lane, currentTime);
      }
      // 已经过期，将lane并入到expiredLanes中，实现了将lanes标记为过期
    } else if (expirationTime <= currentTime) {
      // This lane expired
      root.expiredLanes |= lane;
    }
    // 在所有的lanes中将当前的lane去掉，继续循环，直到所有的lane都被执行过
    lanes &= ~lane;
  }
}

function computeExpirationTime(lane: Lane, currentTime: number) {
  // TODO: Expiration heuristic is constant per lane, so could use a map.
  // 这个函数执行完重写了全局变量return_highestLanePriority 
  getHighestPriorityLanes(lane);
  const priority = return_highestLanePriority;
  // 优先级越高过期时间越短
  if (priority >= InputContinuousLanePriority) {
    
    return currentTime + 250;
  } else if (priority >= TransitionPriority) {
    return currentTime + 5000;
  } else {
    // Anything idle priority or lower should never expire.
    return NoTimestamp;
  }
}

export function returnNextLanesPriority() {
  return return_highestLanePriority;
}
// 计算调度优先级的过程是根据任务优先级找出对应的调度优先级。
export function lanePriorityToSchedulerPriority(
  lanePriority: LanePriority,
): ReactPriorityLevel {
  switch (lanePriority) {
    case SyncLanePriority:
    case SyncBatchedLanePriority:
      return ImmediateSchedulerPriority;
    case InputDiscreteHydrationLanePriority:
    case InputDiscreteLanePriority:
    case InputContinuousHydrationLanePriority:
    case InputContinuousLanePriority:
      return UserBlockingSchedulerPriority;
    case DefaultHydrationLanePriority:
    case DefaultLanePriority:
    case TransitionHydrationPriority:
    case TransitionPriority:
    case SelectiveHydrationLanePriority:
    case RetryLanePriority:
      return NormalSchedulerPriority;
    case IdleHydrationLanePriority:
    case IdleLanePriority:
    case OffscreenLanePriority:
      return IdleSchedulerPriority;
    case NoLanePriority:
      return NoSchedulerPriority;
    default:
      // invariant(
      //   false,
      //   'Invalid update priority: %s. This is a bug in React.',
      //   lanePriority,
      // );
      return ImmediateSchedulerPriority
  }
}
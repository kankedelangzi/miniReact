import { runWithPriority } from "../reconcile/commitRoot";
import scheduler from "../scheduler";
import { FiberRoot, Interaction, Lane, Lanes, mixed, SchedulerCallback } from "../type";
import { decoupleUpdatePriorityFromScheduler, enableSchedulerTracing, enableSyncMicroTasks } from "../type/constant";
import { ImmediatePriority } from "./tools";





const {

  unstable_cancelCallback: Scheduler_cancelCallback,
  unstable_scheduleCallback: Scheduler_scheduleCallback,
  unstable_ImmediatePriority: Scheduler_ImmediatePriority,
  
} = scheduler;

let syncQueue: Array<SchedulerCallback> | null = null;
let immediateQueueCallbackNode: mixed | null = null;


export function cancelCallback(callbackNode: mixed) {
  Scheduler_cancelCallback(callbackNode);
}


export function flushSyncCallbackQueue() {
  if (immediateQueueCallbackNode !== null) {
    console.log('flushSyncCallbackQueue')
    const node = immediateQueueCallbackNode;
    immediateQueueCallbackNode = null;
    Scheduler_cancelCallback(node);
  }
  flushSyncCallbackQueueImpl();
}
let isFlushingSyncQueue: boolean = false;

/**
 * 这是微任务的入口，主要是异步调用存储的任务主要是看syncQueue这个队列是否还存在任务
*/
function flushSyncCallbackQueueImpl() {
  // 为了防止当前任务调度时有别的任务来打断，这里强行标记一下，
  // 等到当前任务结束才能第二次调度 这就是isFlushingSyncQueue的作用
  console.trace('flushSyncCallbackQueueImpl,的调用栈')
  if(!isFlushingSyncQueue && syncQueue !== null ) {
    // 标记一下正在执行
    isFlushingSyncQueue = true;
    let i = 0;
    if(decoupleUpdatePriorityFromScheduler) {
      // decoupleUpdatePriorityFromScheduler是false这里忽略了
      console.error('flushSyncCallbackQueueImpl执行到了被忽略的逻辑')
    } else {
      try {
        const isSync = true;
        const queue = syncQueue;
        console.group('微任务')
        console.info('微任务：', syncQueue.length, [...syncQueue])
        runWithPriority(ImmediatePriority, () => {
          for (; i < queue.length; i++) {
            let callback: SchedulerCallback|null = queue[i];
            do {
              callback = callback(isSync);
            } while (callback !== null);
          }
        });
        console.groupEnd()
        syncQueue = null;
      } catch (error) {
        // error
        throw error
      } finally {
        // 结束后释放
        isFlushingSyncQueue = false
      }
    }

  }
}


export function schedulePendingInteractions(root: FiberRoot, lane: Lane | Lanes) {
  // This is called when work is scheduled on a root.
  // It associates the current interactions with the newly-scheduled expiration.
  // They will be restored when that expiration is later committed.
  if (!enableSchedulerTracing) {
    return;
  }
  console.log('schedulePendingInteractions 未实现')
  // scheduleInteractions(root, lane, __interactionsRef.current);
}



function scheduleInteractions(
  root: FiberRoot,
  lane: Lane | Lanes,
  interactions: Set<Interaction>,
) {
  if (!enableSchedulerTracing) {
    return;
  }

  if (interactions.size > 0) {
    const pendingInteractionMap = root.pendingInteractionMap;
    const pendingInteractions = pendingInteractionMap.get(lane);
    if (pendingInteractions != null) {
      interactions.forEach(interaction => {
        if (!pendingInteractions.has(interaction)) {
          // Update the pending async work count for previously unscheduled interaction.
          interaction.__count++;
        }

        pendingInteractions.add(interaction);
      });
    } else {
      pendingInteractionMap.set(lane, new Set(interactions));

      // Update the pending async work count for the current interactions.
      interactions.forEach(interaction => {
        interaction.__count++;
      });
    }

    // const subscriber = __subscriberRef.current;
    // if (subscriber !== null) {
    //   const threadID = computeThreadID(root, lane);
    //   subscriber.onWorkScheduled(interactions, threadID);
    // }
  }
}
const supportsMicrotasks = false
export function scheduleSyncCallback(callback: SchedulerCallback) {
  // Push this callback into an internal queue. We'll flush these either in
  // the next tick, or earlier if something calls `flushSyncCallbackQueue`.
  if (syncQueue === null) {
    syncQueue = [callback];

    // TODO: Figure out how to remove this It's only here as a last resort if we
    // forget to explicitly flush.
    if (enableSyncMicroTasks && supportsMicrotasks) {
      // Flush the queue in a microtask.
      scheduleMicrotask(flushSyncCallbackQueueImpl);
    } else {
      // Flush the queue in the next tick.
      immediateQueueCallbackNode = Scheduler_scheduleCallback(
        Scheduler_ImmediatePriority,
        flushSyncCallbackQueueImpl,
      );
    }
  } else {
    // Push onto existing queue. Don't need to schedule a callback because
    // we already scheduled one when we created the queue.
    syncQueue.push(callback);
  }
}


export const scheduleMicrotask: any =
  typeof queueMicrotask === 'function'
    ? queueMicrotask
    : typeof Promise !== 'undefined'
    ? (callback: any) =>
        Promise.resolve(null)
          .then(callback)
          .catch(e => null)
    : setTimeout; // TODO: Determine the best fallback here.
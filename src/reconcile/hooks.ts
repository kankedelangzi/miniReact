import { Fiber, Lanes, Lane, ReactPriorityLevel, 
  BasicStateAction,SharedQueue as ClassQueue,
  Dispatcher, Dispatch} from '../type'
import {  isSubsetOfLanes, NoLane } from '../reactDom/lane'
import { ReactCurrentDispatcher } from '../react/hooks'

import { requestUpdateLane } from '../reactDom/lane'
import {  isInterleavedUpdate } from '../reactDom/update'
import { scheduleUpdateOnFiber } from "./index";
import { requestEventTime } from '../reactDom/workInprogress'
const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
let interleavedQueues: Array<
  HookQueue<any, any> | ClassQueue<any>
> | null = null;

let workInProgressHook: Hook | null = null;
const HooksDispatcherOnMount: Dispatcher = {
  // readContext,

  // useCallback: mountCallback,
  // useContext: readContext,
  // useEffect: mountEffect,
  // useImperativeHandle: mountImperativeHandle,
  // useLayoutEffect: mountLayoutEffect,
  // useMemo: mountMemo,
  // useReducer: mountReducer,
  // useRef: mountRef,
  useState: mountState,
  // useDebugValue: mountDebugValue,
  // useDeferredValue: mountDeferredValue,
  // useTransition: mountTransition,
  // useMutableSource: mountMutableSource,
  // useOpaqueIdentifier: mountOpaqueIdentifier,

  // unstable_isNewReconciler: enableNewReconciler,
};

const HooksDispatcherOnUpdate: Dispatcher = {
  // readContext,

  // useCallback: updateCallback,
  // useContext: readContext,
  // useEffect: updateEffect,
  // useImperativeHandle: updateImperativeHandle,
  // useLayoutEffect: updateLayoutEffect,
  // useMemo: updateMemo,
  // useReducer: updateReducer,
  // useRef: updateRef,
  useState: updateState,
  // useDebugValue: updateDebugValue,
  // useDeferredValue: updateDeferredValue,
  // useTransition: updateTransition,
  // useMutableSource: updateMutableSource,
  // useOpaqueIdentifier: updateOpaqueIdentifier,

  // unstable_isNewReconciler: enableNewReconciler,
};


type Update<S, A> = {
  lane: Lane,
  action: A,
  eagerReducer: ((S: any, A: any) => S) | null,
  eagerState: S | null,
  next: Update<S, A> |null,
  priority?: ReactPriorityLevel,
};
export type UpdateQueue<S, A> = {
  pending: Update<S, A> | null,
  interleaved: Update<S, A> | null,
  lanes: Lanes,
  dispatch: any,
  lastRenderedReducer: ((S: any, A: any) => S) | null,
  lastRenderedState: S | null,
};
type HookQueue<S, A> = UpdateQueue<S, A>;
export type Hook = {
  memoizedState: any,
  baseState: any,
  baseQueue: Update<any, any> | null,
  queue: UpdateQueue<any, any> | null,
  next: Hook | null,
};

let renderLanes: Lanes = NoLanes;
let currentlyRenderingFiber: Fiber|null = null
let didScheduleRenderPhaseUpdate: boolean = false;
let didScheduleRenderPhaseUpdateDuringThisPass: boolean = false;
let currentHook: Hook | null = null;
export function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes,
): any {
  
  renderLanes = nextRenderLanes;
  currentlyRenderingFiber = workInProgress;



  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.lanes = NoLanes;

  console.log('%c renderWithHooks', 'color: blue',ReactCurrentDispatcher.current)
  ReactCurrentDispatcher.current =
    current === null || current.memoizedState === null
      ? HooksDispatcherOnMount
      : HooksDispatcherOnUpdate;

  let children = Component(props, secondArg);

  // Check if there was a render phase update
  if (didScheduleRenderPhaseUpdateDuringThisPass) {
    // Keep rendering in a loop for as long as render phase updates continue to
    // be scheduled. Use a counter to prevent infinite loops.
    let numberOfReRenders: number = 0;
    do {
      didScheduleRenderPhaseUpdateDuringThisPass = false;
      

      numberOfReRenders += 1;
      // Start over from the beginning of the list
      currentHook = null;
      workInProgressHook = null;
      workInProgress.updateQueue = null;

      // ReactCurrentDispatcher.current = __DEV__
      //   ? HooksDispatcherOnRerenderInDEV
      //   : HooksDispatcherOnRerender;

      children = Component(props, secondArg);
    } while (didScheduleRenderPhaseUpdateDuringThisPass);
  }

  // We can assume the previous dispatcher is always this one, since we set it
  // at the beginning of the render phase and there's no re-entrancy.
  // ReactCurrentDispatcher.current = ContextOnlyDispatcher;



  // This check uses currentHook so that it works the same in DEV and prod bundles.
  // hookTypesDev could catch more cases (e.g. context) but only in DEV bundles.
  const didRenderTooFewHooks =
    currentHook !== null && currentHook.next !== null;

  renderLanes = NoLanes;
  currentlyRenderingFiber =  null;

  currentHook = null;
  workInProgressHook = null;


  didScheduleRenderPhaseUpdate = false;


  return children;
}

/*** *******useState的实现****************/

function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  const hook = mountWorkInProgressHook();
  if(hook === null) {
    console.log('%c hook部分error mountState', 'color: red')
    throw Error('')
  }
  /**
    对应的是 useState( () => 123) 这种类型的
   */
  if (typeof initialState === 'function') {
    // $FlowFixMe: Flow doesn't like mixed types
    initialState = (initialState as () => S)();
  }

  hook.memoizedState = hook.baseState = initialState;

  const queue = (hook.queue = {
    pending: null,
    interleaved: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: (initialState as any),
  });
  const dispatch: Dispatch<
    BasicStateAction<S>
  > = (queue.dispatch = (dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ) as any));

  return [hook.memoizedState, dispatch];
}

function updateState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  return updateReducer(basicStateReducer, (initialState as any));
}
  
 

function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  // $FlowFixMe: Flow doesn't like mixed types
  return typeof action === 'function' ? (action as (s: S) => S)(state) : action;
}

function mountWorkInProgressHook(): Hook|null {
  const hook: Hook = {
    memoizedState: null,

    baseState: null,
    baseQueue: null,
    queue: null,

    next: null,
  };

  if (workInProgressHook === null && currentlyRenderingFiber) {
    // This is the first hook in the list
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else if(workInProgressHook) {
    // Append to the end of the list
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}

function dispatchAction<S, A>(
  fiber: Fiber|null,
  queue: UpdateQueue<S, A>,
  action: A,
) { 
  console.log('%c dispatch actions', 'color: green')
  if(!fiber) {
    return;
  }

  const eventTime = requestEventTime();
  const lane = requestUpdateLane(fiber);

  const update: Update<S, A> = {
    lane,
    action,
    eagerReducer: null,
    eagerState: null,
    next: null as any ,
  };

  const alternate = fiber.alternate;
  if (
    fiber === currentlyRenderingFiber ||
    (alternate !== null && alternate === currentlyRenderingFiber)
  ) {
    // This is a render phase update. Stash it in a lazily-created map of
    // queue -> linked list of updates. After this render pass, we'll restart
    // and apply the stashed updates on top of the work-in-progress hook.
    didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;
    const pending = queue.pending;
    if (pending === null) {
      // This is the first update. Create a circular list.
      update.next = update;
    } else {
      update.next = pending.next;
      pending.next = update;
    }
    queue.pending = update;
  } else {
    if (isInterleavedUpdate(fiber, lane)) {
      const interleaved = queue.interleaved;
      if (interleaved === null) {
        // This is the first update. Create a circular list.
        update.next = update;
        // At the end of the current render, this queue's interleaved updates will
        // be transfered to the pending queue.
        pushInterleavedQueue(queue);
      } else {
        update.next = interleaved.next;
        interleaved.next = update;
      }
      queue.interleaved = update;
    } else {
      const pending = queue.pending;
      if (pending === null) {
        // This is the first update. Create a circular list.
        update.next = update;
      } else {
        update.next = pending.next;
        pending.next = update;
      }
      queue.pending = update;
    }

    if (
      fiber.lanes === NoLanes &&
      (alternate === null || alternate.lanes === NoLanes)
    ) {
      // The queue is currently empty, which means we can eagerly compute the
      // next state before entering the render phase. If the new state is the
      // same as the current state, we may be able to bail out entirely.
      const lastRenderedReducer = queue.lastRenderedReducer;
      if (lastRenderedReducer !== null) {
        let prevDispatcher;
        
        try {
          const currentState: S = (queue.lastRenderedState as any);
          const eagerState = lastRenderedReducer(currentState, action);
          // Stash the eagerly computed state, and the reducer used to compute
          // it, on the update object. If the reducer hasn't changed by the
          // time we enter the render phase, then the eager state can be used
          // without calling the reducer again.
          update.eagerReducer = lastRenderedReducer;
          update.eagerState = eagerState;
          const is = Object.is;
          if (is(eagerState, currentState)) {
            
            return;
          }
        } catch (error) {
          // Suppress the error. It will throw again in the render phase.
        } finally {
        }
      }
    }
  
    const root = scheduleUpdateOnFiber(fiber, lane, eventTime); // 对比 updateContainer

    // if (isTransitionLane(lane) && root !== null) {
    //   let queueLanes = queue.lanes;

    //   // If any entangled lanes are no longer pending on the root, then they
    //   // must have finished. We can remove them from the shared queue, which
    //   // represents a superset of the actually pending lanes. In some cases we
    //   // may entangle more than we need to, but that's OK. In fact it's worse if
    //   // we *don't* entangle when we should.
    //   queueLanes = intersectLanes(queueLanes, root.pendingLanes);

    //   // Entangle the new transition lane with the other transition lanes.
    //   const newQueueLanes = mergeLanes(queueLanes, lane);
    //   queue.lanes = newQueueLanes;
    //   // Even if queue.lanes already include lane, we don't know for certain if
    //   // the lane finished since the last time we entangled it. So we need to
    //   // entangle it again, just to be sure.
    //   markRootEntangled(root, newQueueLanes);
    // }
  }

 

  // if (enableSchedulingProfiler) {
  //   markStateUpdateScheduled(fiber, lane);
  // }
}

export function pushInterleavedQueue(
  queue: HookQueue<any, any> | ClassQueue<any>,
) {
  if (interleavedQueues === null) {
    interleavedQueues = [queue];
  } else {
    interleavedQueues.push(queue);
  }
}


function updateReducer<S, I, A>(
  reducer: (S: S, A: A) => S,
  initialArg: I,
  init?: (a: I) => S,
): [S, Dispatch<A>] {
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
 
  if(queue) {
    queue.lastRenderedReducer = reducer;
  } 
  

  const current: Hook = (currentHook as any);

  // The last rebase update that is NOT part of the base state.
  let baseQueue = current.baseQueue;

  // The last pending update that hasn't been processed yet.

  const pendingQueue = queue ? queue.pending : null;
  if (pendingQueue !== null) {
    // We have new updates that haven't been processed yet.
    // We'll add them to the base queue.
    if (baseQueue !== null) {
      // Merge the pending queue and the base queue.
      const baseFirst = baseQueue.next;
      const pendingFirst = pendingQueue.next;
      baseQueue.next = pendingFirst;
      pendingQueue.next = baseFirst;
    }
   
    current.baseQueue = baseQueue = pendingQueue;
    if(queue) {
      queue.pending = null;
    }
   
  }

  if (baseQueue !== null) {
    // We have a queue to process.
    const first = baseQueue.next;
    let newState = current.baseState;

    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast: Update<S, A>|null = null;
    let update = first;
    do {
      const updateLane = update ? update.lane : NoLane;
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        // Priority is insufficient. Skip this update. If this is the first
        // skipped update, the previous update/state is the new base
        // update/state.
        const clone: Update<S, A> = {
          lane: updateLane,
          action: update ? update.action : null,
          eagerReducer: update ? update.eagerReducer : null,
          eagerState: update ? update.eagerState : null,
          next: null,
        };
        if (newBaseQueueLast === null) {
          newBaseQueueFirst = newBaseQueueLast = clone;
          newBaseState = newState;
        } else {
          // newBaseQueueLast = newBaseQueueLast.next = clone;
        }
        // Update the remaining priority in the queue.
        // TODO: Don't need to accumulate this. Instead, we can remove
        // renderLanes from the original lanes.
        // currentlyRenderingFiber.lanes = mergeLanes(
        //   currentlyRenderingFiber.lanes,
        //   updateLane,
        // );
        // markSkippedUpdateLanes(updateLane);
      } else {
        // This update does have sufficient priority.

        if (newBaseQueueLast !== null) {
          const clone: Update<S, A> = {
            // This update is going to be committed so we never want uncommit
            // it. Using NoLane works because 0 is a subset of all bitmasks, so
            // this will never be skipped by the check above.
            lane: NoLane,
            action: update ? update.action : null,
            eagerReducer: update ? update.eagerReducer : null,
            eagerState: update ? update.eagerState : null,
            next: null,
          };
          // newBaseQueueLast = newBaseQueueLast.next = clone;
        }

        // Process this update.
        if (update && update.eagerReducer === reducer) {
          // If this update was processed eagerly, and its reducer matches the
          // current reducer, we can use the eagerly computed state.
          newState = (update.eagerState  as S)
        } else {
          const action = update ? update.action : null;
          newState = reducer(newState, action);
        }
      }
      update = update ? update.next : null;
    } while (update !== null && update !== first);

    if (newBaseQueueLast === null) {
      newBaseState = newState;
    } else {
      newBaseQueueLast.next = newBaseQueueFirst as any;
    }

    // Mark that the fiber performed work, but only if the new state is
    // different from the current state.
    if (!Object.is(newState, hook.memoizedState)) {
      // markWorkInProgressReceivedUpdate();
    }

    hook.memoizedState = newState;
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;

    if(queue) {
      queue.lastRenderedState = newState;
    }
    
  }

  // Interleaved updates are stored on a separate queue. We aren't going to
  // process them during this render, but we do need to track which lanes
  // are remaining.
  const lastInterleaved = queue ? queue.interleaved: null;
  if (lastInterleaved !== null) {
    let interleaved = lastInterleaved;
    // do {
    //   const interleavedLane = interleaved.lane;
    //   currentlyRenderingFiber.lanes = mergeLanes(
    //     currentlyRenderingFiber.lanes,
    //     interleavedLane,
    //   );
    //   markSkippedUpdateLanes(interleavedLane);
    //   interleaved = ((interleaved: any).next: Update<S, A>);
    // } while (interleaved !== lastInterleaved);
  } else if (baseQueue === null) {
    // `queue.lanes` is used for entangling transitions. We can set it back to
    // zero once the queue is empty.
    // queue.lanes = NoLanes;
  }

  const dispatch: Dispatch<A> = queue ? (queue.dispatch as any) : () => null;
  return [hook.memoizedState, dispatch];
}

function updateWorkInProgressHook(): Hook {
  
  let nextCurrentHook: null | Hook = null;
  if (currentHook === null && currentlyRenderingFiber) {
    const current = currentlyRenderingFiber.alternate;
    if (current !== null) {
      nextCurrentHook = current.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else if(currentHook !== null) {
    nextCurrentHook = currentHook.next;
  }

  let nextWorkInProgressHook: null | Hook = null;
  if (workInProgressHook === null && currentlyRenderingFiber) {
    nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
  } else if(workInProgressHook !== null) {
    nextWorkInProgressHook = workInProgressHook.next;
  }

  if (nextWorkInProgressHook !== null) {
    // There's already a work-in-progress. Reuse it.
    workInProgressHook = nextWorkInProgressHook;
    nextWorkInProgressHook = workInProgressHook.next;

    currentHook = nextCurrentHook;
  } else  {
    // Clone from the current hook.

    currentHook = nextCurrentHook;
    let newHook: Hook 
    if(currentHook !== null) {
      newHook = {
        memoizedState: currentHook.memoizedState,
  
        baseState: currentHook.baseState,
        baseQueue: currentHook.baseQueue,
        queue: currentHook.queue,
  
        next: null,
      } 
    } else {
      newHook = {
        memoizedState: null,
  
        baseState: null,
        baseQueue: null,
        queue: null,
  
        next: null,
      } 
    }
    

    if (workInProgressHook === null && currentlyRenderingFiber) {
      // This is the first hook in the list.
      currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else if(workInProgressHook !== null){
      // Append to the end of the list.
      workInProgressHook = workInProgressHook.next = newHook;
    }
  }
  return workInProgressHook as Hook;
}
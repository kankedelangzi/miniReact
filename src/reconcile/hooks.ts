import { Fiber, Lanes, Lane, ReactPriorityLevel, 
  BasicStateAction,SharedQueue as ClassQueue,
  Dispatcher, Dispatch, mixed,
  Update as UpdateEffect,
  Passive as PassiveEffect,
  PassiveStatic as PassiveStaticEffect,
 } from '../type'
import {  isSubsetOfLanes, NoLane } from '../reactDom/lane'
import { ReactCurrentDispatcher } from '../react/hooks'
import {Effect, Passive as HookPassive, HasEffect as HookHasEffect, FunctionComponentUpdateQueue} from "../type/constant";
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
  useEffect: mountEffect,
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
  useEffect: updateEffect,
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
  // 区分是挂载还是更新过程，获取不同的hooks函数集合
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
/*
  产生的hook对象依次排列，形成链表存储到函数组件fiber.memoizedState上。在这个过程中，
  有一个十分重要的指针：workInProgressHook，它通过记录当前生成（更新）的hook对象，可以间接反映在组件中当前调用到哪个hook函数了。
  每调用一次hook函数，就将这个指针的指向移到该hook函数产生的hook对象上
  hook函数每次执行，都会创建它对应的hook对象，去进行下一步的操作，比如useReducer会在hook对象上挂载更新队列，
  useEffect会在hook对象上挂载effect链表。
  而创建hook对象的过程实际上也是hooks链表构建以及workInProgressHook指针指向更新的过程。
*/
function mountWorkInProgressHook(): Hook {
  const hook: Hook = {
    memoizedState: null,

    baseState: null,
    baseQueue: null,
    queue: null,

    next: null,
  };

    /*
      fiber.memoizedState ---> useState hook
                             |
                             |
                            next
                             |
                             ↓
                        useEffect hook
                        memoizedState: useEffect的effect对象 ---> useLayoutEffect的effect对象
                             |              ↑__________________________________|
                             |
                            next
                             |
                             ↓
                        useLayoutffect hook
                        memoizedState: useLayoutEffect的effect对象 ---> useEffect的effect对象
                                            ↑___________________________________|

    fiber.updateQueue ---> useLayoutEffect ----next----> useEffect
                             ↑                          |
                             |__________________________|
    fiber.memoizedState的hooks链表中，use(Layout)Effect对应hook元素的memoizedState中。
    fiber.updateQueue中，本次更新的updateQueue，它会在本次更新的commit阶段中被处理。
    */ 
   // workInProgressHook为null说明此时还没有hooks链表，
    // 将新hook对象作为第一个元素挂载到fiber.memoizedState，
    // 并将workInProgressHook指向它。

  if (workInProgressHook === null && currentlyRenderingFiber) {
    // This is the first hook in the list
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else if(workInProgressHook) {
    // Append to the end of the list
      // workInProgressHook不为null说明已经有hooks链表，此时将
    // 新的hook对象连接到链表后边，并将workInProgressHook指向它。
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook as Hook;
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
/*
                currentTree

       current.memoizedState = hookA -> hookB -> hookC
                                          ^             
                                      currentHook
                                          |
         workInProgress Tree              |
                                          |                                
workInProgress.memoizedState = hookA -> hookB
                                          ^          
                                 workInProgressHook
在更新过程中，由于存在current树，所以workInProgress节点也就有对应的current节点。
那么自然也会有两条hooks链表，分别存在于current和workInProgress节点的memorizedState属性上。
鉴于此，更新过程的hooks链表构建需要另一个指针的参与：currentHook。
它作为组件的workInProgressHook在上一次更新时对应的hook对象，新的hook对象可以基于它创建。
另外，也可以获取到上次hook对象的一些数据，例如useEffect的前后依赖项比较，前一次的依赖项就可以通过它获得。
*/
function updateWorkInProgressHook(): Hook {
  
  let nextCurrentHook: null | Hook = null;
  if (currentHook === null && currentlyRenderingFiber) {
     // currentHook在函数组件调用完成时会被设置为null，
    // 这说明组件是刚刚开始重新渲染，刚刚开始调用第一个hook函数。
    // hooks链表为空
    const current = currentlyRenderingFiber.alternate;
    if (current !== null) {
      nextCurrentHook = current.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else if(currentHook !== null) {
    // 这说明已经不是第一次调用hook函数了，
    // hooks链表已经有数据，nextCurrentHook指向当前的下一个hook
    nextCurrentHook = currentHook.next;
  }

  let nextWorkInProgressHook: null | Hook = null;
  if (workInProgressHook === null && currentlyRenderingFiber) {
     // workInProgress.memoizedState在函数组件每次渲染时都会被设置成null，
    // workInProgressHook在函数组件调用完成时会被设置为null，
    // 所以当前的判断分支说明现在正调用第一个hook函数，hooks链表为空
    // 将nextWorkInProgressHook指向workInProgress.memoizedState，为null
    nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
  } else if(workInProgressHook !== null) {
    // 走到这个分支说明hooks链表已经有元素了，将nextWorkInProgressHook指向
    // hooks链表的下一个元素
    nextWorkInProgressHook = workInProgressHook.next;
  }

  if (nextWorkInProgressHook !== null) {
    // There's already a work-in-progress. Reuse it.
    // 依据上面的推导，nextWorkInProgressHook不为空说明hooks链表不为空
    // 更新workInProgressHook、nextWorkInProgressHook、currentHook
    workInProgressHook = nextWorkInProgressHook;
    nextWorkInProgressHook = workInProgressHook.next;

    currentHook = nextCurrentHook;
  } else  {
    // Clone from the current hook.
     // 走到这个分支说明hooks链表为空
    // 刚刚调用第一个hook函数，基于currentHook新建一个hook对象，ß

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



/*************useEffect相关****************/

function mountEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {

  // if (
  //   __DEV__ &&
  //   enableStrictEffects &&
  //   (currentlyRenderingFiber.mode & StrictEffectsMode) !== NoMode
  // ) {
  //  // dev
  // } else {
    return mountEffectImpl(
      PassiveEffect | PassiveStaticEffect,
      HookPassive,
      create,
      deps,
    );
  // }
}

function mountEffectImpl(fiberFlags: number, hookFlags:number, create:  () => (() => void) | void, deps: Array<mixed> | void | null): void {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  if(currentlyRenderingFiber) {
    // 为fiber打上副作用的effectTag
    currentlyRenderingFiber.flags |= fiberFlags;
  }
 // 创建effect链表，挂载到hook的memoizedState上和fiber的updateQueue
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    undefined,
    nextDeps,
  );
}

function createFunctionComponentUpdateQueue(): FunctionComponentUpdateQueue {
  return {
    lastEffect: null,
  };
}

/*
  下边，就是effect链表的构建过程。我们可以看到，effect对象创建出来最终会以两种形式放到两个地方：
  单个的effect，放到hook.memorizedState上；环状的effect链表，放到fiber节点的updateQueue中。
  两者各有用途，前者的effect会作为上次更新的effect，为本次创建effect对象提供参照（对比依赖项数组），
  后者的effect链表会作为最终被执行的主体，带到commit阶段处理。
*/
function pushEffect(tag: number, create:  () => (() => void) | void, destroy?:  () => (() => void) | void, deps: Array<mixed> | null) {
  const effect: Effect = {
    tag,
    create,
    destroy,
    deps,
    // Circular
    next: null,
  };
  // fiber的updateQueue也要挂载相effect相关的副作用
  if(currentlyRenderingFiber) {
    // 从workInProgress节点上获取到updateQueue，为构建链表做准备
    let componentUpdateQueue: null | FunctionComponentUpdateQueue = (currentlyRenderingFiber.updateQueue as any);
  if (componentUpdateQueue === null) {
     // 如果updateQueue为空，把effect放到链表中，和它自己形成闭环
    componentUpdateQueue = createFunctionComponentUpdateQueue();
     // 将updateQueue赋值给WIP节点的updateQueue，实现effect链表的挂载
    currentlyRenderingFiber.updateQueue = (componentUpdateQueue as any);
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
      // updateQueue不为空，将effect接到链表的后边
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  }
  
  return effect;
}


function updateEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}

/*
  调用updateEffectImpl，完成effect链表的构建。这个过程中会根据前后依赖项是否变化，
  从而创建不同的effect对象。具体体现在effect的tag上，如果前后依赖未变，
  则effect的tag就赋值为传入的hookFlags，否则，在tag中加入HookHasEffect标志位。
  正是因为这样，在处理effect链表时才可以只处理依赖变化的effect，
  use(Layout)Effect可以根据它的依赖变化情况来决定是否执行回调。
*/
function updateEffectImpl(fiberFlags: number, hookFlags: number, create:  () => (() => void) | void, deps: Array<mixed> | void | null,): void {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destroy = undefined;

  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState;
    // 获取上一次effect的destory函数，也就是useEffect回调中return的函数
    /*
      在组件挂载和更新时，有一个区别，就是挂载期间调用pushEffect创建effect对象的时候并没有传destroy函数，
      而更新期间传了，这是因为每次effect执行时，都是先执行前一次的销毁函数，
      再执行新effect的创建函数。而挂载期间，上一次的effect并不存在，执行创建函数前也就无需先销毁。
    */
    destroy = prevEffect.destroy;
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;
      // 比较前后依赖，如果没有变化，push一个不带HookHasEffect的effect
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        //挂载和更新，都调用了pushEffect，它的职责很单纯，
        //就是创建effect对象，构建effect链表，挂到WIP节点的updateQueue上。
        hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
        return;
      }
    }
  }

  if(currentlyRenderingFiber) {
    currentlyRenderingFiber.flags |= fiberFlags;
  }

  
  // 如果前后依赖有变，在effect的tag中加入HookHasEffect
  // 并将新的effect更新到hook.memoizedState上
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    destroy,
    nextDeps,
  );
}

function areHookInputsEqual(
  nextDeps: Array<mixed>,
  prevDeps: Array<mixed> | null,
) {
  

  if (prevDeps === null) {
   
    return false;
  }
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if ( Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}
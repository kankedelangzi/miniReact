import { Fiber, Lanes, Update, UpdateQueue,
  FiberRoot, Placement,Container,
   ShouldCapture, DidCapture, StackCursor,
   HydratableInstance,Instance,TextInstance,
   IndeterminateComponent,Profiler,
   SuspenseComponent,SuspenseListComponent,
   OffscreenComponent,LegacyHiddenComponent,
   Cache,
   ForceUpdateForLegacySuspense,
   NoFlags,ReactContext,
   ClassComponent,HostPortal,ContextProvider,
  ChildDeletion, HostText,HostComponent,
  ContentReset, REACT_ELEMENT_TYPE, IReactElement, HostRoot, mixed, FunctionComponent,
   Callback, MemoComponent, SimpleMemoComponent } from '../type/index'
import { shouldSetTextContent } from '../reactDom/tools'
import {  cloneChildFibers, createFiberFromElement, createFiberFromText } from '../reactDom/create'
import { createCursor, push, pop, rootInstanceStackCursor, NoContextT, NO_CONTEXT } from './fiberStack'
import { } from './tools'
import {  getRootHostContext, hasContextChanged as hasLegacyContextChanged } from '../reactDom/context'
import { createChild } from '../reactDom/create'
import { mountIndeterminateComponent, updateFunctionComponent} from './functionComponent'
import { canHydrateInstance, canHydrateTextInstance, getNextHydratableSibling, getFirstHydratableChild } from '../reactDom/instance'
import { createWorkInProgress, markSkippedUpdateLanes } from './commit'
import { includesSomeLane, isSubsetOfLanes, mergeLanes, NoLane, NoLanes } from "../reactDom/lane";
import { enableCache, isPrimaryRenderer, supportsHydration, enableProfilerTimer} from "../type/constant";
import { CacheContext } from "./cache";
import { stopProfilerTimerIfRunning } from "./time";
import { resolveDefaultProps } from './commitRoot'
import { updateClassComponent } from './classComponent'

const valueCursor: StackCursor<mixed> = createCursor(null);
const isArray = Array.isArray;

let didReceiveUpdate: boolean = false;
export const disableLegacyContext = false;
let hydrationParentFiber: null | Fiber = null;
let isHydrating = false;

export function markWorkInProgressReceivedUpdate() {
  didReceiveUpdate = true;
}

function resetHydrationState(): void {
  if (!supportsHydration) {
    return;
  }

  hydrationParentFiber = null;
  nextHydratableInstance = null;
  isHydrating = false;
}

/*
  React对每个节点进行beginWork操作，进入beginWork后，首先判断节点及其子树是否有更新，
  若有更新，则会在计算新状态和diff之后生成新的Fiber，然后在新的fiber上标记flags（effectTag），
  最后return它的子节点，以便继续针对子节点进行beginWork。若它没有子节点，则返回null，
  这样说明这个节点是末端节点，可以进行向上回溯，进入completeWork阶段。
  通过概述可知beginWork阶段的整体工作是去更新节点，并返回子树，但真正的beginWork函数只是节点更新的入口，
  不会直接进行更新操作。作为入口，它的职责很明显，拦截无需更新的节点。同时，它还会将context信息入到栈中
*/
/*
beginWork它的返回值有两种情况：
返回当前节点的子节点，然后会以该子节点作为下一个工作单元继续beginWork，不断往下生成fiber节点，构建workInProgress树。
返回null，当前fiber子树的遍历就此终止，从当前fiber节点开始往回进行completeWork。
bailoutOnAlreadyFinishedWork函数的返回值也是如此。
返回当前节点的子节点，前置条件是当前节点的子节点有更新，此时当前节点未经处理，是可以直接复用的，复用的过程就是复制一份current节点的子节点，并把它return出去。
返回null，前提是当前子节点没有更新，当前子树的遍历过程就此终止。开始completeWork。

*/
export function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  // 获取workInProgress.lanes，可通过判断它是否为空去判断该节点是否需要更新
  const updateLanes = workInProgress.lanes;
  // debugger
  /*****************************这段代码已知作用是在update时过滤掉不需要更新的fiber节点************* */
   // 依据current是否存在判断当前是首次挂载还是后续的更新
  // 如果是更新，先看优先级够不够，不够的话就能调用bailoutOnAlreadyFinishedWork
  // 复用fiber节点来跳出对当前这个节点的处理了。
  /*
  这首先要理解current是什么，基于双缓冲的规则，调度更新时有两棵树，
  展示在屏幕上的current Tree和正在后台基于current树构建的workInProgress Tree。
  那么，current和workInProgress可以理解为镜像的关系。workLoop循环当前遍历到的
  workInProgress节点来自于它对应的current节点父级fiber的子节点（即current节点），
  所以workInProgress节点和current节点也是镜像的关系。
  */
  if (current !== null) {
    const oldProps = current.memoizedProps;
    const newProps = workInProgress.pendingProps;

    if (
      oldProps !== newProps ||
      hasLegacyContextChanged() 
    ) {
      // If props or context changed, mark the fiber as having performed work.
      // This may be unset if the props are determined to be equal later (memo).
      didReceiveUpdate = true;
    
    } 
    // 先去识别该节点是否需要处理，若无需处理，则调用bailoutOnAlreadyFinishedWork复用节点，
    // 否则才真正去更新。
    else if (!includesSomeLane(renderLanes, updateLanes)) {
      didReceiveUpdate = false;
      // This fiber does not have any pending work. Bailout without entering
      // the begin phase. There's still some bookkeeping we that needs to be done
      // in this optimized path, mostly pushing stuff onto the stack.
      switch (workInProgress.tag) {
        case HostRoot:
          pushHostRootContext(workInProgress);
          if (enableCache) {
            const root: FiberRoot = workInProgress.stateNode;
            const cache: Cache = current.memoizedState.cache;
            pushCacheProvider(workInProgress, cache);
            pushRootCachePool(root);
          }
          resetHydrationState();
          break;
        case HostComponent:
          // pushHostContext(workInProgress);
          break;
        case ClassComponent: {
          // const Component = workInProgress.type;
          // if (isLegacyContextProvider(Component)) {
          //   pushLegacyContextProvider(workInProgress);
          // }
          break;
        }
        case HostPortal:
          // pushHostContainer(
          //   workInProgress,
          //   workInProgress.stateNode.containerInfo,
          // );
          break;
        case ContextProvider: {
          // const newValue = workInProgress.memoizedProps.value;
          // const context: ReactContext<any> = workInProgress.type._context;
          // pushProvider(workInProgress, context, newValue);
          break;
        }
      
        case Profiler:
          // if (enableProfilerTimer) {
          //   // Profiler should only call onRender when one of its descendants actually rendered.
          //   const hasChildWork = includesSomeLane(
          //     renderLanes,
          //     workInProgress.childLanes,
          //   );
          //   if (hasChildWork) {
          //     workInProgress.flags |= Update;
          //   }

          //   // Reset effect durations for the next eventual effect phase.
          //   // These are reset during render to allow the DevTools commit hook a chance to read them,
          //   const stateNode = workInProgress.stateNode;
          //   stateNode.effectDuration = 0;
          //   stateNode.passiveEffectDuration = 0;
          // }
          break;
        case SuspenseComponent: {
          // const state: SuspenseState | null = workInProgress.memoizedState;
          // if (state !== null) {
          //   if (enableSuspenseServerRenderer) {
          //     if (state.dehydrated !== null) {
          //       pushSuspenseContext(
          //         workInProgress,
          //         setDefaultShallowSuspenseContext(suspenseStackCursor.current),
          //       );
          //       // We know that this component will suspend again because if it has
          //       // been unsuspended it has committed as a resolved Suspense component.
          //       // If it needs to be retried, it should have work scheduled on it.
          //       workInProgress.flags |= DidCapture;
          //       // We should never render the children of a dehydrated boundary until we
          //       // upgrade it. We return null instead of bailoutOnAlreadyFinishedWork.
          //       return null;
          //     }
          //   }

          //   // If this boundary is currently timed out, we need to decide
          //   // whether to retry the primary children, or to skip over it and
          //   // go straight to the fallback. Check the priority of the primary
          //   // child fragment.
          //   const primaryChildFragment: Fiber = (workInProgress.child: any);
          //   const primaryChildLanes = primaryChildFragment.childLanes;
          //   if (includesSomeLane(renderLanes, primaryChildLanes)) {
          //     // The primary children have pending work. Use the normal path
          //     // to attempt to render the primary children again.
          //     return updateSuspenseComponent(
          //       current,
          //       workInProgress,
          //       renderLanes,
          //     );
          //   } else {
          //     // The primary child fragment does not have pending work marked
          //     // on it
          //     pushSuspenseContext(
          //       workInProgress,
          //       setDefaultShallowSuspenseContext(suspenseStackCursor.current),
          //     );
          //     // The primary children do not have pending work with sufficient
          //     // priority. Bailout.
          //     const child = bailoutOnAlreadyFinishedWork(
          //       current,
          //       workInProgress,
          //       renderLanes,
          //     );
          //     if (child !== null) {
          //       // The fallback children have pending work. Skip over the
          //       // primary children and work on the fallback.
          //       return child.sibling;
          //     } else {
          //       return null;
          //     }
          //   }
          // } else {
          //   pushSuspenseContext(
          //     workInProgress,
          //     setDefaultShallowSuspenseContext(suspenseStackCursor.current),
          //   );
          // }
          break;
        }
        case SuspenseListComponent: {
          break;
          // const didSuspendBefore = (current.flags & DidCapture) !== NoFlags;

          // const hasChildWork = includesSomeLane(
          //   renderLanes,
          //   workInProgress.childLanes,
          // );

          // if (didSuspendBefore) {
          //   if (hasChildWork) {
          //     // If something was in fallback state last time, and we have all the
          //     // same children then we're still in progressive loading state.
          //     // Something might get unblocked by state updates or retries in the
          //     // tree which will affect the tail. So we need to use the normal
          //     // path to compute the correct tail.
          //     return updateSuspenseListComponent(
          //       current,
          //       workInProgress,
          //       renderLanes,
          //     );
          //   }
          //   // If none of the children had any work, that means that none of
          //   // them got retried so they'll still be blocked in the same way
          //   // as before. We can fast bail out.
          //   workInProgress.flags |= DidCapture;
          // }

          // // If nothing suspended before and we're rendering the same children,
          // // then the tail doesn't matter. Anything new that suspends will work
          // // in the "together" mode, so we can continue from the state we had.
          // const renderState = workInProgress.memoizedState;
          // if (renderState !== null) {
          //   // Reset to the "together" mode in case we've started a different
          //   // update in the past but didn't complete it.
          //   renderState.rendering = null;
          //   renderState.tail = null;
          //   renderState.lastEffect = null;
          // }
          // pushSuspenseContext(workInProgress, suspenseStackCursor.current);

          // if (hasChildWork) {
          //   break;
          // } else {
          //   // If none of the children had any work, that means that none of
          //   // them got retried so they'll still be blocked in the same way
          //   // as before. We can fast bail out.
          //   return null;
          // }
        }
        case OffscreenComponent:
        case LegacyHiddenComponent: {
          // Need to check if the tree still needs to be deferred. This is
          // almost identical to the logic used in the normal update path,
          // so we'll just enter that. The only difference is we'll bail out
          // at the next level instead of this one, because the child props
          // have not changed. Which is fine.
          // TODO: Probably should refactor `beginWork` to split the bailout
          // path from the normal path. I'm tempted to do a labeled break here
          // but I won't :)
          // workInProgress.lanes = NoLanes;
          // return updateOffscreenComponent(current, workInProgress, renderLanes);
          break;
        }
        
      }
      //，若节点的优先级不满足要求，说明它不用更新，会调用bailoutOnAlreadyFinishedWork函数，
      // 去复用current节点作为新的workInProgress树的节点。
      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    } else {
      if ((current.flags & ForceUpdateForLegacySuspense) !== NoFlags) {
        // This is a special case that only exists for legacy mode.
        // See https://github.com/facebook/react/pull/19216.
        didReceiveUpdate = true;
      } else {
        // An update was scheduled on this fiber, but there are no new props
        // nor legacy context. Set this to false. If an update queue or context
        // consumer produces a changed value, it will set this to true. Otherwise,
        // the component will assume the children have not changed and bail out.
        didReceiveUpdate = false;
      }
    }
  } else {
    didReceiveUpdate = false;
  }


  /*****************************这段代码已知作用是在update时过滤掉不需要更新的fiber节点************* */

  workInProgress.lanes = NoLanes;
  switch(workInProgress.tag) {
    case IndeterminateComponent: {
      return mountIndeterminateComponent(
        current||null,
        workInProgress,
        workInProgress.type,
        renderLanes,
      ) || null;
    }
    case HostRoot:
      return updateHostRoot(current, workInProgress, renderLanes);
    case HostComponent: 
      return updateHostComponent(current, workInProgress, renderLanes)
    case ClassComponent: {
        const Component = workInProgress.type;
        const unresolvedProps = workInProgress.pendingProps;
        const resolvedProps =
          workInProgress.elementType === Component
            ? unresolvedProps
            : resolveDefaultProps();
        return updateClassComponent(
          current,
          workInProgress,
          Component,
          resolvedProps,
          renderLanes,
        );
      }
    case HostText:
      return updateHostText(current, workInProgress);
    case FunctionComponent: {
      const Component = workInProgress.type;
      const unresolvedProps = workInProgress.pendingProps;
      const resolvedProps =
        workInProgress.elementType === Component
          ? unresolvedProps
          : resolveDefaultProps();
      return updateFunctionComponent(
        current,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes,
      );
    }
    case MemoComponent: {
      break;
    }
    case SimpleMemoComponent: {
      break;
    }
    default:
      console.log('%c beginWork 这种类型的tag没有处理逻辑',  
      'color:red;background:yellow;', workInProgress.tag)
  }
  return null
}

export function cloneUpdateQueue<State>(
  current: Fiber|null,
  workInProgress: Fiber,
): void {
  // Clone the update queue from current. Unless it's already a clone.
  const queue: UpdateQueue<State> = (workInProgress.updateQueue as any);
  const currentQueue: UpdateQueue<State> = current ? (current.updateQueue as any) : null;
  if (queue === currentQueue) {
    const clone: UpdateQueue<State> = {
      baseState: currentQueue.baseState,
      firstBaseUpdate: currentQueue.firstBaseUpdate,
      lastBaseUpdate: currentQueue.lastBaseUpdate,
      shared: currentQueue.shared,
      effects: currentQueue.effects,
    };
    workInProgress.updateQueue = clone;
  }
}

export function pushProvider<T>(
  providerFiber: Fiber,
  context: ReactContext<T>|null,
  nextValue: T,
): void {
  if(!context) {
    return ;
  }
  if (isPrimaryRenderer) {
    push(valueCursor, context._currentValue, providerFiber);

    context._currentValue = nextValue;
    
  } else {
    push(valueCursor, context._currentValue2, providerFiber);

    context._currentValue2 = nextValue;
   
  }
}

/*
我们也可以意识到，识别当前fiber节点的子树有无更新显得尤为重要，这可以决定是否终止当前Fiber子树的遍历，
将复杂度直接降低。实际上可以通过fiber.childLanes去识别，childLanes如果不为空，
表明子树中有需要更新的节点，那么需要继续往下走。
标记fiber.childLanes的过程是在开始调度时发生的，在markUpdateLaneFromFiberToRoot 函数中
*/

function bailoutOnAlreadyFinishedWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  if (current !== null) {
    // Reuse previous dependencies
    workInProgress.dependencies = current.dependencies;
  }

  if (enableProfilerTimer) {
    // Don't update "base" render times for bailouts.
    stopProfilerTimerIfRunning(workInProgress);
  }

  markSkippedUpdateLanes(workInProgress.lanes); // TODO

 // 如果子节点没有更新，返回null，终止遍历
  if (!includesSomeLane(renderLanes, workInProgress.childLanes)) {

    return null;
  } else {
    // This fiber doesn't have work, but its subtree does. Clone the child
    // fibers and continue.
    cloneChildFibers(current, workInProgress);
    return workInProgress.child;
  }
}



export function pushRootCachePool(root: FiberRoot) {
  if (!enableCache) {
    return;
  }
  // When we start rendering a tree, read the pooled cache for this render
  // from `root.pooledCache`. If it's currently `null`, we will lazily
  // initialize it the first type it's requested. However, we only mutate
  // the root itself during the complete/unwind phase of the HostRoot.
  // pooledCache = root.pooledCache;
}

export function pushCacheProvider(workInProgress: Fiber, cache: Cache) {
  if (!enableCache) {
    return;
  }
  pushProvider(workInProgress, CacheContext, cache);
}

export const emptyContextObject = {};
const contextStackCursor: StackCursor<Object> = createCursor(
  emptyContextObject,
);
export const didPerformWorkStackCursor: StackCursor<boolean> = createCursor(false);

function pushTopLevelContextObject(
  fiber: Fiber,
  context: Object,
  didChange: boolean,
): void {
  if (disableLegacyContext) {
    return;
  } else {
  

    push(contextStackCursor, context, fiber);
    push(didPerformWorkStackCursor, didChange, fiber);
  }
}


const contextFiberStackCursor: StackCursor<Fiber | NoContextT> = createCursor(
  NO_CONTEXT,
);

function pushHostContainer(fiber: Fiber, nextRootInstance: Container) {
  // Push current root instance onto the stack;
  // This allows us to reset root when portals are popped.
  push(rootInstanceStackCursor, nextRootInstance, fiber);
  // Track the context and the Fiber that provided it.
  // This enables us to pop only Fibers that provide unique contexts.
  push(contextFiberStackCursor, fiber, fiber);

  // Finally, we need to push the host context to the stack.
  // However, we can't just call getRootHostContext() and push it because
  // we'd have a different number of entries on the stack depending on
  // whether getRootHostContext() throws somewhere in renderer code or not.
  // So we push an empty value first. This lets us safely unwind on errors.
  push(contextStackCursor, NO_CONTEXT, fiber);
  const nextRootContext = getRootHostContext(nextRootInstance);
  // Now that we know this function doesn't throw, replace it.
  pop(contextStackCursor, fiber);
  push(contextStackCursor, nextRootContext, fiber);
}


function pushHostRootContext(workInProgress: Fiber) {
  const root = (workInProgress.stateNode as FiberRoot);
  if (root.pendingContext) {
    pushTopLevelContextObject(
      workInProgress,
      root.pendingContext,
      root.pendingContext !== root.context,
    );
  } else if (root.context) {
    // Should always be set
    pushTopLevelContextObject(workInProgress, root.context, false);
  }
  pushHostContainer(workInProgress, root.containerInfo);
}

let nextHydratableInstance: null | HydratableInstance = null;
function tryHydrate(fiber: Fiber, nextInstance: HydratableInstance | null) {
  switch (fiber.tag) {
    case HostComponent: {
      const type = fiber.type;
      const props = fiber.pendingProps;
      const instance = canHydrateInstance(nextInstance, type, props);
      if (instance !== null) {
        fiber.stateNode = (instance as Instance);
        return true;
      }
      return false;
    }
    case HostText: {
      const text = fiber.pendingProps;
      const textInstance = canHydrateTextInstance(nextInstance, text);
      if (textInstance !== null) {
        fiber.stateNode = (textInstance as TextInstance);
        return true;
      }
      return false;
    }
    // case SuspenseComponent: {
    //   if (enableSuspenseServerRenderer) {
    //     const suspenseInstance: null | SuspenseInstance = canHydrateSuspenseInstance(
    //       nextInstance,
    //     );
    //     if (suspenseInstance !== null) {
    //       const suspenseState: SuspenseState = {
    //         dehydrated: suspenseInstance,
    //         retryLane: OffscreenLane,
    //       };
    //       fiber.memoizedState = suspenseState;
    //       // Store the dehydrated fragment as a child fiber.
    //       // This simplifies the code for getHostSibling and deleting nodes,
    //       // since it doesn't have to consider all Suspense boundaries and
    //       // check if they're dehydrated ones or not.
    //       const dehydratedFragment = createFiberFromDehydratedFragment(
    //         suspenseInstance,
    //       );
    //       dehydratedFragment.return = fiber;
    //       fiber.child = dehydratedFragment;
    //       return true;
    //     }
    //   }
    //   return false;
    // }
    default:
      console.log('%c tryHydrate 这种类型的tag没有处理逻辑',  
      'color:blue;background:black;', fiber.tag)
      return false;
  }
}

function tryToClaimNextHydratableInstance(fiber: Fiber): void {
  if (!isHydrating) {
    return;
  }
  let nextInstance = nextHydratableInstance;
  // if (!nextInstance) {
  //   // Nothing to hydrate. Make it an insertion.
  //   insertNonHydratedInstance((hydrationParentFiber as any), fiber);
  //   isHydrating = false;
  //   hydrationParentFiber = fiber;
  //   return;
  // }
  const firstAttemptedInstance = nextInstance;
  if (!tryHydrate(fiber, nextInstance)) {
    // If we can't hydrate this instance let's try the next one.
    // We use this as a heuristic. It's based on intuition and not data so it
    // might be flawed or unnecessary.
    nextInstance = getNextHydratableSibling(firstAttemptedInstance);
    // if (!nextInstance || !tryHydrate(fiber, nextInstance)) {
    //   // Nothing to hydrate. Make it an insertion.
    //   insertNonHydratedInstance((hydrationParentFiber as any), fiber);
    //   isHydrating = false;
    //   hydrationParentFiber = fiber;
    //   return;
    // }
    // We matched the next one, we'll now assume that the first one was
    // superfluous and we'll delete it. Since we can't eagerly delete it
    // we'll have to schedule a deletion. To do that, this node needs a dummy
    // fiber associated with it.
    // deleteHydratableInstance(
    //   (hydrationParentFiber as any),
    //   firstAttemptedInstance,
    // );
  }
  hydrationParentFiber = fiber;
  nextHydratableInstance = getFirstHydratableChild((nextInstance as any));
}

function updateHostText(current: Fiber|null, workInProgress: Fiber) {
  // debugger
  if (current === null) {
    tryToClaimNextHydratableInstance(workInProgress);
  }
  // Nothing to do here. This is terminal. We'll do the completion step
  // immediately after.
  return null;
}

function updateHostRoot(current: Fiber | null, workInProgress: Fiber, renderLanes: number): Fiber|null {
  pushHostRootContext(workInProgress);
  const updateQueue = workInProgress.updateQueue;
  const nextProps = workInProgress.pendingProps;
  cloneUpdateQueue(current, workInProgress);
  processUpdateQueue(workInProgress, nextProps, null, renderLanes);
  const nextState = workInProgress.memoizedState;

  const root: FiberRoot = workInProgress.stateNode;

 

  // Caution: React DevTools currently depends on this property
  // being called "element".
  const nextChildren = nextState.element;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  // resetHydrationState();

  return workInProgress.child;
}


//判断新dom节点的children 是否为文本，是 ， 设置nextChildren为null;
// 原来的不是文本类型， 但现在是，将设置flag。 最后协调子节点。
function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
):Fiber|null {
    // debugger
    console.log(workInProgress.type,workInProgress.pendingProps)
    // 元素标签
    const type = workInProgress.type;
    // 新的属性
    const nextProps = workInProgress.pendingProps;
    // 旧的属性
    const prevProps = current !== null ? current.memoizedProps : null;
    // 更新的children 
    let nextChildren = nextProps ? nextProps.children : null;
    // 节点的子节点是否为纯文本？
    const isDirectTextChild = shouldSetTextContent(type, nextProps);

  // shouldSetTextContent  节点内容是否为纯的字符串
  // 内容为文本， 清空,下次beginwork， 将放回null, 结束该枝深度
  // 遍历
  if(isDirectTextChild) {
    nextChildren = null
  } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
    console.log(workInProgress.flags, ContentReset)
    workInProgress.flags |= ContentReset;
    // 更改为纯文本内容
  }
  // 当前这个存在问题 child返回null
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child
}



function placeSingleChild(newFiber: Fiber): Fiber {
  // This is simpler for the single child case. We only need to do a
  // placement for inserting new children.
  if (true && newFiber.alternate === null) { //TODO
    // 这里添加Placement标记在commit中使用
    newFiber.flags |= Placement;
  }
  return newFiber;
}




function deleteChild(returnFiber: Fiber, childToDelete: Fiber): void {
  // 首次渲染，无需删除，这是一个优化成分，暂时注释，之后处理
  // if (!shouldTrackSideEffects) {
  //   // Noop.
  //   return;
  // }
  // 获取父节点的deletion链， 将待删除元素放入
  const deletions = returnFiber.deletions;
  // 父元素之前没有deletions需要给flag添加一个标记
  if (deletions === null) {
    returnFiber.deletions = [childToDelete];
    returnFiber.flags |= ChildDeletion;
  } else {
    deletions.push(childToDelete);
  }
}

/*
  deleteRemainingChildren 循环调用了 deleteChild。
  deleteChild 用于删除单个节点，其实是为要删除的子节点们做 Deletion 标记，
  用于在 commit 阶段正式删。
*/
function deleteRemainingChildren(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
): null {
 
  let childToDelete = currentFirstChild;
  while (childToDelete !== null) {
    deleteChild(returnFiber, childToDelete);
    childToDelete = childToDelete.sibling;
  }
  return null;
}


//  备注：child 非空就是更新， 为空为新增。更新时，循环遍历子节点，(1)当key相同和对应类型符合时
//，分fragment, protal和其他情况，进行复用，并删除剩余节点。 key符合， 当类型不匹配时，
// 删除当前节点， (2) key和类型不匹配时，删除当前fiber。 在新增时，分frament 和其他情况创建
//fiber
function reconcileSingleElement(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  element: IReactElement,
  lanes: Lanes,
): Fiber {
  const key = element.key;
  let child = currentFirstChild;
  // 复用的时候，  初始化时 child： null不符合
  while(child !== null) {
    // 
    console.log('todo 复用', )
    child = null
  }
  const created = createFiberFromElement(element, returnFiber.mode, lanes);
  // created.ref = coerceRef(returnFiber, currentFirstChild, element);
  created.return = returnFiber;
  return created;

}

function reconcileSingleTextNode(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  textContent: string,
  lanes: Lanes,
): Fiber {
  // There's no need to check for keys on text nodes since we don't have a
  // way to define them.
  if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
    // We already have an existing node so let's just update it and delete
    // the rest.
    // 复用部分
  }
  // The existing first child is not a text node so we need to create one
  // and delete the existing ones.
  deleteRemainingChildren(returnFiber, currentFirstChild);
  const created = createFiberFromText(textContent, returnFiber.mode, lanes);
  created.return = returnFiber;
  return created;
}

function placeChild(
  newFiber: Fiber,
  lastPlacedIndex: number,
  newIndex: number,
): number {
  newFiber.index = newIndex;
  // if (!shouldTrackSideEffects) { TODO
  //   // Noop.
  //   return lastPlacedIndex;
  // }
  const current = newFiber.alternate;
  if (current !== null) {
    const oldIndex = current.index;
    if (oldIndex < lastPlacedIndex) {
      // This is a move.
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    } else {
      // This item can stay in place.
      return oldIndex;
    }
  } else {
    // This is an insertion.
    newFiber.flags |= Placement;
    return lastPlacedIndex;
  }
}

function reconcileChildrenArray( returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: Array<any>,
  lanes: Lanes):Fiber|null {
    let resultingFirstChild: Fiber | null = null;
    let previousNewFiber: Fiber | null = null;

    let oldFiber = currentFirstChild;
    let lastPlacedIndex = 0;
    let newIdx = 0;
    let nextOldFiber = null;
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      console.log('%c reconcileChildrenArray这个地方逻辑没写', 'color:blue;background:yellow;')
    }
    if (newIdx === newChildren.length) {
      // We've reached the end of the new children. We can delete the rest.
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    if (oldFiber === null) {
   
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(returnFiber, newChildren[newIdx], lanes);
        
        if (newFiber === null) {
          continue;
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          // TODO: Move out of the loop. This only happens for the first run.
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      console.log('批量创建Fiber', newChildren, resultingFirstChild)
      return resultingFirstChild;
    }

     // 执行到这里，表示上面两种情况都不符合，则代表有可能顺序换了或者有新增或删减
    // 其实第一个循环的break 基本就是到这了，因为key不同，肯定很少进入上边两个逻辑
    
    // Add all children to a key map for quick lookups.
    // 创建一个existingChildren代表所有剩余没有匹配掉的节点，
    // 然后新的数组根据key从这个 map 里面查找，如果有则复用，没有则新建
    // 这里提供了一个非常棒的思路，之后对比一些深度较大的diff可以采用这种方式，很高效
    const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

    // Keep scanning and use the map to restore deleted items as moves.
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        newChildren[newIdx],
        lanes,
      );
      if (newFiber !== null) {
        // if (shouldTrackSideEffects) {
        //   if (newFiber.alternate !== null) {
        //     // The new fiber is a work in progress, but if there exists a
        //     // current, that means that we reused the fiber. We need to delete
        //     // it from the child list so that we don't add it to the deletion
        //     // list.
        //     existingChildren.delete(
        //       newFiber.key === null ? newIdx : newFiber.key,
        //     );
        //   }
        // }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }

    // if (shouldTrackSideEffects) {
    //   // Any existing children that weren't consumed above were deleted. We need
    //   // to add them to the deletion list.
    //   existingChildren.forEach(child => deleteChild(returnFiber, child));
    // }

    return resultingFirstChild;
}

function mapRemainingChildren(
  returnFiber: Fiber,
  currentFirstChild: Fiber,
): Map<string | number, Fiber> {
  // Add the remaining children to a temporary map so that we can find them by
  // keys quickly. Implicit (null) keys get added to this set with their index
  // instead.
  const existingChildren: Map<string | number, Fiber> = new Map();

  let existingChild: Fiber|null = currentFirstChild;
  while (existingChild !== null) {
    if (existingChild.key !== null) {
      existingChildren.set(existingChild.key, existingChild);
    } else {
      existingChildren.set(existingChild.index, existingChild);
    }
    existingChild = existingChild.sibling;
  }
  return existingChildren;
}
// 这里改成这样命名是因为eslint会检索useXxx认为是一个hooks
function use_fiber(fiber: Fiber, pendingProps: mixed): Fiber {
  // We currently set sibling to null and index to 0 here because it is easy
  // to forget to do before returning it. E.g. for the single child case.
  
  const clone = createWorkInProgress(fiber, pendingProps);
  clone.index = 0;
  clone.sibling = null;
  return clone;
}


function updateTextNode(
  returnFiber: Fiber,
  current: Fiber | null,
  textContent: string,
  lanes: Lanes,
) {
  if (current === null || current.tag !== HostText) {
    // Insert
    const created = createFiberFromText(textContent, returnFiber.mode, lanes);
    created.return = returnFiber;
    return created;
  } else {
    // Update
    const existing = use_fiber(current, textContent);
    existing.return = returnFiber;
    return existing;
  }
}

function updateFromMap(
  existingChildren: Map<string | number, Fiber>,
  returnFiber: Fiber,
  newIdx: number,
  newChild: any,
  lanes: Lanes,
): Fiber | null {
  if (typeof newChild === 'string' || typeof newChild === 'number') {
    // Text nodes don't have keys, so we neither have to check the old nor
    // new node for the key. If both are text nodes, they match.
    const matchedFiber = existingChildren.get(newIdx) || null;
    return updateTextNode(returnFiber, matchedFiber, '' + newChild, lanes);
  }

  if (typeof newChild === 'object' && newChild !== null) {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE: {
        const matchedFiber =
          existingChildren.get(
            newChild.key === null ? newIdx : newChild.key,
          ) || null;
        return updateElement(returnFiber, matchedFiber, newChild, lanes);
      }
      
    
    }

    // if (isArray(newChild) || getIteratorFn(newChild)) {
    //   const matchedFiber = existingChildren.get(newIdx) || null;
    //   return updateFragment(returnFiber, matchedFiber, newChild, lanes, null);
    // }

    // throwOnInvalidObjectType(returnFiber, newChild);
  }

  

  return null;
}
function updateElement(
  returnFiber: Fiber,
  current: Fiber | null,
  element: IReactElement,
  lanes: Lanes,
): Fiber {
  const elementType = element.type;
  // if (elementType === REACT_FRAGMENT_TYPE) {
    
  // }
  if (current !== null) {
    if (
      current.elementType === elementType  
    ) {
      // Move based on index
      const existing = use_fiber(current, element.props);
      // existing.ref = coerceRef(returnFiber, current, element);
      existing.return = returnFiber;
      
      return existing;
    }
  }
  // Insert
  const created = createFiberFromElement(element, returnFiber.mode, lanes);
  // created.ref = coerceRef(returnFiber, current, element);
  created.return = returnFiber;
  return created;
}


// 协调fiber 对应的子fibler的函数
function  mountChildFibers (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any,
  lanes: Lanes,
): Fiber | null {
  // debugger
  // 根据 newChild的类型来分别处理
  console.log(newChild)
  // 对象
  // debugger
  const isObject = typeof newChild === 'object' && newChild !== null; // 单个对象
  if(isObject) {
    switch(newChild.$$typeof) { // $$typeof眼熟么 去看看createElement
      case REACT_ELEMENT_TYPE:  // elementtype
      return placeSingleChild(
                  reconcileSingleElement(
                    returnFiber,  // 父fiber
                    currentFirstChild,  // 子fiber current 
                    newChild, // child
                    lanes, // 
                  ),
            );
    }
  }


  // string number

  if (typeof newChild === 'string' || typeof newChild === 'number') {
    return placeSingleChild(
              reconcileSingleTextNode(
                returnFiber,
                currentFirstChild,
                '' + newChild,
                lanes,
              ),
    );
  }

  // Array
  if (isArray(newChild)) {
    return reconcileChildrenArray(
      returnFiber,
      currentFirstChild,
      newChild,
      lanes,
    );
  }

  return null;

}
const reconcileChildFibers = mountChildFibers
/*
  1. reconcileChildren 中，处理了三种情况，第一种是子节点为 object，第二种是子节点为字符串或者是数字，第三种是子节点为 array。

  2. 新的子节点为 object，遍历老的 children，找到和新的 children 中第一个 key 和节点类型相同的节点，直接复用这个节点，删除老节点中其余节点。

  3. 新的子节点为字符串或者是数字，找老的children中的第一个节点，如果是文字节点就复用。

  4. reconcileChildren 过程中，并没有真正的删除节点，而是给节点做标记，后续 Commit 阶段完成真正删除，这样的好处就是抽取除了公共的平台无关的逻辑，相当于AST，代码纯粹，可移植性很强。

  5. React 的 Fiber 对象的复用，其实是复用了 alternate，并没有真正的创建一个新对象，current 和 alternate 对象交替使用，不用重复创建资源。

*/
export function reconcileChildren(current: Fiber | null,workInProgress: Fiber,nextChildren: any, 
renderLanes: Lanes,) {
  
  if(current === null) {
    //
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes,
    );
  } else {
    //
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes,
    );
  }

}

// 处理更新队列
export function processUpdateQueue<State>(
  workInProgress: Fiber,
  props: any,
  instance: any,
  renderLanes: Lanes,
): void {
  /*
  整理updateQueue。由于优先级的原因，会使得低优先级更新被跳过等待下次执行，这个过程中，
  又有可能产生新的update。所以当处理某次更新的时候，有可能会有两条update队列：
  上次遗留的和本次新增的。上次遗留的就是从firstBaseUpdate 到 lastBaseUpdate 
  之间的所有update；本次新增的就是新产生的那些的update。
  准备阶段阶段主要是将两条队列合并起来，并且合并之后的队列不再是环状的，目的方便从头到尾遍历处理。
  另外，由于以上的操作都是处理的workInProgress节点的updateQueue，所以还需要在current节点也操作一遍，
  保持同步，目的在渲染被高优先级的任务打断后，再次以current节点为原型新建workInProgress节点时，
  不会丢失之前尚未处理的update。
  */
  const queue: UpdateQueue<State> = (workInProgress.updateQueue);
  let pendingQueue = queue.shared.pending;

  let firstBaseUpdate = queue.firstBaseUpdate; // 设置firstBaseUpdate


  if (pendingQueue !== null) {
    queue.shared.pending = null;

    // The pending queue is circular. Disconnect the pointer between first
    // and last so that it's non-circular.
    const lastPendingUpdate = pendingQueue;
    let lastBaseUpdate = queue.lastBaseUpdate;
   
 
    const firstPendingUpdate = lastPendingUpdate.next;
    lastPendingUpdate.next = null;
    // Append pending updates to base queue
    if (lastBaseUpdate === null) {
      firstBaseUpdate = firstPendingUpdate;
    } else {
      lastBaseUpdate.next = firstPendingUpdate;
    }
    lastBaseUpdate = lastPendingUpdate;

    // If there's a current queue, and it's different from the base queue, then
    // we need to transfer the updates to that queue, too. Because the base
    // queue is a singly-linked list with no cycles, we can append to both
    // lists and take advantage of structural sharing.
    // TODO: Pass `current` as argument
    const current = workInProgress.alternate;
    if (current !== null) {
      // This is always non-null on a ClassComponent or HostRoot
      const currentQueue: UpdateQueue<State> = (current.updateQueue);
      const currentLastBaseUpdate = currentQueue.lastBaseUpdate;
      if (currentLastBaseUpdate !== lastBaseUpdate) {
        if (currentLastBaseUpdate === null) {
          currentQueue.firstBaseUpdate = firstPendingUpdate;
        } else {
          currentLastBaseUpdate.next = firstPendingUpdate;
        }
        currentQueue.lastBaseUpdate = lastPendingUpdate;
      }
    }
  }
 
   // 至此，新队列已经合并到遗留队列上，firstBaseUpdate作为
 // 这个新合并的队列，会被循环处理
 // 处理阶段-------------------------------------
  if(firstBaseUpdate !== null) {
    let newState = queue.baseState;
  
    let newLanes = NoLanes;

    let newBaseState:Update<State> | null = null ;
    let newFirstBaseUpdate: Update<State> |null = null
    let newLastBaseUpdate:Update<State> | null = null;

    let update:Update<State> | null = firstBaseUpdate;
    do {
      const updateLane = update.lane;
      const updateEventTime = update.eventTime;
       // isSubsetOfLanes函数的意义是，判断当前更新的优先级（updateLane）
     // 是否在渲染优先级（renderLanes）中如果不在，那么就说明优先级不足
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        // Priority is insufficient. Skip this update. If this is the first
        // skipped update, the previous update/state is the new base
        // update/state.
        const clone: Update<State> = {
          eventTime: updateEventTime,
          lane: updateLane,

          tag: update.tag,
          payload: update.payload,
          callback: update.callback,

          next: null,
        };
         // 优先级不足，将update添加到本次的baseUpdate队列中
        if (newLastBaseUpdate === null) {
          newFirstBaseUpdate = newLastBaseUpdate = clone;
          // newBaseState 更新为前一个 update 任务的结果，下一轮
        // 持有新优先级的渲染过程处理更新队列时，将会以它为基础进行计算。
          newBaseState = newState as any;
        } else {
          // 如果baseUpdate队列中已经有了update，那么将当前的update
       // 追加到队列尾部
          newLastBaseUpdate.next = clone;
          newLastBaseUpdate = clone
        }
          /* *
      * newLanes会在最后被赋值到workInProgress.lanes上，而它又最终
      * 会被收集到root.pendingLanes。
      *  再次更新时会从root上的pendingLanes中找出渲染优先级（renderLanes），
      * renderLanes含有本次跳过的优先级，再次进入processUpdateQueue时，
      * update的优先级符合要求，被更新掉，低优先级任务因此被重做
      * */
        // Update the remaining priority in the queue.
        newLanes = mergeLanes(newLanes, updateLane);
      } else {
        // This update does have sufficient priority.
          // 进到这个判断说明现在处理的这个update在优先级不足的update之后，
     // 原因有二：
     // 第一，优先级足够；
     // 第二，newLastBaseUpdate不为null说明已经有优先级不足的update了
     // 然后将这个高优先级放入本次的baseUpdate，实现之前提到的从updateQueue中
     // 截取低优先级update到最后一个update
        if (newLastBaseUpdate !== null) {
          const clone: Update<State> = {
            eventTime: updateEventTime,
            // This update is going to be committed so we never want uncommit
            // it. Using NoLane works because 0 is a subset of all bitmasks, so
            // this will never be skipped by the check above.
            lane: NoLane,

            tag: update.tag,
            payload: update.payload,
            callback: update.callback,

            next: null,
          };
          newLastBaseUpdate.next = clone;
          newLastBaseUpdate = clone
        }


        // Process this update.
        newState = getStateFromUpdate(
          workInProgress,
          queue,
          update,
          newState,
          props,
          instance,
        );
        const callback = update.callback;
        if (callback !== null) {
          workInProgress.flags |= Callback;
          const effects = queue.effects;
          if (effects === null) {
            queue.effects = [update];
          } else {
            effects.push(update);
          }
        }
      }
      update = update.next;
      if (update === null) {
        pendingQueue = queue.shared.pending;
        if (pendingQueue === null) {
          break;
        } else {
          // An update was scheduled from inside a reducer. Add the new
          // pending updates to the end of the list and keep processing.
          const lastPendingUpdate = pendingQueue;
          // Intentionally unsound. Pending updates form a circular list, but we
          // unravel them when transferring them to the base queue.
          const firstPendingUpdate = (lastPendingUpdate.next as Update<State>);
          lastPendingUpdate.next = null;
          update = firstPendingUpdate;
          queue.lastBaseUpdate = lastPendingUpdate;
          queue.shared.pending = null;
        }
      }
    } while (true);

    if (newLastBaseUpdate === null) {
      newBaseState = newState as any;
    }

    queue.baseState = (newBaseState  as any);
    queue.firstBaseUpdate = newFirstBaseUpdate;
    queue.lastBaseUpdate = newLastBaseUpdate;

    // Interleaved updates are stored on a separate queue. We aren't going to
    // process them during this render, but we do need to track which lanes
    // are remaining.
    const lastInterleaved = queue.shared.interleaved;
    if (lastInterleaved !== null) {
      let interleaved = lastInterleaved;
      do {
        newLanes = mergeLanes(newLanes, interleaved.lane);
        interleaved = ((interleaved).next as Update<State>);
      } while (interleaved !== lastInterleaved);
    } else if (firstBaseUpdate === null) {
      // `queue.lanes` is used for entangling transitions. We can set it back to
      // zero once the queue is empty.
      queue.shared.lanes = NoLanes;
    }

    markSkippedUpdateLanes(newLanes);
    workInProgress.lanes = newLanes;
    workInProgress.memoizedState = newState;
  }
  
}

export const UpdateState = 0;
export const ReplaceState = 1;
export const ForceUpdate = 2;
export const CaptureUpdate = 3;
function getStateFromUpdate<State>(
  workInProgress: Fiber,
  queue: UpdateQueue<State>,
  update: Update<State>,
  prevState: State,
  nextProps: any,
  instance: any,
): any {
  switch (update.tag) {
    case ReplaceState: {
      const payload = update.payload;
      if (typeof payload === 'function') {
        // Updater function
  
        const nextState = payload.call(instance, prevState, nextProps);
        return nextState;
      }
      // State object
      return payload;
    }
    case CaptureUpdate: {
      workInProgress.flags =
        (workInProgress.flags & ~ShouldCapture) | DidCapture;
      break
    }
    // Intentional fallthrough
    case UpdateState: {
      const payload = update.payload;
      let partialState;
      if (typeof payload === 'function') {
        // Updater function
       
        partialState = payload.call(instance, prevState, nextProps);
      
      } else {
        // Partial state object
        partialState = payload;
      }
      if (partialState === null || partialState === undefined) {
        // Null and undefined are treated as no-ops.
        return prevState;
      }
      // Merge the partial state and the previous state.
      return Object.assign({}, prevState, partialState);
    }
    case ForceUpdate: {
      // hasForceUpdate = true;
      return prevState;
    }
    default:
     return prevState;
  }
 

}

import { Fiber, Lanes, Update, UpdateQueue,
  FiberRoot, Placement,Container,
   ShouldCapture, DidCapture, StackCursor,
   HydratableInstance,Instance,TextInstance,
   IndeterminateComponent,
  TypeOfMode,ChildDeletion, HostText,HostComponent,
  ContentReset, REACT_ELEMENT_TYPE, IReactElement, HostRoot } from '../type/index'
import { shouldSetTextContent } from '../reactDom/tools'
import {  createFiberFromTypeAndProps, createFiberFromText } from '../reactDom/create'
import { createCursor, push, pop, rootInstanceStackCursor, NoContextT, NO_CONTEXT } from './fiberStack'
import { } from './tools'
import { getRootHostContext } from '../reactDom/context'
import { createChild } from '../reactDom/create'
import { mountIndeterminateComponent} from './functionComponent'
import { canHydrateInstance, canHydrateTextInstance, getNextHydratableSibling, getFirstHydratableChild } from '../reactDom/instance'
const isArray = Array.isArray;
let didReceiveUpdate: boolean = false;
export const disableLegacyContext = false;

export function markWorkInProgressReceivedUpdate() {
  didReceiveUpdate = true;
}

export function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {

 
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
    case HostText:
      return updateHostText(current, workInProgress);
    
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

export const emptyContextObject = {};
const contextStackCursor: StackCursor<Object> = createCursor(
  emptyContextObject,
);
const didPerformWorkStackCursor: StackCursor<boolean> = createCursor(false);

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
let hydrationParentFiber: null | Fiber = null;
const isHydrating = false;
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
    newFiber.flags |= Placement;
  }
  return newFiber;
}


function createFiberFromElement(element: IReactElement,
  mode: TypeOfMode,
  lanes: Lanes,): Fiber {
  const owner = null;
  const type = element.type;
  const key = element.key;
  const pendingProps = element.props;
  const fiber = createFiberFromTypeAndProps(
    type,
    key,
    pendingProps,
    owner,
    mode,
    lanes,
  );
  return fiber
}

function deleteChild(returnFiber: Fiber, childToDelete: Fiber): void {
  // if (!shouldTrackSideEffects) {
  //   // Noop.
  //   return;
  // }
  const deletions = returnFiber.deletions;
  if (deletions === null) {
    returnFiber.deletions = [childToDelete];
    returnFiber.flags |= ChildDeletion;
  } else {
    deletions.push(childToDelete);
  }
}


function deleteRemainingChildren(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
): null {
  // if (!shouldTrackSideEffects) {
  //   // Noop.
  //   return null;
  // }

  // TODO: For the shouldClone case, this could be micro-optimized a bit by
  // assuming that after the first child we've already added everything.
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
      console.log('%c currentFirstChild这个地方逻辑没写', 'color:blue;background:yellow;')
    }
    if (newIdx === newChildren.length) {
      // We've reached the end of the new children. We can delete the rest.
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    if (oldFiber === null) {
      // If we don't have any more existing children we can choose a fast path
      // since the rest will all be insertions.
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
    return resultingFirstChild;
}

// 协调fiber 对应的子fibler的函数
function  mountChildFibers (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any,
  lanes: Lanes,
): Fiber | null {

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
   // 更新队列
  // 这在ClassComponent或HostRoot上总是非空。
  const queue: UpdateQueue<State> = (workInProgress.updateQueue);
  let pendingQueue = queue.shared.pending;
   // 更新队列
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
 

  if(firstBaseUpdate !== null) {
    let newState = queue.baseState;
    let update = firstBaseUpdate;
    // Process this update.
    newState = getStateFromUpdate(
      workInProgress,
      queue,
      update,
      newState,
      props,
      instance,
    );
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

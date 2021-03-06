import { Fiber, Lanes, Update, UpdateQueue,
  FiberRoot, Placement,Container,
   ShouldCapture, DidCapture, StackCursor,
   HydratableInstance,Instance,TextInstance,
   IndeterminateComponent,
  TypeOfMode,ChildDeletion, HostText,HostComponent,
  ContentReset, REACT_ELEMENT_TYPE, IReactElement, HostRoot, mixed, FunctionComponent } from '../type/index'
import { shouldSetTextContent } from '../reactDom/tools'
import {  createFiberFromElement, createFiberFromText } from '../reactDom/create'
import { createCursor, push, pop, rootInstanceStackCursor, NoContextT, NO_CONTEXT } from './fiberStack'
import { } from './tools'
import { getRootHostContext } from '../reactDom/context'
import { createChild } from '../reactDom/create'
import { mountIndeterminateComponent} from './functionComponent'
import { canHydrateInstance, canHydrateTextInstance, getNextHydratableSibling, getFirstHydratableChild } from '../reactDom/instance'
import { createWorkInProgress } from './commit'
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
    // case FunctionComponent: {
    //   const Component = workInProgress.type;
    //   const unresolvedProps = workInProgress.pendingProps;
    //   const resolvedProps =
    //     workInProgress.elementType === Component
    //       ? unresolvedProps
    //       : resolveDefaultProps(Component, unresolvedProps);
    //   return updateFunctionComponent(
    //     current,
    //     workInProgress,
    //     Component,
    //     resolvedProps,
    //     renderLanes,
    //   );
    // }
    default:
      console.log('%c beginWork ???????????????tag??????????????????',  
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
      console.log('%c tryHydrate ???????????????tag??????????????????',  
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


//?????????dom?????????children ????????????????????? ??? ??????nextChildren???null;
// ?????????????????????????????? ????????????????????????flag??? ????????????????????????
function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
):Fiber|null {
    // debugger
    console.log(workInProgress.type,workInProgress.pendingProps)
    // ????????????
    const type = workInProgress.type;
    // ????????????
    const nextProps = workInProgress.pendingProps;
    // ????????????
    const prevProps = current !== null ? current.memoizedProps : null;
    // ?????????children 
    let nextChildren = nextProps ? nextProps.children : null;
    // ???????????????????????????????????????
    const isDirectTextChild = shouldSetTextContent(type, nextProps);

  // shouldSetTextContent  ????????????????????????????????????
  // ?????????????????? ??????,??????beginwork??? ?????????null, ??????????????????
  // ??????
  if(isDirectTextChild) {
    nextChildren = null
  } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
    console.log(workInProgress.flags, ContentReset)
    workInProgress.flags |= ContentReset;
    // ????????????????????????
  }
  // ???????????????????????? child??????null
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




function deleteChild(returnFiber: Fiber, childToDelete: Fiber): void {
  // ????????????????????????????????????????????????????????????????????????????????????
  // if (!shouldTrackSideEffects) {
  //   // Noop.
  //   return;
  // }
  // ??????????????????deletion?????? ????????????????????????
  const deletions = returnFiber.deletions;
  // ?????????????????????deletions?????????flag??????????????????
  if (deletions === null) {
    returnFiber.deletions = [childToDelete];
    returnFiber.flags |= ChildDeletion;
  } else {
    deletions.push(childToDelete);
  }
}

/*
  deleteRemainingChildren ??????????????? deleteChild???
  deleteChild ?????????????????????????????????????????????????????????????????? Deletion ?????????
  ????????? commit ??????????????????
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


//  ?????????child ????????????????????? ??????????????????????????????????????????????????????(1)???key??????????????????????????????
//??????fragment, protal????????????????????????????????????????????????????????? key????????? ????????????????????????
// ????????????????????? (2) key????????????????????????????????????fiber??? ??????????????????frament ?????????????????????
//fiber
function reconcileSingleElement(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  element: IReactElement,
  lanes: Lanes,
): Fiber {
  const key = element.key;
  let child = currentFirstChild;
  // ??????????????????  ???????????? child??? null?????????
  while(child !== null) {
    // 
    console.log('todo ??????', )
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
    // ????????????
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
      console.log('%c reconcileChildrenArray????????????????????????', 'color:blue;background:yellow;')
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
      console.log('????????????Fiber', newChildren, resultingFirstChild)
      return resultingFirstChild;
    }

     // ???????????????????????????????????????????????????????????????????????????????????????????????????????????????
    // ????????????????????????break ??????????????????????????????key?????????????????????????????????????????????
    
    // Add all children to a key map for quick lookups.
    // ????????????existingChildren?????????????????????????????????????????????
    // ????????????????????????key????????? map ???????????????????????????????????????????????????
    // ???????????????????????????????????????????????????????????????????????????diff????????????????????????????????????
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
// ?????????????????????????????????eslint?????????useXxx???????????????hooks
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


// ??????fiber ????????????fibler?????????
function  mountChildFibers (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any,
  lanes: Lanes,
): Fiber | null {
  debugger
  // ?????? newChild????????????????????????
  console.log(newChild)
  // ??????
  // debugger
  const isObject = typeof newChild === 'object' && newChild !== null; // ????????????
  if(isObject) {
    switch(newChild.$$typeof) { // $$typeof????????? ?????????createElement
      case REACT_ELEMENT_TYPE:  // elementtype
      return placeSingleChild(
                  reconcileSingleElement(
                    returnFiber,  // ???fiber
                    currentFirstChild,  // ???fiber current 
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
  1. reconcileChildren ?????????????????????????????????????????????????????? object?????????????????????????????????????????????????????????????????????????????? array???

  2. ?????????????????? object??????????????? children?????????????????? children ???????????? key ?????????????????????????????????????????????????????????????????????????????????????????????

  3. ??????????????????????????????????????????????????????children?????????????????????????????????????????????????????????

  4. reconcileChildren ?????????????????????????????????????????????????????????????????????????????? Commit ??????????????????????????????????????????????????????????????????????????????????????????????????????AST???????????????????????????????????????

  5. React ??? Fiber ???????????????????????????????????? alternate?????????????????????????????????????????????current ??? alternate ????????????????????????????????????????????????

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

// ??????????????????
export function processUpdateQueue<State>(
  workInProgress: Fiber,
  props: any,
  instance: any,
  renderLanes: Lanes,
): void {
   // ????????????
  // ??????ClassComponent???HostRoot??????????????????
  const queue: UpdateQueue<State> = (workInProgress.updateQueue);
  let pendingQueue = queue.shared.pending;
   // ????????????
  let firstBaseUpdate = queue.firstBaseUpdate; // ??????firstBaseUpdate
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

import { Fiber, Lanes, Update, UpdateQueue,
  FiberRoot, Placement,
   ShouldCapture, DidCapture,
  TypeOfMode,ChildDeletion, HostText,HostComponent, 
  ContentReset, REACT_ELEMENT_TYPE, IReactElement, HostRoot } from '../type/index'
import { shouldSetTextContent } from '../reactDom/tools'
import {  createFiberFromTypeAndProps, createFiberFromText } from '../reactDom/create'

const isArray = Array.isArray;

export function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {

  console.log('beginWork')
  switch(workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress, renderLanes);
    case HostComponent: 
      return updateHostComponent(current, workInProgress, renderLanes)
  }
  return null
}


function updateHostRoot(current: Fiber | null, workInProgress: Fiber, renderLanes: number): Fiber|null {
  
  const nextProps = workInProgress.pendingProps;
  // cloneUpdateQueue(current, workInProgress);
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
function reconcileChildren(current: Fiber | null,workInProgress: Fiber,nextChildren: any, 
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

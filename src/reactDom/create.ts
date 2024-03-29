import { RootOptions, RootType, Container, HostText,REACT_ELEMENT_TYPE,IReactElement,
  LegacyRoot, RootTag, FiberRoot, NoFlags,Lanes,HostComponent,ProfileMode,
  ClassComponent,
  Fiber, WorkTag, TypeOfMode, BlockingRoot, NoMode, Cache,IndeterminateComponent,
  HostRoot, ConcurrentRoot, ConcurrentMode, BlockingMode, LaneMap, Interaction, LanePriority}  from '../type/index'
import { markContainerAsRoot  } from './tools'
import { initializeUpdateQueue } from './update'
import { NoLanes, createLaneMap, NoLanePriority } from './lane'
import { createWorkInProgress } from '../reconcile/commit';
import { enableProfilerTimer, enableSchedulerTracing } from '../type/constant';
import { unstable_getThreadID } from "../scheduler";
import { NoTimestamp } from './workInprogress';

// 创建mode是LegacyRoot的根节点
export function createLegacyRoot(
  container: Container,
  options?: RootOptions,
): RootType {

  return new ReactDOMBlockingRoot(container, LegacyRoot, options);
}
class ReactDOMBlockingRoot {
  _internalRoot
  render: any
  unmount: any
  constructor(
    container: Container,
    tag: RootTag,
    options: void | RootOptions,
  ) {
    this._internalRoot = createRootImpl(container, tag, options);
  }
}





/**  * 创建并返回一个fiberRoot  
 *   调用createContainer 产生root  调用markContainerAsRoot标记root并且返回root节点， 插入所有event
* @param container DOM容器  
* @param tag fiberRoot节点的标记(LegacyRoot、BatchedRoot、ConcurrentRoot)  
* @param options 配置信息，只有在hydrate时才有值，否则为undefined  
* @returns {*}  */
export function createRootImpl( container: Container,tag: RootTag, options: void | RootOptions,) {
    const hydrate = options != null && options.hydrate === true;
    const hydrationCallbacks = (options != null && options.hydrationOptions) || null;
    const strictModeLevelOverride = options != null && options.unstable_strictModeLevel != null
      ? options.unstable_strictModeLevel
      : null;
    const root = createContainer(
      container,
      tag,
      hydrate,
      hydrationCallbacks,
      strictModeLevelOverride,
    );
    // 在container上挂上这个根节点'__reactContainer$' + randomKey;
    markContainerAsRoot(root.current, container)
    //TODO events

    return root
}

/**  
* 内部调用createFiberRoot方法返回一个fiberRoot实例  
* @param containerInfo DOM容器  
* @param tag fiberRoot节点的标记(LegacyRoot、BatchedRoot、ConcurrentRoot)  
* @param hydrate 判断是否是hydrate模式  
* @param hydrationCallbacks 只有在hydrate模式时才可能有值，该对象包含两个可选的方法：onHydrated和onDeleted  
* @returns {FiberRoot}  
*/
export function createContainer(
  containerInfo: Container,
  tag: RootTag,
  hydrate: boolean,
  hydrationCallbacks: null | any,
  strictModeLevelOverride: null | number,
): FiberRoot {
  return createFiberRoot(
   {
    containerInfo,
    tag,
    hydrate,
    hydrationCallbacks,
    strictModeLevelOverride,
   }
  );
}

interface ICreateFiberRoot {
  containerInfo: Container, // 根dom节点
  tag: RootTag,  // LegacyRoot
  hydrate: boolean,
  hydrationCallbacks: null | any,
  strictModeLevelOverride: null | number,
}

/**
 * 
 * @param props 
 * @returns 
 * 创建Fiberroot 并且创建一个rootFiber 并且初始化updateQueue
 */
export function createFiberRoot(props: ICreateFiberRoot): FiberRoot {
  const {  containerInfo, tag, hydrate, strictModeLevelOverride  } = props;
  const root: FiberRoot = (new FiberRootNode(containerInfo, tag, hydrate));

  // Cyclic construction. This cheats the type system right now because
  // stateNode is any.
  const uninitializedFiber = createHostRootFiber(tag, strictModeLevelOverride);
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;

  const enableCache = true; // todo
  if (enableCache) {
    const initialCache = new Map();
    root.pooledCache = initialCache;
    const initialState = {
      element: null,
      cache: initialCache,
    };
    uninitializedFiber.memoizedState = initialState;
  } else {
    const initialState = {
      element: null,
    };
    uninitializedFiber.memoizedState = initialState;
  }

  initializeUpdateQueue(uninitializedFiber);

  return root
}

class FiberRootNode implements FiberRoot {
  current: Fiber|null;
  tag: RootTag;
  containerInfo: any;
  hydrate: boolean;
  pooledCache: Cache | null;
  context: Object | null;
  pendingContext: Object | null;
  pendingLanes: number;
  pingedLanes: number;
  suspendedLanes: number;
  expiredLanes: number;
  mutableReadLanes: number;
  eventTimes: LaneMap<number>;
  finishedWork: Fiber | null;
  finishedLanes: number;
  entangledLanes: number;
  entanglements: LaneMap<number>;
  constructor(containerInfo: Container, tag: RootTag, hydrate: boolean) {
    this.current = null;
    this.tag = tag;
    this.containerInfo = containerInfo;
    // this.pendingChildren = null;
    // this.current = null;
    // this.pingCache = null;
    this.finishedWork = null;
    // this.timeoutHandle = noTimeout;
    this.pendingLanes = NoLanes;
    this.suspendedLanes = NoLanes;
    this.pingedLanes = NoLanes;
    this.expiredLanes = NoLanes;
    this.mutableReadLanes = NoLanes;
    this.finishedLanes = NoLanes;
  
    this.entangledLanes = NoLanes;
    this.entanglements = createLaneMap(NoLanes);
    this.eventTimes = createLaneMap(NoLanes);
    this.context = null;
    this.pendingContext = null;
    this.pooledCache = null;
    this.hydrate = hydrate;
    if (enableSchedulerTracing) {

      this.interactionThreadID = unstable_getThreadID();
      this.memoizedInteractions = new Set();
      this.pendingInteractionMap = new Map();
    } else { // todo
      this.interactionThreadID = 0;
      this.memoizedInteractions = new Set();
      this.pendingInteractionMap = new Map();
    }
    this.eventTimes = createLaneMap(NoLanes);
    this.expirationTimes = createLaneMap(NoTimestamp);
    this.callbackPriority = NoLanePriority;

  }
  callbackNode: any;
  callbackPriority: LanePriority;
  expirationTimes: LaneMap<number>;
  interactionThreadID: number;
  memoizedInteractions: Set<Interaction>;
  pendingInteractionMap: Map<number, Set<Interaction>>;
  timeoutHandle: any;
  
 
  
}
export const createFiber = function(
  tag: WorkTag,
  pendingProps: any,
  key: null | string,
  mode: TypeOfMode,
): Fiber {
  // $FlowFixMe: the shapes are exact here but Flow doesn't like constructors
  return new FiberNode(tag, pendingProps, key, mode);
};

export function createHostRootFiber(
  tag: RootTag,
  strictModeLevelOverride: null | number,
): Fiber {
  // 处理mode
  let mode:number;
  if(tag === ConcurrentRoot) {
    mode = ConcurrentMode | BlockingMode;
  } else if (tag === BlockingRoot){
    mode = BlockingMode;
  } else {
    mode = NoMode;
  }
  if( enableProfilerTimer){
    mode |= ProfileMode;
  }
  
  return createFiber(HostRoot, null, null, mode);
}

class FiberNode implements Fiber {
  tag: WorkTag;
  stateNode: any;
  return: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  index: number;
  mode: number;
  memoizedState: any;
  updateQueue: any;
  alternate: Fiber | null;
  type: any;
  pendingProps: any;
  memoizedProps: any;
  flags: number;
  dependencies: any;
  actualDuration: number;
  actualStartTime: number;
  selfBaseDuration: number;
  treeBaseDuration: number;
  constructor (
    tag: WorkTag,
    pendingProps: any,
    key: null | string,
    mode: TypeOfMode,
  ) {

    this.tag = tag;
    this.stateNode = null;
    this.return = null;
    this.child = null;
    this.sibling = null;
    this.index = 0;
    this.mode = mode;
    this.alternate = null;
    this.flags = NoFlags
    this.lanes = NoLanes;
    this.childLanes = NoLanes;
    this.deletions = null
    this.key = null;
    this.subtreeFlags = 0
    this.pendingProps = pendingProps
    this.dependencies = null;
    this.memoizedProps = null;
    this.updateQueue = null;
    this.memoizedState = null;
    this.dependencies = null;
    this.actualDuration = Number.NaN;
    this.actualStartTime = Number.NaN;
    this.selfBaseDuration = Number.NaN;
    this.treeBaseDuration = Number.NaN;

    if (enableProfilerTimer) {
    this.actualDuration = 0;
    this.actualStartTime = -1;
    this.selfBaseDuration = 0;
    this.treeBaseDuration = 0;
    }
    
  }
  subtreeFlags: number;
  key: string | null;
  deletions: Fiber[] | null;
  lanes: number;
  childLanes: number;
  elementType: any;
}

function shouldConstruct(Component: Function) {
  const prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}

export function createFiberFromTypeAndProps(
  type: any, // React$ElementType
  key: null | string,
  pendingProps: any,
  owner: null | Fiber,
  mode: TypeOfMode,
  lanes: Lanes,
): Fiber {

  let fiberTag: WorkTag = IndeterminateComponent;
  let resolvedType = type;
  // debugger
  if (typeof type === 'function') {
    if (shouldConstruct(type)) {
      fiberTag = ClassComponent;
      
    } else {
     //
    }
  } else if (typeof type === 'string') {
    fiberTag = HostComponent;
  } else {
    console.log('%c createFiberFromTypeAndProps出现了新类型未处理', 'color:blue;background:red;')
  }
 
  const fiber = createFiber(fiberTag, pendingProps, key, mode);
  fiber.elementType = type;
  fiber.type = resolvedType;
  fiber.lanes = lanes;

  return fiber;
}

export function createFiberFromText(
  content: string,
  mode: TypeOfMode,
  lanes: Lanes,
): Fiber {
  const fiber = createFiber(HostText, content, null, mode);
  fiber.lanes = lanes;
  return fiber;
}

export function createFiberFromElement(
  element: IReactElement,
  mode: TypeOfMode,
  lanes: Lanes,
): Fiber {
  let owner = null;

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

  return fiber;
}

export function createChild(
  returnFiber: Fiber,
  newChild: any,
  lanes: Lanes,
): Fiber | null {
  if (typeof newChild === 'string' || typeof newChild === 'number') {
    // Text nodes don't have keys. If the previous node is implicitly keyed
    // we can continue to replace it without aborting even if it is not a text
    // node.
    const created = createFiberFromText(
      '' + newChild,
      returnFiber.mode,
      lanes,
    );
    created.return = returnFiber;
    return created;
  }

  if (typeof newChild === 'object' && newChild !== null) {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE: {
        const created = createFiberFromElement(
          newChild,
          returnFiber.mode,
          lanes,
        );
        // created.ref = coerceRef(returnFiber, null, newChild);
        created.return = returnFiber;
        return created;
      }
      // case REACT_PORTAL_TYPE: {
      //   // const created = createFiberFromPortal(
      //   //   newChild,
      //   //   returnFiber.mode,
      //   //   lanes,
      //   // );
      //   // created.return = returnFiber;
      //   // return created;
      //   break;
      // }
      // case REACT_LAZY_TYPE: {
      //   // if (enableLazyElements) {
      //   //   const payload = newChild._payload;
      //   //   const init = newChild._init;
      //   //   return createChild(returnFiber, init(payload), lanes);
      //   // }
      // }
    }

    // if (isArray(newChild) || getIteratorFn(newChild)) {
    //   const created = createFiberFromFragment(
    //     newChild,
    //     returnFiber.mode,
    //     lanes,
    //     null,
    //   );
    //   created.return = returnFiber;
    //   return created;
    // }

    // throwOnInvalidObjectType(returnFiber, newChild);
  }

  return null;
}


export function cloneChildFibers(
  current: Fiber | null,
  workInProgress: Fiber,
): void {

  if (workInProgress.child === null) {
    return;
  }
  let currentChild = workInProgress.child;
  let newChild = createWorkInProgress(currentChild, currentChild.pendingProps);
  workInProgress.child = newChild;

  newChild.return = workInProgress;
  while (currentChild.sibling !== null) {
    currentChild = currentChild.sibling;
    newChild = newChild.sibling = createWorkInProgress(
      currentChild,
      currentChild.pendingProps,
    );
    newChild.return = workInProgress;
  }
  newChild.sibling = null;
}
import { RootOptions, RootType, Container, 
  LegacyRoot, RootTag, FiberRoot, 
  Fiber, WorkTag, TypeOfMode, BlockingRoot, NoMode, Cache,
  HostRoot, ConcurrentRoot, ConcurrentMode, BlockingMode}  from '../type/index'
import { markContainerAsRoot  } from './tools'
import { initializeUpdateQueue } from './update'
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
* @param container DOM容器  
* @param tag fiberRoot节点的标记(LegacyRoot、BatchedRoot、ConcurrentRoot)  
* @param options 配置信息，只有在hydrate时才有值，否则为undefined  
* @returns {*}  */
function createRootImpl( container: Container,tag: RootTag, options: void | RootOptions,) {
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
  containerInfo: Container,
  tag: RootTag,
  hydrate: boolean,
  hydrationCallbacks: null | any,
  strictModeLevelOverride: null | number,
}
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
  constructor(containerInfo: Container, tag: RootTag, hydrate: boolean) {
    this.current = null;
    this.tag = tag;
    this.containerInfo = containerInfo;
    // this.pendingChildren = null;
    // this.current = null;
    // this.pingCache = null;
    // this.finishedWork = null;
    // this.timeoutHandle = noTimeout;
    this.context = null;
    this.pendingContext = null;
    this.pooledCache = null;
    this.hydrate = hydrate;

  }
  
 
  
  
  
}
const createFiber = function(
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
  }
  
  

}
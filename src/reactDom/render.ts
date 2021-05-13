import { ReactNodeList, Container, FiberRoot}  from '../type/index'
import { createLegacyRoot } from './create'
import { entangleTransitions, requestUpdateLane} from './lane'
import { createUpdate, enqueueUpdate} from './update'
import { scheduleUpdateOnFiber } from '../reconcile'
import { Cxt, BatchedContext, LegacyUnbatchedContext, getContextForSubtree} from './context'
import { requestEventTime, resetRenderTimer } from "./workInprogress";
import { flushSyncCallbackQueue } from './scheduler'



// 注： 此函数的作用是根据是否强制融合（服务端渲染），不融合的情况下清除掉 container的子节点
export function legacyCreateRootFromDOMContainer( container: Container,forceHydrate: boolean,) {
    // 判断是否需要融合(服务端渲染)
    // const shouldHydrate =
    // forceHydrate || shouldHydrateDueToLegacyHeuristic(container);
    const shouldHydrate = false

    // First clear any existing content.
    //针对客户端渲染的情况，需要将container容器中的所有元素移除
    if (!shouldHydrate) {
      let rootSibling;
      while ((rootSibling = container.lastChild)) {
        container.removeChild(rootSibling);
      }
    }

    // 返回创建的根节点
    return createLegacyRoot(
      container,
      shouldHydrate
        ? {
            hydrate: true,
          }
        : undefined,
    );

}
// 存储当前的context 然后赋值新的context 执行回调函数， 执行结束后，执行微任务  flushSyncCallbackQueue
export function unbatchedUpdates<A, R>(callback: (a?: A) => R, a?: A):R {
  const prevExecutionContext = Cxt.executionContext;
  Cxt.executionContext &= ~BatchedContext;
  // 这里给Cxt.executionContext 添加LegacyUnbatchedContext 
  // 在后边的schedulerUpdateOnFiber中作为关键条件被使用
  Cxt.executionContext |= LegacyUnbatchedContext;
 
  
  console.log('这里更新了executionContext这个全局变量&= ~BatchedContext    |= LegacyUnbatchedContext')
  try {
    return callback(a);
  } finally {
    // todo
    console.log('unbatchedUpdates 的finally')
    Cxt.executionContext = prevExecutionContext;
    resetRenderTimer();
    flushSyncCallbackQueue();
    
  }
}

// 主体逻辑： 新建lane 和eventTime， 获取context, 开始进行调度
//  进行调度
export function updateContainer( 
  element: ReactNodeList,
  container: FiberRoot,
  parentComponent?: any,
  callback?: Function) {

  if(!container) {
    return ;
  }
  //
  const current = container.current;
  if(!current) {
    return ;
  }

  // 这次更新发生的时间，将来会在update等体现
  const eventTime = requestEventTime();
  
  const lane = requestUpdateLane(current)
   // 获取当前节点和子节点的上下文  // 第一次执行到这传入的是null返回的是{}
  const context = getContextForSubtree(parentComponent);// {}

  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }



  /**
   * 得到一个update对象 没有任何其他处理 UpdateState 此时是0
   * {
        eventTime,
        lane,

        tag: UpdateState,
        payload: null,
        callback: null,

        next: null,
    }
   */
  const update = createUpdate(eventTime, lane);
  
  update.payload = {element};
  console.log('创建update并且把element放进payload', {...update})
  enqueueUpdate(current, update, lane);

  const root = scheduleUpdateOnFiber(current, lane, eventTime);
  if (root !== null) {
    entangleTransitions(root, current, lane);
  }

  return lane;
}


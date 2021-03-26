import { ReactNodeList, RootType, Container, FiberRoot}  from '../type/index'
import { getPublicRootInstance, requestEventTime, getContextForSubtree} from './tools'
import { createLegacyRoot } from './create'
import { requestUpdateLane} from './lane'
import { createUpdate, enqueueUpdate} from './update'
import { scheduleUpdateOnFiber } from '../reconcile'
interface IlegacyRenderSubtreeIntoContainerProps {
  parentComponent: any, // 父组件
  children: ReactNodeList, // 就是babel翻译后的createElement返回的ReactElement节点
  container: Container,
  forceHydrate: boolean, // 是否融合，即服务端渲染
  callback?: Function,
}
export function legacyRenderSubtreeIntoContainer(props: IlegacyRenderSubtreeIntoContainerProps) {

  const { container, forceHydrate, callback, children, parentComponent } = props
  // 判断是第一次渲染还是update
  let root: RootType = (container._reactRootContainer);
  let fiberRoot: FiberRoot;
  
  // 首次挂载，进入当前流程控制中，container._reactRootContainer指向一个ReactSyncRoot实例
  if(!root) {
    // Initial mount
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
      container,
      forceHydrate,
    );
    console.log('container', container, 'root',root);
    fiberRoot = root._internalRoot;
    // Initial mount should not be batched.
    // 将执行上下文(executionContext)切换成 LegacyUnbatchedContext (非批量上下文)；
    // 调用 updateContainer 执行更新操作；
    // 将执行上下文(executionContext)恢复到之前的状态；
    // 如果之前的执行上下文是 NoContext，则调用 flushSyncCallbackQueue 刷新同步回调队列。
    
    unbatchedUpdates(() => {
      updateContainer(children, fiberRoot, parentComponent, callback);
    });

  } else {
    fiberRoot = root._internalRoot;
     // Update
     updateContainer(children, fiberRoot, parentComponent, callback);
  }
  return getPublicRootInstance(fiberRoot);
}


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


    return createLegacyRoot(
      container,
      shouldHydrate
        ? {
            hydrate: true,
          }
        : undefined,
    );

}

export function unbatchedUpdates<A, R>(callback: (a?: A) => R, a?: A):R {
  //
  try {
    return callback(a);
  } finally {
    // todo
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
  const eventTime = requestEventTime();
  const lane = requestUpdateLane(current)
   // 获取当前节点和子节点的上下文
  const context = getContextForSubtree(parentComponent);// {}

  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }
  console.log(container, 'container')

  const update = createUpdate(eventTime, lane);
  update.payload = {element};
  enqueueUpdate(current, update, lane);

  const root = scheduleUpdateOnFiber(current, lane, eventTime);
  // if (root !== null) {
  //   entangleTransitions(root, current, lane);
  // }

  return lane;
}


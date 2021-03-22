import { ReactNodeList, RootType, Container, FiberRoot}  from '../type/index'
import { getPublicRootInstance } from './tools'
interface IlegacyRenderSubtreeIntoContainerProps {
  parentComponent: any, // 父组件
  children: ReactNodeList,
  container: Container,
  forceHydrate: boolean,
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

    fiberRoot = root._internalRoot;
    // Initial mount should not be batched.
    // 对于首次挂载来说，更新操作不应该是批量的，所以会先执行unbatchedUpdates方法
    // 该方法中会将executionContext(执行上下文)切换成LegacyUnbatchedContext(非批量上下文)
    // 切换上下文之后再调用updateContainer执行更新操作
    // 执行完updateContainer之后再将executionContext恢复到之前的状态
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

export function legacyCreateRootFromDOMContainer( container: Container,
  forceHydrate: boolean,) {
    // 
    return {} as RootType

}

export function unbatchedUpdates(callback: () => void) {
  //
}

export function updateContainer( element: ReactNodeList,
  container: any,
  parentComponent?: any,
  callback?: Function) {
  //
}


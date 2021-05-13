// import { Element } from '../react/type'
import { Container, FiberRoot, ReactNodeList, RootType } from '../type';
import { createRoot } from './concurrent';
import { legacyCreateRootFromDOMContainer,  unbatchedUpdates, updateContainer } from './render'
import { getPublicRootInstance } from './tools';
interface IlegacyRenderSubtreeIntoContainerProps {
  parentComponent: any, // 父组件
  children: ReactNodeList, // 就是babel翻译后的createElement返回的ReactElement节点
  container: Container,
  forceHydrate: boolean, // 是否融合，即服务端渲染
  callback?: Function,
}
export default class ReactDom {
  /**
  * 
  * @param props 
  * @returns 
  *本函数的作用是 1 根据是否首次渲染执行操作--> 首次： 1）创建根节点及相关操作  2）执行更新操作
  */
  private static legacyRenderSubtreeIntoContainer(props: IlegacyRenderSubtreeIntoContainerProps): Element {
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
    console.log('container', container, 'root',root, children);
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
  // 返回的是最终渲染完的整个dom节点
  return getPublicRootInstance(fiberRoot) as Element;
  }
  
  static render(element: any, container: any, cb?: any) {
   
    // 处理container 无效的场景
    if(!container) {
      throw new Error('')
    }
    return this.legacyRenderSubtreeIntoContainer(
      {
      parentComponent: null,
      children: element,
      container,
      forceHydrate: false,
      callback: cb,
      }
    );
  }

  static unstable_createRoot = createRoot
}
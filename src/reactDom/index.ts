// import { Element } from '../react/type'
import { legacyRenderSubtreeIntoContainer } from './render'

export default class ReactDom {
  static render(element: any, container: any, cb?: any) {
   
    // 处理container 无效的场景
    if(!container) {
      throw new Error('')
    }
    return legacyRenderSubtreeIntoContainer(
      {
      parentComponent: null,
      children: element,
      container,
      forceHydrate: false,
      callback: cb,
      }
    );
  }
}
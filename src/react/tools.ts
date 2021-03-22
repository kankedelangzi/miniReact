import { IReactElement, REACT_ELEMENT_TYPE} from '../type'
export function hasValidRef(config: {[key: string]: any}) {
  return config.ref !== undefined;
}
export function hasValidKey(config: {[key: string]: any}) {
  return config.key !== undefined;
}
export function ReactElement (type: string,
  key: string|null,
  ref: any,
  self: any,
  source: any,
  owner: any,
  props: any,) {
  const element: IReactElement =  {
    // 如果使用react 提供的render会报错因为react内部这个被转译成了symbol。 所以这就导致不得不进行下一步自己封装render函数
     $$typeof: REACT_ELEMENT_TYPE, 
     type: type,
     key: key,
     ref: ref,
     props: props,
     _owner: owner,
  }
  return element;

}

export const ReactCurrentOwner = {
  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null ,
};
export const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
};
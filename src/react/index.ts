import { hasValidRef, hasValidKey, ReactElement, ReactCurrentOwner, RESERVED_PROPS } from './tools'
class React {
  static createElement(type: string, config: {[key: string]: any}|null, ...children: any[]) {

    // 第一步处理props
    const props: {[key: string]: any}    = {};
    let   ref      = null;
    let   key      = null;
    let   self     = null;
    let   source   = null;
    // 处理ref
    if(config !== null) {
      if(hasValidRef(config)) {
        ref = config.ref;
      }
      // 处理key
      if(hasValidKey(config)) {
        key = '' + config.key;
      }
      self = config.__self === undefined ? null : config.__self;
      source = config.__source === undefined ? null : config.__source;

      let propName;
      const hasOwnProperty = Object.prototype.hasOwnProperty;
      for(propName in config) {
        if( hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
          props[propName] = config[propName]
        }
      }
    }
    // 第二步处理children
    if(children.length > 0) {
      props.children = Array.from(children)
    }
    
    return ReactElement(
      type,
      key,
      ref,
      self,
      source,
      ReactCurrentOwner.current,
      props,
    );
  }
}








export default React
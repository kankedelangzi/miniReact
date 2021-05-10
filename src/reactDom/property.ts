import { Instance, mixed, Props } from "../type";
import { DANGEROUSLY_SET_INNER_HTML, CHILDREN} from "./propsOperate";
import { updateFiberProps } from "./tools";

/*
  lastProps中存在，nextProps中不存在，将propKey的value标记为null表示删除
  lastProps中不存在，nextProps中存在，将nextProps中的propKey和对应的value添加到updatePayload
  lastProps中存在，nextProps中也存在，将nextProps中的propKey和对应的value添加到updatePayload
*/
const STYLE = 'style';
export function diffProperties(
  domElement: Element,
  tag: string,
  lastRawProps: any,
  nextRawProps: any,
  rootContainerElement: Element | Document,
):null | Array<mixed>{
  console.log('diffProperties 未实现')

  let updatePayload: null | Array<any> = null;

  let lastProps: any;
  let nextProps: any;

  switch (tag) {
    // case 'input':
    //   lastProps = ReactDOMInputGetHostProps(domElement, lastRawProps);
    //   nextProps = ReactDOMInputGetHostProps(domElement, nextRawProps);
    //   updatePayload = [];
    //   break;
    // case 'option':
    //   lastProps = ReactDOMOptionGetHostProps(domElement, lastRawProps);
    //   nextProps = ReactDOMOptionGetHostProps(domElement, nextRawProps);
    //   updatePayload = [];
    //   break;
    // case 'select':
    //   lastProps = ReactDOMSelectGetHostProps(domElement, lastRawProps);
    //   nextProps = ReactDOMSelectGetHostProps(domElement, nextRawProps);
    //   updatePayload = [];
    //   break;
    // case 'textarea':
    //   lastProps = ReactDOMTextareaGetHostProps(domElement, lastRawProps);
    //   nextProps = ReactDOMTextareaGetHostProps(domElement, nextRawProps);
    //   updatePayload = [];
    //   break;
    default:
      lastProps = lastRawProps;
      nextProps = nextRawProps;
      if (
        typeof lastProps.onClick !== 'function' &&
        typeof nextProps.onClick === 'function'
      ) {
        // TODO: This cast may not be sound for SVG, MathML or custom elements.
        // trapClickOnNonInteractiveElement(((domElement: any): HTMLElement));
      }
      break;
  }

  // assertValidProps(tag, nextProps);

  let propKey;
  let styleName;
  let styleUpdates: any = null;
   // 循环lastProps，找出需要标记删除的propKey
  for (propKey in lastProps) {
    if (
      nextProps.hasOwnProperty(propKey) ||
      !lastProps.hasOwnProperty(propKey) ||
      lastProps[propKey] == null
    ) {
      // 对propKey来说，如果nextProps也有，或者lastProps没有，那么
      // 就不需要标记为删除，跳出本次循环继续判断下一个propKey
      continue;
    }
    if (propKey === STYLE) {
      const lastStyle = lastProps[propKey];
      for (styleName in lastStyle) {
        if (lastStyle.hasOwnProperty(styleName)) {
          if (!styleUpdates) {
            styleUpdates = {};
          }
          styleUpdates[styleName] = '';
        }
      }
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML || propKey === CHILDREN) {
      // Noop. This is handled by the clear text mechanism.
    // } else if (
    //   propKey === SUPPRESS_CONTENT_EDITABLE_WARNING ||
    //   propKey === SUPPRESS_HYDRATION_WARNING
    // ) {
    //   // Noop
    // } 
    }
    // else if (propKey === AUTOFOCUS) {
    //   // Noop. It doesn't work on updates anyway.
    // } 
    // else if (registrationNameDependencies.hasOwnProperty(propKey)) {
    //   // This is a special case. If any listener updates we need to ensure
    //   // that the "current" fiber pointer gets updated so we need a commit
    //   // to update this element.
    //   if (!updatePayload) {
    //     updatePayload = [];
    //   }
    // }
     else {
      // For all other deleted properties we add it to the queue. We use
      // the allowed property list in the commit phase instead.
        if (!updatePayload) {
        updatePayload = [];
      }
      (updatePayload = updatePayload || []).push(propKey, null);
    }
  }
  for (propKey in nextProps) {
    const nextProp = nextProps[propKey];
    const lastProp = lastProps != null ? lastProps[propKey] : undefined;
    if (
      !nextProps.hasOwnProperty(propKey) ||
      nextProp === lastProp ||
      (nextProp == null && lastProp == null)
    ) {
       // 如果nextProps不存在propKey，或者前后的value相同，或者前后的value都为null
      // 那么不需要添加进去，跳出本次循环继续处理下一个prop
      continue;
    }

    if (propKey === STYLE) {
      /*
      * lastProp: { color: 'red' }
      * nextProp: { color: 'blue' }
      * */
      // 如果style在lastProps和nextProps中都有
      // 那么需要删除lastProps中style的样式
      if (lastProp) {
        // Unset styles on `lastProp` but not on `nextProp`.
         // 如果lastProps中也有style
        // 将style内的样式属性设置为空
        // styleUpdates = { color: '' }
        for (styleName in lastProp) {
          if (
            lastProp.hasOwnProperty(styleName) &&
            (!nextProp || !nextProp.hasOwnProperty(styleName))
          ) {
            if (!styleUpdates) {
              styleUpdates = {};
            }
            styleUpdates[styleName] = '';
          }
        }
          // 以nextProp的属性名为key设置新的style的value
        // styleUpdates = { color: 'blue' }
        // Update styles that changed since `lastProp`.
        for (styleName in nextProp) {
          if (
            nextProp.hasOwnProperty(styleName) &&
            lastProp[styleName] !== nextProp[styleName]
          ) {
            if (!styleUpdates) {
              styleUpdates = {};
            }
            styleUpdates[styleName] = nextProp[styleName];
          }
        }
      } else {
          // 如果lastProps中没有style，说明新增的
        // 属性全部可放入updatePayload
        // Relies on `updateStylesByID` not mutating `styleUpdates`.
        if (!styleUpdates) {
          if (!updatePayload) {
            updatePayload = [];
          }
          updatePayload.push(propKey, styleUpdates);
        }
        styleUpdates = nextProp;
      }
  //   } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
  //     const nextHtml = nextProp ? nextProp[HTML] : undefined;
  //     const lastHtml = lastProp ? lastProp[HTML] : undefined;
  //     if (nextHtml != null) {
  //       if (lastHtml !== nextHtml) {
  //         (updatePayload = updatePayload || []).push(propKey, nextHtml);
  //       }
  //     } else {
  //       // TODO: It might be too late to clear this if we have children
  //       // inserted already.
  //     }
  //   } else if (propKey === CHILDREN) {
  //     if (typeof nextProp === 'string' || typeof nextProp === 'number') {
  //       (updatePayload = updatePayload || []).push(propKey, '' + nextProp);
  //     }
  //   } else if (
  //     propKey === SUPPRESS_CONTENT_EDITABLE_WARNING ||
  //     propKey === SUPPRESS_HYDRATION_WARNING
  //   ) {
  //     // Noop
  //   } else if (registrationNameDependencies.hasOwnProperty(propKey)) {
  //     if (nextProp != null) {
  //       // We eagerly listen to this even though we haven't committed yet.
  //       if (__DEV__ && typeof nextProp !== 'function') {
  //         warnForInvalidEventListener(propKey, nextProp);
  //       }
  //       if (propKey === 'onScroll') {
  //         listenToNonDelegatedEvent('scroll', domElement);
  //       }
  //     }
  //     if (!updatePayload && lastProp !== nextProp) {
  //       // This is a special case. If any listener updates we need to ensure
  //       // that the "current" props pointer gets updated so we need a commit
  //       // to update this element.
  //       updatePayload = [];
  //     }
  //   } else if (
  //     typeof nextProp === 'object' &&
  //     nextProp !== null &&
  //     nextProp.$$typeof === REACT_OPAQUE_ID_TYPE
  //   ) {
  //     // If we encounter useOpaqueReference's opaque object, this means we are hydrating.
  //     // In this case, call the opaque object's toString function which generates a new client
  //     // ID so client and server IDs match and throws to rerender.
  //     nextProp.toString();
  //   } else {
  //     // For any other property we always add it to the queue and then we
  //     // filter it out using the allowed property list during the commit.
  //     (updatePayload = updatePayload || []).push(propKey, nextProp);
  //   }
   }
  }
  if (styleUpdates) {
 
    (updatePayload = updatePayload || []).push(STYLE, styleUpdates);
  }

  return updatePayload;
}


export function commitUpdate(
  domElement: Instance,
  updatePayload: Array<mixed>,
  type: string,
  oldProps: Props,
  newProps: Props,
  internalInstanceHandle: Object,
): void {
  // Update the props handle so that we know which props are the ones with
  // with current event handlers.
  updateFiberProps(domElement, newProps);
  // Apply the diff to the DOM node.
  updateProperties(domElement, updatePayload, type, oldProps, newProps);
}


// Apply the diff.
export function updateProperties(
  domElement: Element,
  updatePayload: Array<any>,
  tag: string,
  lastRawProps: Object,
  nextRawProps: Object,
): void {
  console.log('updateProperties未实现')
  // Update checked *before* name.
  // In the middle of an update, it is possible to have multiple checked.
  // When a checked radio tries to change name, browser makes another radio's checked false.
  // if (
  //   tag === 'input' &&
  //   nextRawProps.type === 'radio' &&
  //   nextRawProps.name != null
  // ) {
  //   ReactDOMInputUpdateChecked(domElement, nextRawProps);
  // }

  // const wasCustomComponentTag = isCustomComponent(tag, lastRawProps);
  // const isCustomComponentTag = isCustomComponent(tag, nextRawProps);
  // // Apply the diff.
  // updateDOMProperties(
  //   domElement,
  //   updatePayload,
  //   wasCustomComponentTag,
  //   isCustomComponentTag,
  // );

  // // TODO: Ensure that an update gets scheduled if any of the special props
  // // changed.
  // switch (tag) {
  //   case 'input':
  //     // Update the wrapper around inputs *after* updating props. This has to
  //     // happen after `updateDOMProperties`. Otherwise HTML5 input validations
  //     // raise warnings and prevent the new value from being assigned.
  //     ReactDOMInputUpdateWrapper(domElement, nextRawProps);
  //     break;
  //   case 'textarea':
  //     ReactDOMTextareaUpdateWrapper(domElement, nextRawProps);
  //     break;
  //   case 'select':
  //     // <select> value update needs to occur after <option> children
  //     // reconciliation
  //     ReactDOMSelectPostUpdateWrapper(domElement, nextRawProps);
  //     break;
  // }
}
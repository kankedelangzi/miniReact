import {Container,Instance,TextInstance,
  Fiber,HostComponent,HostText,HostPortal,Props,HostContext,
  SuspenseInstance,COMMENT_NODE, TEXT_NODE} from '../type'
import {  setInitialProperties } from './propsOperate'
export function insertInContainerBefore(
  container: Container,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance | SuspenseInstance,
): void {
  if (container.nodeType === COMMENT_NODE) {
    (container.parentNode as any).insertBefore(child, beforeChild);
  } else {
    container.insertBefore(child, beforeChild);
  }
}

export function appendChildToContainer(
  container: Container,
  child: Instance | TextInstance,
): void {
  let parentNode;
  if (container.nodeType === COMMENT_NODE) {
    parentNode = (container.parentNode as any);
    parentNode.insertBefore(child, container);
  } else {
    parentNode = container;
    parentNode.appendChild(child);
  }
  // This container might be used for a portal.
  // If something inside a portal is clicked, that click should bubble
  // through the React tree. However, on Mobile Safari the click would
  // never bubble through the *DOM* tree unless an ancestor with onclick
  // event exists. So we wouldn't see it and dispatch it.
  // This is why we ensure that non React root containers have inline onclick
  // defined.
  // https://github.com/facebook/react/issues/11918
  const reactRootContainer = container._reactRootContainer;
  if (
    (reactRootContainer === null || reactRootContainer === undefined) &&
    parentNode.onclick === null
  ) {
    // TODO: This cast may not be sound for SVG, MathML or custom elements.
    trapClickOnNonInteractiveElement(parentNode);
  }
}

function noop() {}
export function trapClickOnNonInteractiveElement(node: HTMLElement) {
  // Mobile Safari does not fire properly bubble click events on
  // non-interactive elements, which means delegated click listeners do not
  // fire. The workaround for this bug involves attaching an empty click
  // listener on the target node.
  // https://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
  // Just set it using the onclick property so that we don't have to manage any
  // bookkeeping for it. Not sure if we need to clear it when the listener is
  // removed.
  // TODO: Only do this for the relevant Safaris maybe?
  node.onclick = noop;
}

export function insertBefore(
  parentInstance: Instance,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance | SuspenseInstance,
): void {
  parentInstance.insertBefore(child, beforeChild);
}

export function appendChild(
  parentInstance: Instance,
  child: Instance | TextInstance,
): void {
  parentInstance.appendChild(child);
}
export function appendInitialChild(
  parentInstance: Instance,
  child: Instance | TextInstance,
): void {
  if(child) {
    parentInstance.appendChild(child);
  } else {
    console.log('%c child是null', 'color:blue;background:yellow;')
  }
  
}
/*
  由于一个原生DOM组件的子组件有可能是类组件或函数组件，所以会优先检查自身，发现自己不是原生DOM组件，
  不能被插入到父级fiber节点对应的DOM中，所以要往下找，直到找到原生DOM组件，执行插入，最后再从这一层找同级的fiber节点，
  同级节点也会执行先自检，再检查下级，再检查下级的同级的操作。 
  可以看出，节点的插入也是深度优先。值得注意的是，这一整个插入的流程并没有真的将DOM插入到真实的页面上，
  它只是在操作fiber上的stateNode。真实的插入DOM操作发生在commit阶段。
*/
export function appendAllChildren (
  parent: Instance,
  workInProgress: Fiber,
  needsVisibilityToggle: boolean,
  isHidden: boolean,
) {
  // We only have the top Fiber that was created but we need recurse down its
  // children to find all the terminal nodes.
  let node = workInProgress.child;
  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
       // 子节点是原生DOM 节点，直接可以插入
      appendInitialChild(parent, node.stateNode);
    } else if (node.tag === HostPortal) {
      // If we have a portal child, then we don't want to traverse
      // down its children. Instead, we'll get insertions from each child in
      // the portal directly.
    } else if (node.child !== null) {
      // 代码执行到这，说明node不符合插入要求，
        // 继续寻找子节点
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === workInProgress) {
      return;
    }
     // 当不存在兄弟节点时往上找，此过程发生在当前completeWork节点的子节点再无子节点的场景，
    // 并不是直接从当前completeWork的节点去往上找
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      node = node.return;
    }
     // 当不存在子节点时，从sibling节点入手开始找
     // 请注意node的sibling节点是在这里赋值return的
    node.sibling.return = node.return;
    node = node.sibling;
  }
};

// finalizeInitialChildren最终会调用setInitialProperties，来完成属性的设置。这个过程好理解，
// 主要就是调用setInitialDOMProperties将属性直接设置进DOM节点（事件在这个阶段绑定
export function finalizeInitialChildren(
  domElement: Instance,
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
): boolean {
  setInitialProperties(domElement, type, props, rootContainerInstance);
  return shouldAutoFocusHostComponent(type, props);
}

function shouldAutoFocusHostComponent(type: string, props: Props): boolean {
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      return !!props.autoFocus;
  }
  return false;
}

export function resetTextContent(domElement: Instance): void {
  setTextContent(domElement, '');
}
const setTextContent = function(node: Element, text: string): void {
  if (text) {
    const firstChild = node.firstChild;

    if (
      firstChild &&
      firstChild === node.lastChild &&
      firstChild.nodeType === TEXT_NODE
    ) {
      firstChild.nodeValue = text;
      return;
    }
  }
  node.textContent = text;
};
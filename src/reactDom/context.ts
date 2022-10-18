import { didPerformWorkStackCursor } from '../reconcile/beginWork';

import {HostContext, Container,ExecutionContext,
  DOCUMENT_NODE,DOCUMENT_FRAGMENT_NODE, COMMENT_NODE, HostRoot, ClassComponent, Fiber } from '../type'
import { getChildNamespace } from './domNameSpace'

export const disableLegacyContext = false;
export const NoTimestamp = -1;
export const NoContext = /*             */ 0b0000000;
export const BatchedContext = /*               */ 0b0000001;
export const EventContext = /*                 */ 0b0000010;
export const DiscreteEventContext = /*         */ 0b0000100;
export const LegacyUnbatchedContext = /*       */ 0b0001000;
export const RenderContext = /*                */ 0b0010000;
export const CommitContext = /*                */ 0b0100000;

interface contextConstant {
  executionContext: ExecutionContext,
  previousContext: {[key: string]: any}
}
export const Cxt: contextConstant = {
  executionContext: NoContext,
  previousContext: {}
}





export function getRootHostContext(
  rootContainerInstance: Container,
): HostContext {
  // debugger
  let type;
  let namespace;
  const nodeType = rootContainerInstance.nodeType;
  switch (nodeType) {
    case DOCUMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE: {
      type = nodeType === DOCUMENT_NODE ? '#document' : '#fragment';
      const root = (rootContainerInstance as any).documentElement;
      namespace = root ? root.namespaceURI : getChildNamespace(null, '');
      break;
    }
    default: {
      const container: any =
        nodeType === COMMENT_NODE
          ? rootContainerInstance.parentNode
          : rootContainerInstance;
      const ownNamespace = container.namespaceURI || null;
      type = container.tagName;
      namespace = getChildNamespace(ownNamespace, type);
      break;
    }
  }
 
  return namespace;
}

export function hasContextChanged(): boolean {
  
  if (disableLegacyContext) {
    return false;
  } else {
    return didPerformWorkStackCursor.current;
  }
}

function isContextProvider(type: Function): boolean {
  if (disableLegacyContext) {
    return false;
  } else {
    const childContextTypes = (type as any).childContextTypes;
    return childContextTypes !== null && childContextTypes !== undefined;
  }
}

function findCurrentUnmaskedContext(fiber: Fiber): any {
  if (disableLegacyContext) {
    return emptyContextObject;
  } else {
    // Currently this is only used with renderSubtreeIntoContainer; not sure if it
    // makes sense elsewhere
   

    let node: Fiber|null = fiber;
    do {
      switch (node.tag) {
        case HostRoot:
          return node.stateNode.context;
        case ClassComponent: {
          const Component = node.type;
          if (isContextProvider(Component)) {
            return node.stateNode.__reactInternalMemoizedMergedChildContext;
          }
          break;
        }
      }
      node = node.return;
    } while (node !== null);
   
  }
}
function processChildContext(
  fiber: Fiber,
  type: any,
  parentContext: Object,
): Object {
  if (disableLegacyContext) {
    return parentContext;
  } else {
    const instance = fiber.stateNode;
    // const childContextTypes = type.childContextTypes;

  
    if (typeof instance.getChildContext !== 'function') {
      
      return parentContext;
    }

    const childContext = instance.getChildContext();
    // for (const contextKey in childContext) {
    //   //
    // }
    

    return {...parentContext, ...childContext};
  }
}
export const emptyContextObject = {};

export function get(key: any) {
  return key._reactInternals;
}

export function getContextForSubtree(
  parentComponent: any,
): Object {
  if (!parentComponent) {
    return emptyContextObject;
  }
  const getInstanc = get;
  const fiber = getInstanc(parentComponent);
  const parentContext = findCurrentUnmaskedContext(fiber);

  if (fiber.tag === ClassComponent) {
    const Component = fiber.type;
    const isLegacyContextProvider = isContextProvider;
    if (isLegacyContextProvider(Component)) {
      return processChildContext(fiber, Component, parentContext);
    }
  }

  return parentContext;
}

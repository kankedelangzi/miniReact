import {HostContext, Container,
  DOCUMENT_NODE,DOCUMENT_FRAGMENT_NODE, COMMENT_NODE } from '../type'
import { getChildNamespace } from './domNameSpace'
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
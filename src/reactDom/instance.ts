import { Instance, HydratableInstance,
   ELEMENT_NODE, TextInstance, TEXT_NODE, Fiber} from '../type'
import { NoContextT } from '../reconcile/fiberStack'
import { Namespaces, getIntrinsicNamespace } from './domNameSpace'
import {  Props, DOCUMENT_NODE, Container } from '../type'
import { updateFiberProps } from './tools'
const {html: HTML_NAMESPACE} = Namespaces;
type HostContextDev = {
  namespace: string,
  ancestorInfo: any,
};
type HostContextProd = string;
export type HostContext = HostContextDev | HostContextProd;


export function createInstance(
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
  internalInstanceHandle: Object,
): Instance {
  let parentNamespace: string;
  parentNamespace = (hostContext) as HostContextProd;
  const domElement: Instance = createElement(
    type,
    props,
    rootContainerInstance,
    parentNamespace,
  );
  // 这里只做了赋值操作。 跟进观察props里的属性是如何在DOMElement上生效的， eg： style
  updateFiberProps(domElement, props);
  return domElement;
}

// export function precacheFiberNode(
//   hostInst: Fiber,
//   node: Instance | TextInstance | SuspenseInstance | ReactScopeInstance,
// ): void {
//   (node as any)[internalInstanceKey] = hostInst;
// }

export function createTextInstance(
  text: string,
  rootContainerInstance: NoContextT| Container,
  hostContext: HostContext,
  internalInstanceHandle: Object,
): TextInstance {
 
  const textNode: TextInstance = createTextNode(text, rootContainerInstance as any);
  // precacheFiberNode(internalInstanceHandle, textNode);
  return textNode;
}

export function createTextNode(
  text: string,
  rootContainerElement: Element | Document,
): Text {
  return getOwnerDocumentFromRootContainer(rootContainerElement).createTextNode(
    text,
  );
}


function getOwnerDocumentFromRootContainer(
  rootContainerElement: Element | Document,
): Document {
  // debugger
  return rootContainerElement.nodeType === DOCUMENT_NODE
    ? (rootContainerElement) as any
    : rootContainerElement.ownerDocument;
}

export function createElement(
  type: string,
  props: Props,
  rootContainerElement: Element | Document,
  parentNamespace: string,
): Element {
  // debugger
  // let isCustomComponentTag;

  // We create tags in the namespace of their parent container, except HTML
  // tags get no namespace.
  const ownerDocument: Document = getOwnerDocumentFromRootContainer(
    rootContainerElement,
  );
  let domElement: Element;
  let namespaceURI = parentNamespace;
  if (namespaceURI === HTML_NAMESPACE) {
    namespaceURI = getIntrinsicNamespace(type);
  }
  
  // if (namespaceURI === HTML_NAMESPACE) {
    if (type === 'script') {
      const div = ownerDocument.createElement('div');
      div.innerHTML = '<script><' + '/script>'; 
      const firstChild = ((div.firstChild) as HTMLScriptElement);
      domElement = div.removeChild(firstChild);
    } else if(typeof props.is === 'string') {
      domElement = ownerDocument.createElement(type, {is: props.is});
    } else {
      domElement = ownerDocument.createElement(type);
      console.log(domElement, 'domcreate::')
      if (type === 'select') {
        const node = ((domElement) as HTMLSelectElement);
        if (props.multiple) {
          node.multiple = true;
        } else if (props.size) {
          // Setting a size greater than 1 causes a select to behave like `multiple=true`, where
          // it is possible that no option is selected.
          //
          // This is only necessary when a select in "single selection mode".
          node.size = props.size;
        }
      }
    }
  // } else {
  //   // domElement = ownerDocument.createElementNS(namespaceURI, type);
  //   domElement = ownerDocument.createElement(type);
  // }

  return domElement;
}


export function canHydrateInstance(
  instance: HydratableInstance|null,
  type: string,
  props: Props,
): null | Instance {
  if(!instance) {
    return null;
  }
  if (
    instance.nodeType !== ELEMENT_NODE ||
    type.toLowerCase() !== instance.nodeName.toLowerCase()
  ) {
    return null;
  }
  // This has now been refined to an element node.
  return (instance as Instance);
}

export function canHydrateTextInstance(
  instance: HydratableInstance|null,
  text: string,
): null | TextInstance {
  if(!instance) {
    return null;
  }
  if (text === '' || instance.nodeType !== TEXT_NODE) {
    // Empty strings are not parsed by HTML so there won't be a correct match here.
    return null;
  }
  // This has now been refined to a text node.
  return (instance as TextInstance);
}

function getNextHydratable(node: HydratableInstance | null) {
  // Skip non-hydratable nodes.
  // if(!node) return node;
  for (; node != null; node = node.nextSibling as  HydratableInstance | null) {
    const nodeType = node.nodeType;
    if (nodeType === ELEMENT_NODE || nodeType === TEXT_NODE) {
      break;
    }
    // if (enableSuspenseServerRenderer) {
    //   if (nodeType === COMMENT_NODE) {
    //     const nodeData = (node: any).data;
    //     if (
    //       nodeData === SUSPENSE_START_DATA ||
    //       nodeData === SUSPENSE_FALLBACK_START_DATA ||
    //       nodeData === SUSPENSE_PENDING_START_DATA
    //     ) {
    //       break;
    //     }
    //   }
    // }
  }
  return (node as any);
}

export function getNextHydratableSibling(
  instance: HydratableInstance | null,
): null | HydratableInstance {
  if(!instance) return null;
  return getNextHydratable(instance.nextSibling as HydratableInstance | null);
}
export function getFirstHydratableChild(
  parentInstance: Container | Instance |null,
): null | HydratableInstance {
  if(!parentInstance) return null;
  return getNextHydratable(parentInstance.firstChild as HydratableInstance | null);
}
import { Instance } from '../type'
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



function getOwnerDocumentFromRootContainer(
  rootContainerElement: Element | Document,
): Document {
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
  if (namespaceURI === HTML_NAMESPACE) {
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
  } else {
    domElement = ownerDocument.createElementNS(namespaceURI, type);
  }

  return domElement;
}


import { Props, mixed, PropertyInfo, RESERVED} from '../type'
import { Namespaces } from './domNameSpace'
export function setInitialProperties(
  domElement: Element,
  tag: string,
  rawProps: Object,
  rootContainerElement: Element | Document,
): void {
  const isCustomComponentTag = isCustomComponent(tag, rawProps);
 

  // TODO: Make sure that we check isMounted before firing any of these events.
  let props: Props = {} as Props;
  switch (tag) {
    case 'dialog':
      // listenToNonDelegatedEvent('cancel', domElement);
      // listenToNonDelegatedEvent('close', domElement);
      props = rawProps;
      break;
    case 'iframe':
    case 'object':
    case 'embed':
      // We listen to this event in case to ensure emulated bubble
      // listeners still fire for the load event.
      // listenToNonDelegatedEvent('load', domElement);
      props = rawProps;
      break;
    case 'video':
    case 'audio':
      // We listen to these events in case to ensure emulated bubble
      // listeners still fire for all the media events.
      // for (let i = 0; i < mediaEventTypes.length; i++) {
      //   listenToNonDelegatedEvent(mediaEventTypes[i], domElement);
      // }
      props = rawProps;
      break;
    case 'source':
      // We listen to this event in case to ensure emulated bubble
      // listeners still fire for the error event.
      // listenToNonDelegatedEvent('error', domElement);
      props = rawProps;
      break;
    case 'img':
    case 'image':
    case 'link':
      // We listen to these events in case to ensure emulated bubble
      // listeners still fire for error and load events.
      // listenToNonDelegatedEvent('error', domElement);
      // listenToNonDelegatedEvent('load', domElement);
      props = rawProps;
      break;
    case 'details':
      // We listen to this event in case to ensure emulated bubble
      // listeners still fire for the toggle event.
      // listenToNonDelegatedEvent('toggle', domElement);
      props = rawProps;
      break;
    case 'input':
      // ReactDOMInputInitWrapperState(domElement, rawProps);
      // props = ReactDOMInputGetHostProps(domElement, rawProps);
      // // We listen to this event in case to ensure emulated bubble
      // // listeners still fire for the invalid event.
      // listenToNonDelegatedEvent('invalid', domElement);
      break;
    case 'option':
      // ReactDOMOptionValidateProps(domElement, rawProps);
      // props = ReactDOMOptionGetHostProps(domElement, rawProps);
      break;
    case 'select':
      // ReactDOMSelectInitWrapperState(domElement, rawProps);
      // props = ReactDOMSelectGetHostProps(domElement, rawProps);
      // // We listen to this event in case to ensure emulated bubble
      // // listeners still fire for the invalid event.
      // listenToNonDelegatedEvent('invalid', domElement);
      break;
    case 'textarea':
      // ReactDOMTextareaInitWrapperState(domElement, rawProps);
      // props = ReactDOMTextareaGetHostProps(domElement, rawProps);
      // // We listen to this event in case to ensure emulated bubble
      // // listeners still fire for the invalid event.
      // listenToNonDelegatedEvent('invalid', domElement);
      break;
    default:
      props = rawProps;
  }

  assertValidProps(tag, props);

  setInitialDOMProperties(
    tag,
    domElement,
    rootContainerElement,
    props,
    isCustomComponentTag,
  );

  switch (tag) {
    case 'input':
      // TODO: Make sure we check if this is still unmounted or do any clean
      // up necessary since we never stop tracking anymore.
      // track(domElement);
      // ReactDOMInputPostMountWrapper(domElement, rawProps, false);
      break;
    case 'textarea':
      // TODO: Make sure we check if this is still unmounted or do any clean
      // up necessary since we never stop tracking anymore.
      // track((domElement: any));
      // ReactDOMTextareaPostMountWrapper(domElement, rawProps);
      break;
    case 'option':
      // ReactDOMOptionPostMountWrapper(domElement, rawProps);
      break;
    case 'select':
      // ReactDOMSelectPostMountWrapper(domElement, rawProps);
      break;
    default:
      if (typeof props.onClick === 'function') {
        // TODO: This cast may not be sound for SVG, MathML or custom elements.
        // trapClickOnNonInteractiveElement(((domElement: any): HTMLElement));
      }
      break;
  }
}
const HTML = '__html';
const DANGEROUSLY_SET_INNER_HTML = 'dangerouslySetInnerHTML';
const SUPPRESS_CONTENT_EDITABLE_WARNING = 'suppressContentEditableWarning';
const SUPPRESS_HYDRATION_WARNING = 'suppressHydrationWarning';
/**
 * Mapping from registration name to event name
 */
 export const registrationNameDependencies = {};
const AUTOFOCUS = 'autoFocus';
const CHILDREN = 'children';
export const BOOLEAN = 3;
export const OVERLOADED_BOOLEAN = 4;
const omittedCloseTags = {
  area: true,
  base: true,
  br: true,
  col: true,
  embed: true,
  hr: true,
  img: true,
  input: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true,
 
  // NOTE: menuitem's close tag should be omitted, but that causes problems.
};
export const isUnitlessNumber: {[key: string]: any} = {
  animationIterationCount: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  columns: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridArea: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowSpan: true,
  gridRowStart: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnSpan: true,
  gridColumnStart: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,

  // SVG-related properties
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true,
};
const voidElementTags: { [key: string]: any} = {
  menuitem: true,
  ...omittedCloseTags,
};
function assertValidProps(tag: string, props: Props) {
  if (!props) {
    return;
  }
  // Note the use of `==` which checks for null or undefined.
  if (voidElementTags[tag]) {
   
  }
  if (props.dangerouslySetInnerHTML != null) {
    // invariant(
    //   props.children == null,
    //   'Can only set one of `children` or `props.dangerouslySetInnerHTML`.',
    // );
    // invariant(
    //   typeof props.dangerouslySetInnerHTML === 'object' &&
    //     HTML in props.dangerouslySetInnerHTML,
    //   '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
    //     'Please visit https://reactjs.org/link/dangerously-set-inner-html ' +
    //     'for more information.',
    // );
  }
  

}
const STYLE = 'style';

function setInitialDOMProperties(
  tag: string,
  domElement: Element,
  rootContainerElement: Element | Document,
  nextProps: {[key: string]: any},
  isCustomComponentTag: boolean,
): void {
  for (const propKey in nextProps) {
    if (!nextProps.hasOwnProperty(propKey)) {
      continue;
    }
    const nextProp = nextProps[propKey];
    if (propKey === STYLE) {
     
      // Relies on `updateStylesByID` not mutating `styleUpdates`.
      setValueForStyles(domElement, nextProp);
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
      const nextHtml = nextProp ? nextProp[HTML] : undefined;
      if (nextHtml != null) {
        setInnerHTML(domElement, nextHtml);
      }
    } else if (propKey === CHILDREN) {
      // if (typeof nextProp === 'string') {
      //   // Avoid setting initial textContent when the text is empty. In IE11 setting
      //   // textContent on a <textarea> will cause the placeholder to not
      //   // show within the <textarea> until it has been focused and blurred again.
      //   // https://github.com/facebook/react/issues/6731#issuecomment-254874553
      //   const canSetTextContent = tag !== 'textarea' || nextProp !== '';
      //   if (canSetTextContent) {
      //     setTextContent(domElement, nextProp);
      //   }
      // } else if (typeof nextProp === 'number') {
      //   setTextContent(domElement, '' + nextProp);
      // }
    } else if (
      propKey === SUPPRESS_CONTENT_EDITABLE_WARNING ||
      propKey === SUPPRESS_HYDRATION_WARNING
    ) {
      // Noop
    } else if (propKey === AUTOFOCUS) {
      // We polyfill it separately on the client during commit.
      // We could have excluded it in the property list instead of
      // adding a special case here, but then it wouldn't be emitted
      // on server rendering (but we *do* want to emit it in SSR).
    } else if (registrationNameDependencies.hasOwnProperty(propKey)) {
      // if (nextProp != null) {
     
      //   if (propKey === 'onScroll') {
      //     listenToNonDelegatedEvent('scroll', domElement);
      //   }
      // }
    } else if (nextProp != null) {
      setValueForProperty(domElement, propKey, nextProp, isCustomComponentTag);
    }
  }
}

export function setValueForStyles(node: Element, styles: any) {
  const style = (node as any).style; // TODO
  for (let styleName in styles) {
    if (!styles.hasOwnProperty(styleName)) {
      continue;
    }
    const isCustomProperty = styleName.indexOf('--') === 0;
    
    // 处理null boolean  和没有px的数字
    const styleValue = dangerousStyleValue(
      styleName,
      styles[styleName],
      isCustomProperty,
    );
    if (styleName === 'float') {
      styleName = 'cssFloat';
    }
    if (isCustomProperty) {
      style.setProperty(styleName, styleValue);
    } else {
      style[styleName] = styleValue;
    }
  }
}
function dangerousStyleValue(name: string, value: any, isCustomProperty: boolean) {


  const isEmpty = value == null || typeof value === 'boolean' || value === '';
  if (isEmpty) {
    return '';
  }

  if (
    !isCustomProperty &&
    typeof value === 'number' &&
    value !== 0 &&
    !(isUnitlessNumber.hasOwnProperty(name) && isUnitlessNumber[name])
  ) {
    return value + 'px'; // Presumes implicit 'px' suffix for unitless numbers
  }

  return ('' + value).trim();
}

function setInnerHTML(
  node: Element,
  html: any,
): void {
  if (node.namespaceURI === Namespaces.svg) {
    //
  }
  node.innerHTML = html;
};

/**
 * Sets the value for a property on a node.
 *
 * @param {DOMElement} node
 * @param {string} name
 * @param {*} value
 */
 export function setValueForProperty(
  node: Element,
  name: string,
  value: mixed,
  isCustomComponentTag: boolean,
) {
  const propertyInfo = getPropertyInfo(name);
  if (shouldIgnoreAttribute(name, propertyInfo, isCustomComponentTag)) {
    return;
  }
  if (shouldRemoveAttribute(name, value, propertyInfo, isCustomComponentTag)) {
    value = null;
  }
  // If the prop isn't in the special list, treat it as a simple attribute.
  if (isCustomComponentTag || propertyInfo === null) {
    // if (isAttributeNameSafe(name)) {

      const attributeName = name;
      if (value === null) {
        node.removeAttribute(attributeName);
      } else {
        node.setAttribute(
          attributeName,
          value
        );
      }
    // }
    return;
  }
  const {mustUseProperty} = propertyInfo;
  if (mustUseProperty) {
    const {propertyName} = propertyInfo;
    if (value === null) {
      const {type} = propertyInfo;
      (node as any)[propertyName] = type === BOOLEAN ? false : '';
    } else {
      // Contrary to `setAttribute`, object properties are properly
      // `toString`ed by IE8/9.
      (node as any)[propertyName] = value;
    }
    return;
  }
  // The rest are treated as attributes with special cases.
  const {attributeName, attributeNamespace} = propertyInfo;
  if (value === null) {
    node.removeAttribute(attributeName);
  } else {
    const {type} = propertyInfo;
    let attributeValue;
    if (type === BOOLEAN || (type === OVERLOADED_BOOLEAN && value === true)) {
      // If attribute type is boolean, we know for sure it won't be an execution sink
      // and we won't require Trusted Type here.
      attributeValue = '';
    } else {
      // `setAttribute` with objects becomes only `[object]` in IE8/9,
      // ('' + value) makes it output the correct toString()-value.
      // if (enableTrustedTypesIntegration) {
      //   attributeValue = (value: any);
      // } else {
      //   attributeValue = '' + (value: any);
      // }
      attributeValue = '' + (value as any);
      if (propertyInfo.sanitizeURL) {
        // sanitizeURL(attributeValue.toString());
      }
    }
    if (attributeNamespace) {
      node.setAttributeNS(attributeNamespace, attributeName, attributeValue);
    } else {
      node.setAttribute(attributeName, attributeValue);
    }
  }
}
const properties: {[key: string]: any} = {};

export function getPropertyInfo(name: string): PropertyInfo | null {
  return properties.hasOwnProperty(name) ? properties[name] : null;
}

export function shouldIgnoreAttribute(
  name: string,
  propertyInfo: PropertyInfo | null,
  isCustomComponentTag: boolean,
): boolean {
  if (propertyInfo !== null) {
    return propertyInfo.type === RESERVED;
  }
  if (isCustomComponentTag) {
    return false;
  }
  if (
    name.length > 2 &&
    (name[0] === 'o' || name[0] === 'O') &&
    (name[1] === 'n' || name[1] === 'N')
  ) {// 这里说on  ON开头的不是属性需要ignore
    return true;
  }
  return false;
}

export function shouldRemoveAttribute(
  name: string,
  value: mixed,
  propertyInfo: PropertyInfo | null,
  isCustomComponentTag: boolean,
): boolean {
  if (value === null || typeof value === 'undefined') {
    return true;
  }
  // if (
  //   shouldRemoveAttributeWithWarning(
  //     name,
  //     value,
  //     propertyInfo,
  //     isCustomComponentTag,
  //   )
  // ) {
  //   return true;
  // }
  // if (isCustomComponentTag) {
  //   return false;
  // }
  // if (propertyInfo !== null) {
  //   if (enableFilterEmptyStringAttributesDOM) {
  //     if (propertyInfo.removeEmptyString && value === '') {
  //       if (__DEV__) {
  //         if (name === 'src') {
  //           console.error(
  //             'An empty string ("") was passed to the %s attribute. ' +
  //               'This may cause the browser to download the whole page again over the network. ' +
  //               'To fix this, either do not render the element at all ' +
  //               'or pass null to %s instead of an empty string.',
  //             name,
  //             name,
  //           );
  //         } else {
  //           console.error(
  //             'An empty string ("") was passed to the %s attribute. ' +
  //               'To fix this, either do not render the element at all ' +
  //               'or pass null to %s instead of an empty string.',
  //             name,
  //             name,
  //           );
  //         }
  //       }
  //       return true;
  //     }
  //   }

  //   switch (propertyInfo.type) {
  //     case BOOLEAN:
  //       return !value;
  //     case OVERLOADED_BOOLEAN:
  //       return value === false;
  //     case NUMERIC:
  //       return isNaN(value);
  //     case POSITIVE_NUMERIC:
  //       return isNaN(value) || (value: any) < 1;
  //   }
  // }
  return false;
}

function isCustomComponent(tagName: string, props: {[key: string]: any}) {
  if (tagName.indexOf('-') === -1) {
    return typeof props.is === 'string';
  }
  switch (tagName) {
    // These are reserved SVG and MathML elements.
    // We don't mind this list too much because we expect it to never grow.
    // The alternative is to track the namespace in a few places which is convoluted.
    // https://w3c.github.io/webcomponents/spec/custom/#custom-elements-core-concepts
    case 'annotation-xml':
    case 'color-profile':
    case 'font-face':
    case 'font-face-src':
    case 'font-face-uri':
    case 'font-face-format':
    case 'font-face-name':
    case 'missing-glyph':
      return false;
    default:
      return true;
  }
}
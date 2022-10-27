import { Block, ClassComponent, Fiber, ForwardRef, FunctionComponent, 
    FundamentalComponent, HostComponent, HostRoot, HostText, 
    IncompleteClassComponent, Instance, LegacyHiddenComponent,
     MemoComponent, mixed, OffscreenComponent, ProfileMode, Profiler, Props, ScopeComponent,
      SimpleMemoComponent, SuspenseComponent, SuspenseInstance, SuspenseListComponent, TextInstance, UpdatePayload } from "../type";
import { enableProfilerCommitHooks, enableProfilerTimer } from "../type/constant";
import { dangerousStyleValue } from "./cssProperty";
import { setInnerHTML } from "./innerHtml";
import { startLayoutEffectTimer } from "./time";

const DANGEROUSLY_SET_INNER_HTML = 'dangerouslySetInnerHTML';
const SUPPRESS_CONTENT_EDITABLE_WARNING = 'suppressContentEditableWarning';
const SUPPRESS_HYDRATION_WARNING = 'suppressHydrationWarning';
const AUTOFOCUS = 'autoFocus';
const CHILDREN = 'children';
const STYLE = 'style';
const HTML = '__html';

const randomKey = Math.random()
  .toString(36)
  .slice(2);

const internalPropsKey = '__reactProps$' + randomKey;

 // mutation: 突变 变动
export function commitWork(current: Fiber | null, finishedWork: Fiber): void {
//   if (!supportsMutation) {
//     switch (finishedWork.tag) {
//       case FunctionComponent:
//       case ForwardRef:
//       case MemoComponent:
//       case SimpleMemoComponent:
//       case Block: {
//         // Layout effects are destroyed during the mutation phase so that all
//         // destroy functions for all fibers are called before any create functions.
//         // This prevents sibling component effects from interfering with each other,
//         // e.g. a destroy function in one component should never override a ref set
//         // by a create function in another component during the same commit.
//         if (
//           enableProfilerTimer &&
//           enableProfilerCommitHooks &&
//           finishedWork.mode & ProfileMode
//         ) {
//           try {
//             startLayoutEffectTimer();
//             commitHookEffectListUnmount(
//               HookLayout | HookHasEffect,
//               finishedWork,
//               finishedWork.return,
//             );
//           } finally {
//             recordLayoutEffectDuration(finishedWork);
//           }
//         } else {
//           commitHookEffectListUnmount(
//             HookLayout | HookHasEffect,
//             finishedWork,
//             finishedWork.return,
//           );
//         }
//         return;
//       }
//       case Profiler: {
//         return;
//       }
//       case SuspenseComponent: {
//         commitSuspenseComponent(finishedWork);
//         attachSuspenseRetryListeners(finishedWork);
//         return;
//       }
//       case SuspenseListComponent: {
//         attachSuspenseRetryListeners(finishedWork);
//         return;
//       }
//       case HostRoot: {
//         if (supportsHydration) {
//           const root: FiberRoot = finishedWork.stateNode;
//           if (root.hydrate) {
//             // We've just hydrated. No need to hydrate again.
//             root.hydrate = false;
//             commitHydratedContainer(root.containerInfo);
//           }
//         }
//         break;
//       }
//       case OffscreenComponent:
//       case LegacyHiddenComponent: {
//         return;
//       }
//     }

//     commitContainer(finishedWork);
//     return;
//   }

  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent:
    case Block: {
      // Layout effects are destroyed during the mutation phase so that all
      // destroy functions for all fibers are called before any create functions.
      // This prevents sibling component effects from interfering with each other,
      // e.g. a destroy function in one component should never override a ref set
      // by a create function in another component during the same commit.
      if (
        enableProfilerTimer &&
        enableProfilerCommitHooks &&
        finishedWork.mode & ProfileMode
      ) {
        try {
          startLayoutEffectTimer();
        //   commitHookEffectListUnmount(
        //     HookLayout | HookHasEffect,
        //     finishedWork,
        //     finishedWork.return,
        //   );
        } finally {
        //   recordLayoutEffectDuration(finishedWork);
        }
      } else {
        // commitHookEffectListUnmount(
        //   HookLayout | HookHasEffect,
        //   finishedWork,
        //   finishedWork.return,
        // );
      }
      return;
    }
    case ClassComponent: {
      return;
    }
    case HostComponent: {
      const instance: Instance = finishedWork.stateNode;
      if (instance != null) {
        // Commit the work prepared earlier.
        const newProps = finishedWork.memoizedProps;
        // For hydration we reuse the update path but we treat the oldProps
        // as the newProps. The updatePayload will contain the real change in
        // this case.
        const oldProps = current !== null ? current.memoizedProps : newProps;
        const type = finishedWork.type;
        // TODO: Type the updateQueue to be specific to host components.
        const updatePayload: null | UpdatePayload = (finishedWork.updateQueue as any);
        finishedWork.updateQueue = null;
        if (updatePayload !== null) {
          commitUpdate(
            instance,
            updatePayload,
            type,
            oldProps,
            newProps,
            finishedWork,
          );
        }
      }
      return;
    }
    case HostText: {
     
      const textInstance: TextInstance = finishedWork.stateNode;
      const newText: string = finishedWork.memoizedProps;
      // For hydration we reuse the update path but we treat the oldProps
      // as the newProps. The updatePayload will contain the real change in
      // this case.
      const oldText: string =
        current !== null ? current.memoizedProps : newText;
    //   commitTextUpdate(textInstance, oldText, newText);
      return;
    }
    case HostRoot: {
    //   if (supportsHydration) {
    //     const root: FiberRoot = finishedWork.stateNode;
    //     if (root.hydrate) {
    //       // We've just hydrated. No need to hydrate again.
    //       root.hydrate = false;
    //     //   commitHydratedContainer(root.containerInfo);
    //     }
    //   }
      return;
    }
    case Profiler: {
      return;
    }
    case SuspenseComponent: {
    //   commitSuspenseComponent(finishedWork);
    //   attachSuspenseRetryListeners(finishedWork);
      return;
    }
    case SuspenseListComponent: {
    //   attachSuspenseRetryListeners(finishedWork);
      return;
    }
    case IncompleteClassComponent: {
      return;
    }
    case FundamentalComponent: {
    //   if (enableFundamentalAPI) {
    //     const fundamentalInstance = finishedWork.stateNode;
    //     updateFundamentalComponent(fundamentalInstance);
    //     return;
    //   }
      break;
    }
    case ScopeComponent: {
    //   if (enableScopeAPI) {
    //     const scopeInstance = finishedWork.stateNode;
    //     prepareScopeUpdate(scopeInstance, finishedWork);
    //     return;
    //   }
      break;
    }
    case OffscreenComponent:
    case LegacyHiddenComponent: {
    //   const newState: OffscreenState | null = finishedWork.memoizedState;
    //   const isHidden = newState !== null;
    //   hideOrUnhideAllChildren(finishedWork, isHidden);
      return;
    }
  }

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

function isCustomComponent(tagName: string, props: Record<string, any>) {
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

function updateDOMProperties(
  domElement: Element,
  updatePayload: Array<any>,
  wasCustomComponentTag: boolean,
  isCustomComponentTag: boolean,
): void {
  // TODO: Handle wasCustomComponentTag
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i];
    const propValue = updatePayload[i + 1];
    if (propKey === STYLE) {
      setValueForStyles(domElement, propValue);
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
      setInnerHTML(domElement, propValue);
    } else if (propKey === CHILDREN) {
    //   setTextContent(domElement, propValue);
    } else {
    //   setValueForProperty(domElement, propKey, propValue, isCustomComponentTag);
    }
  }
}
// Apply the diff.
export function updateProperties(
  domElement: Element,
  updatePayload: Array<any>,
  tag: string,
  lastRawProps: Record<string, any>,
  nextRawProps: Record<string, any>,
): void {
  // Update checked *before* name.
  // In the middle of an update, it is possible to have multiple checked.
  // When a checked radio tries to change name, browser makes another radio's checked false.
  if (
    tag === 'input' &&
    nextRawProps.type === 'radio' &&
    nextRawProps.name != null
  ) {
    // ReactDOMInputUpdateChecked(domElement, nextRawProps);
  }

  const wasCustomComponentTag = isCustomComponent(tag, lastRawProps);
  const isCustomComponentTag = isCustomComponent(tag, nextRawProps);
  // Apply the diff.
  updateDOMProperties(
    domElement,
    updatePayload,
    wasCustomComponentTag,
    isCustomComponentTag,
  );

  // TODO: Ensure that an update gets scheduled if any of the special props
  // changed.
  switch (tag) {
    case 'input':
      // Update the wrapper around inputs *after* updating props. This has to
      // happen after `updateDOMProperties`. Otherwise HTML5 input validations
      // raise warnings and prevent the new value from being assigned.
    //   ReactDOMInputUpdateWrapper(domElement, nextRawProps);
      break;
    case 'textarea':
    //   ReactDOMTextareaUpdateWrapper(domElement, nextRawProps);
      break;
    case 'select':
      // <select> value update needs to occur after <option> children
      // reconciliation
    //   ReactDOMSelectPostUpdateWrapper(domElement, nextRawProps);
      break;
  }
}

export function updateFiberProps(
  node: Instance | TextInstance | SuspenseInstance,
  props: Props,
): void {
  (node as any)[internalPropsKey] = props;
}


/**
 * Sets the value for multiple styles on a node.  If a value is specified as
 * '' (empty string), the corresponding style property will be unset.
 *
 * @param {DOMElement} node
 * @param {object} styles
 */
export function setValueForStyles(node: any, styles: any) {
  const style = node.style;
  for (let styleName in styles) {
    if (!styles.hasOwnProperty(styleName)) {
      continue;
    }
    const isCustomProperty = styleName.indexOf('--') === 0;
  
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








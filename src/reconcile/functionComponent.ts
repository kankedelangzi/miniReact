import { Fiber, Placement, ContextDependency,
   ReactContext, mixed, Lanes,
   FunctionComponent,
   PerformedWork, ClassComponent} from "../type";
import { contextStackCursor, emptyContextObject} from './fiberStack'
import { includesSomeLane } from '../reactDom/lane'
import { markWorkInProgressReceivedUpdate } from './beginWork'
import { renderWithHooks } from './hooks'
import { initializeUpdateQueue } from '../reactDom/update'
import { reconcileChildren } from './beginWork'
export const disableLegacyContext = false;

export const enableFilterEmptyStringAttributesDOM = false;
export const disableModulePatternComponents = false;



function isContextProvider(type: Function): boolean {
  if (disableLegacyContext) {
    return false;
  } else {
    const childContextTypes = (type as any).childContextTypes;
    return childContextTypes !== null && childContextTypes !== undefined;
  }
}

let previousContext: Object = emptyContextObject;
function getUnmaskedContext(
  workInProgress: Fiber,
  Component: Function,
  didPushOwnContextIfProvider: boolean,
): Object {
  if (disableLegacyContext) {
    return emptyContextObject;
  } else {
    if (didPushOwnContextIfProvider && isContextProvider(Component)) {
      // If the fiber is a context provider itself, when we read its context
      // we may have already pushed its own child context on the stack. A context
      // provider should not "see" its own child context. Therefore we read the
      // previous (parent) context instead for a context provider.
      return previousContext;
    }
    return contextStackCursor.current;
  }
}
let currentlyRenderingFiber: Fiber | null = null;
let lastContextDependency: ContextDependency<mixed> | null = null;
let lastContextWithAllBitsObserved: ReactContext<any> | null = null;

export function prepareToReadContext(
  workInProgress: Fiber,
  renderLanes: Lanes,
): void {
  currentlyRenderingFiber = workInProgress;
  lastContextDependency = null;
  lastContextWithAllBitsObserved = null;

  const dependencies = workInProgress.dependencies;
  if (dependencies !== null) {
    const firstContext = dependencies.firstContext;
    if (firstContext !== null) {
      if (includesSomeLane(dependencies.lanes, renderLanes)) {
        // Context list has a pending update. Mark that this fiber performed work.
        markWorkInProgressReceivedUpdate();
      }
      // Reset the work-in-progress list
      dependencies.firstContext = null;
    }
  }
}

export function mountIndeterminateComponent(
  _current: Fiber|null,
  workInProgress: Fiber,
  Component: any,
  renderLanes: any,
) {
  if (_current !== null) {
    // An indeterminate component only mounts if it suspended inside a non-
    // concurrent tree, in an inconsistent state. We want to treat it like
    // a new mount, even though an empty version of it already committed.
    // Disconnect the alternate pointers.
    _current.alternate = null;
    workInProgress.alternate = null;
    // Since this is conceptually a new fiber, schedule a Placement effect
    workInProgress.flags |= Placement;
  }

  const props = workInProgress.pendingProps;
  let context;
  if (!disableLegacyContext) {
    const unmaskedContext = getUnmaskedContext(
      workInProgress,
      Component,
      false,
    );
    // context = getMaskedContext(workInProgress, unmaskedContext);
  }

  prepareToReadContext(workInProgress, renderLanes);
  let value;


    value = renderWithHooks(
      null,
      workInProgress,
      Component,
      props,
      context,
      renderLanes,
    );
  
  // React DevTools reads this flag.
  workInProgress.flags |= PerformedWork;
  debugger

  if (
    // Run these checks in production only if the flag is off.
    // Eventually we'll delete this branch altogether.
    !disableModulePatternComponents &&
    typeof value === 'object' &&
    value !== null &&
    typeof value.render === 'function' &&
    value.$$typeof === undefined
  ) {
    
   
    // Proceed under the assumption that this is a class instance
    workInProgress.tag = ClassComponent;

    // Throw out any hooks that were used.
    workInProgress.memoizedState = null;
    workInProgress.updateQueue = null;

    // Push context providers early to prevent context stack mismatches.
    // During mounting we don't know the child context yet as the instance doesn't exist.
    // We will invalidate the child context in finishClassComponent() right after rendering.
    let hasContext = false;
    // if (isLegacyContextProvider(Component)) {
    //   hasContext = true;
    //   pushLegacyContextProvider(workInProgress);
    // } else {
    //   hasContext = false;
    // }
    hasContext = true;
    // pushLegacyContextProvider(workInProgress);

    workInProgress.memoizedState =
      value.state !== null && value.state !== undefined ? value.state : null;

    initializeUpdateQueue(workInProgress);

    const getDerivedStateFromProps = Component.getDerivedStateFromProps;
    if (typeof getDerivedStateFromProps === 'function') {
      // applyDerivedStateFromProps(
      //   workInProgress,
      //   Component,
      //   getDerivedStateFromProps,
      //   props,
      // );
    }

    // adoptClassInstance(workInProgress, value);
    // mountClassInstance(workInProgress, Component, props, renderLanes);
    // return finishClassComponent(
    //   null,
    //   workInProgress,
    //   Component,
    //   true,
    //   hasContext,
    //   renderLanes,
    // );
  } else {
    // Proceed under the assumption that this is a function component
    workInProgress.tag = FunctionComponent;
   
    reconcileChildren(null, workInProgress, value, renderLanes);
  
    return workInProgress.child;
  }
}
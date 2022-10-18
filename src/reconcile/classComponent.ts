import { ReactCurrentOwner } from "../react/tools";
import { Cxt } from "../reactDom/context";
import { DidCapture, Fiber, Lanes, NoFlags, PerformedWork, Placement, Update } from "../type";
import { disableLegacyContext } from "../type/constant";
import { didPerformWorkStackCursor, reconcileChildren } from "./beginWork";
import { contextStackCursor, emptyContextObject } from "./fiberStack";
import { createCursor, push, pop, rootInstanceStackCursor, NoContextT, NO_CONTEXT } from './fiberStack'
import { prepareToReadContext } from "./functionComponent";

export function isContextProvider(type: Function): boolean {
  if (disableLegacyContext) {
    return false;
  } else {
    const childContextTypes = (type as any).childContextTypes;
    return childContextTypes !== null && childContextTypes !== undefined;
  }
}


const isLegacyContextProvider = isContextProvider


function pushContextProvider(workInProgress: Fiber): boolean {
  if (disableLegacyContext) {
    return false;
  } else {
    const instance = workInProgress.stateNode;
    // We push the context as early as possible to ensure stack integrity.
    // If the instance does not exist yet, we will push null at first,
    // and replace it on the stack later when invalidating the context.
    const memoizedMergedChildContext =
      (instance && instance.__reactInternalMemoizedMergedChildContext) ||
      emptyContextObject;

    // Remember the parent context so we can merge with it later.
    // Inherit the parent's did-perform-work value to avoid inadvertently blocking updates.

    Cxt.previousContext = contextStackCursor.current;
    push(contextStackCursor, memoizedMergedChildContext, workInProgress);
    push(
      didPerformWorkStackCursor,
      didPerformWorkStackCursor.current,
      workInProgress,
    );

    return true;
  }
}
const pushLegacyContextProvider = pushContextProvider
export function updateClassComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  nextProps: any,
  renderLanes: Lanes,
) {

  let hasContext;
  if (isLegacyContextProvider(Component)) {
    hasContext = true;
    pushLegacyContextProvider(workInProgress);
  } else {
    hasContext = false;
  }
  prepareToReadContext(workInProgress, renderLanes);

  const instance = workInProgress.stateNode;
  let shouldUpdate;
  if (instance === null) {
    if (current !== null) {
   
      current.alternate = null;
      workInProgress.alternate = null;
      // Since this is conceptually a new fiber, schedule a Placement effect
      workInProgress.flags |= Placement;
    }
    // In the initial pass we might need to construct the instance.
    constructClassInstance(workInProgress, Component, nextProps);
    mountClassInstance(workInProgress, Component, nextProps, renderLanes);
    shouldUpdate = true;
  } else if (current === null) {
    // In a resume, we'll already have an instance we can reuse.
    // shouldUpdate = resumeMountClassInstance(
    //   workInProgress,
    //   Component,
    //   nextProps,
    //   renderLanes,
    // );
  } else {
    // shouldUpdate = updateClassInstance(
    //   current,
    //   workInProgress,
    //   Component,
    //   nextProps,
    //   renderLanes,
    // );
  }
  const nextUnitOfWork = finishClassComponent(
    current,
    workInProgress,
    Component,
    false,
    hasContext,
    renderLanes,
  );
 
  return nextUnitOfWork;
}



function constructClassInstance(
  workInProgress: Fiber,
  ctor: any,
  props: any,
): any {
  let isLegacyContextConsumer = false;
  let unmaskedContext = emptyContextObject;
  let context = emptyContextObject;
  const contextType = ctor.contextType;
  console.log('constructClassInstance 未实现')
 

  // if (typeof contextType === 'object' && contextType !== null) {
  //   context = readContext((contextType: any));
  // } else if (!disableLegacyContext) {
  //   unmaskedContext = getUnmaskedContext(workInProgress, ctor, true);
  //   const contextTypes = ctor.contextTypes;
  //   isLegacyContextConsumer =
  //     contextTypes !== null && contextTypes !== undefined;
  //   context = isLegacyContextConsumer
  //     ? getMaskedContext(workInProgress, unmaskedContext)
  //     : emptyContextObject;
  // }

 

  const instance = new ctor(props, context);
  // const state = (workInProgress.memoizedState =
  //   instance.state !== null && instance.state !== undefined
  //     ? instance.state
  //     : null);
  // adoptClassInstance(workInProgress, instance);

  

  // // Cache unmasked context so we can avoid recreating masked context unless necessary.
  // // ReactFiberContext usually updates this cache but can't for newly-created instances.
  // if (isLegacyContextConsumer) {
  //   cacheContext(workInProgress, unmaskedContext, context);
  // }

  return instance;
}


function mountClassInstance(
  workInProgress: Fiber,
  ctor: any,
  newProps: any,
  renderLanes: Lanes,
): void {
 
  const instance = workInProgress.stateNode;
  instance.props = newProps;
  instance.state = workInProgress.memoizedState;
  console.log('mountClassInstance 未实现')
  // instance.refs = emptyRefsObject;

  // initializeUpdateQueue(workInProgress);

  // const contextType = ctor.contextType;
  // if (typeof contextType === 'object' && contextType !== null) {
  //   instance.context = readContext(contextType);
  // } else if (disableLegacyContext) {
  //   instance.context = emptyContextObject;
  // } else {
  //   const unmaskedContext = getUnmaskedContext(workInProgress, ctor, true);
  //   instance.context = getMaskedContext(workInProgress, unmaskedContext);
  // }

 

  // processUpdateQueue(workInProgress, newProps, instance, renderLanes);
  // instance.state = workInProgress.memoizedState;

  // const getDerivedStateFromProps = ctor.getDerivedStateFromProps;
  // if (typeof getDerivedStateFromProps === 'function') {
  //   applyDerivedStateFromProps(
  //     workInProgress,
  //     ctor,
  //     getDerivedStateFromProps,
  //     newProps,
  //   );
  //   instance.state = workInProgress.memoizedState;
  // }

  // // In order to support react-lifecycles-compat polyfilled components,
  // // Unsafe lifecycles should not be invoked for components using the new APIs.
  // if (
  //   typeof ctor.getDerivedStateFromProps !== 'function' &&
  //   typeof instance.getSnapshotBeforeUpdate !== 'function' &&
  //   (typeof instance.UNSAFE_componentWillMount === 'function' ||
  //     typeof instance.componentWillMount === 'function')
  // ) {
  //   callComponentWillMount(workInProgress, instance);
  //   // If we had additional state updates during this life-cycle, let's
  //   // process them now.
  //   processUpdateQueue(workInProgress, newProps, instance, renderLanes);
  //   instance.state = workInProgress.memoizedState;
  // }

  if (typeof instance.componentDidMount === 'function') {
    // if (
    //   __DEV__ &&
    //   enableStrictEffects &&
    //   (workInProgress.mode & StrictEffectsMode) !== NoMode
    // ) {
  
    // } else {
      workInProgress.flags |= Update;
    // }
  }
}

function finishClassComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  shouldUpdate: boolean,
  hasContext: boolean,
  renderLanes: Lanes,
) {
  // Refs should update even if shouldComponentUpdate returns false
  // markRef(current, workInProgress);

  const didCaptureError = (workInProgress.flags & DidCapture) !== NoFlags;

  if (!shouldUpdate && !didCaptureError) {
    // Context providers should defer to sCU for rendering
    // if (hasContext) {
    //   invalidateContextProvider(workInProgress, Component, false);
    // }

    // return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }

  const instance = workInProgress.stateNode;

  // Rerender
  ReactCurrentOwner.current = workInProgress;
  let nextChildren;
  if (
    didCaptureError &&
    typeof Component.getDerivedStateFromError !== 'function'
  ) {
    // If we captured an error, but getDerivedStateFromError is not defined,
    // unmount all the children. componentDidCatch will schedule an update to
    // re-render a fallback. This is temporary until we migrate everyone to
    // the new API.
    // TODO: Warn in a future release.
    nextChildren = null;

    // if (enableProfilerTimer) {
    //   stopProfilerTimerIfRunning(workInProgress);
    // }
  } else {
 
      nextChildren = instance.render();
    
  }

  // React DevTools reads this flag.
  workInProgress.flags |= PerformedWork;
  if (current !== null && didCaptureError) {
    // If we're recovering from an error, reconcile without reusing any of
    // the existing children. Conceptually, the normal children and the children
    // that are shown on error are two different sets, so we shouldn't reuse
    // normal children even if their identities match.
    // forceUnmountCurrentAndReconcile(
    //   current,
    //   workInProgress,
    //   nextChildren,
    //   renderLanes,
    // );
  } else {
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  }

  // Memoize state using the values we just used to render.
  // TODO: Restructure so we never read values from the instance.
  workInProgress.memoizedState = instance.state;

  // The context might have changed so we need to recalculate it.
  // if (hasContext) {
  //   invalidateContextProvider(workInProgress, Component, true);
  // }

  return workInProgress.child;
}
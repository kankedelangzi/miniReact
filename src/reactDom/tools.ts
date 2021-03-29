import { FiberRoot, HostComponent, Fiber, Container, ReactPriorityLevel, Lane, Lanes, Props}  from '../type/index'
import Scheduler from '../scheduler'
import {  IdleLane, NoLanes } from './lane'
const {

  unstable_getCurrentPriorityLevel: Scheduler_getCurrentPriorityLevel,
  unstable_ImmediatePriority: Scheduler_ImmediatePriority,
  unstable_UserBlockingPriority: Scheduler_UserBlockingPriority,
  unstable_NormalPriority: Scheduler_NormalPriority,
  unstable_LowPriority: Scheduler_LowPriority,
  unstable_IdlePriority: Scheduler_IdlePriority,
} = Scheduler;

const randomKey = Math.random()
  .toString(36)
  .slice(2);
export function getPublicInstance(instance: Element) {
  return instance;
}

export function getPublicRootInstance(container: FiberRoot) {
  if(!container) {
    return;
  }
  const containerFiber = container.current;
  if (!containerFiber || !containerFiber.child) {
    return null;
  }
  switch (containerFiber.child.tag) {
    case HostComponent:
      return getPublicInstance(containerFiber.child.stateNode);
    default:
      return containerFiber.child.stateNode;
  }
}
const internalContainerInstanceKey = '__reactContainer$' + randomKey;

export function markContainerAsRoot(hostRoot: Fiber|null, node: Container): void {
  
  node[internalContainerInstanceKey] = hostRoot;
}

// const initialTimeMs: number = Scheduler_now();
// export const now =
//   initialTimeMs < 10000 ? Scheduler_now : () => Scheduler_now() - initialTimeMs;
export function requestEventTime() {
  return Date.now(); // todo
}


// Except for NoPriority, these correspond to Scheduler priorities. We use
// ascending numbers so we can compare them like numbers. They start at 90 to
// avoid clashing with Scheduler's priorities.
export const ImmediatePriority: ReactPriorityLevel = 99;
export const UserBlockingPriority: ReactPriorityLevel = 98;
export const NormalPriority: ReactPriorityLevel = 97;
export const LowPriority: ReactPriorityLevel = 96;
export const IdlePriority: ReactPriorityLevel = 95;
// NoPriority is the absence of priority. Also React-only.
export const NoPriority: ReactPriorityLevel = 90;

// 这个函数将scheduler优先级转化为react优先级
export function getCurrentPriorityLevel(): ReactPriorityLevel {
  switch (Scheduler_getCurrentPriorityLevel()) {
    case Scheduler_ImmediatePriority:
      return ImmediatePriority;
    case Scheduler_UserBlockingPriority:
      return UserBlockingPriority;
    case Scheduler_NormalPriority:
      return NormalPriority;
    case Scheduler_LowPriority:
      return LowPriority;
    case Scheduler_IdlePriority:
      return IdlePriority;
    default:
      return -1// todo
  }
}

export const emptyContextObject = {};
export function getContextForSubtree(
  parentComponent: any,
): Object {
  if (!parentComponent) {
    return emptyContextObject;
  }
  return emptyContextObject;
  // const fiber = getInstance(parentComponent);
  // const parentContext = findCurrentUnmaskedContext(fiber);

  // if (fiber.tag === ClassComponent) {
  //   const Component = fiber.type;
  //   if (isLegacyContextProvider(Component)) {
  //     return processChildContext(fiber, Component, parentContext);
  //   }
  // }

  // return parentContext;
}

//markRootUpdated 将updateLane更新到pendingLanes， 并将suspendedLanes ，
//pingedLanes 首先与小于的updateLane(updateLane -1)区并，再进行更行, 并更新updateLane 对应的eventTime
export function markRootUpdated(
  root: FiberRoot,
  updateLane: Lane,
  eventTime: number,
) {
  root.pendingLanes |= updateLane;

  // If there are any suspended transitions, it's possible this new update
  // could unblock them. Clear the suspended lanes so that we can try rendering
  // them again.
  //
  // TODO: We really only need to unsuspend only lanes that are in the
  // `subtreeLanes` of the updated fiber, or the update lanes of the return
  // path. This would exclude suspended updates in an unrelated sibling tree,
  // since there's no way for this update to unblock it.
  //
  // We don't do this if the incoming update is idle, because we never process
  // idle updates until after all the regular updates have finished; there's no
  // way it could unblock a transition.
  if (updateLane !== IdleLane) {
    root.suspendedLanes = NoLanes;
    root.pingedLanes = NoLanes;
  }

  const eventTimes = root.eventTimes;
  const index = laneToIndex(updateLane);
  // We can always overwrite an existing timestamp because we prefer the most
  // recent event, and we assume time is monotonically increasing.
  eventTimes[index] = eventTime;
}

const clz32 = Math.clz32 ? Math.clz32 : clz32Fallback;
function pickArbitraryLaneIndex(lanes: Lanes) {
  return 31 - clz32(lanes);
}

function laneToIndex(lane: Lane) {
  return pickArbitraryLaneIndex(lane);
}
const log = Math.log;
const LN2 = Math.LN2;
function clz32Fallback(lanes: Lanes | Lane) {
  if (lanes === 0) {
    return 32;
  }
  return (31 - ((log(lanes) / LN2) | 0)) | 0;
}

export function shouldSetTextContent(type: string, props: Props): boolean {
  if(!props) {
    return false
  }
  return (
    type === 'textarea' ||
    type === 'option' ||
    type === 'noscript' ||
    typeof props.children === 'string' ||
    typeof props.children === 'number' ||
    (typeof props.dangerouslySetInnerHTML === 'object' &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}


export function prepareForCommit(containerInfo: Container): Object | null {
  // eventsEnabled = ReactBrowserEventEmitterIsEnabled();
  // selectionInformation = getSelectionInformation();
  let activeInstance = null;
  // if (enableCreateEventHandleAPI) {
  //   const focusedElem = selectionInformation.focusedElem;
  //   if (focusedElem !== null) {
  //     activeInstance = getClosestInstanceFromNode(focusedElem);
  //   }
  // }
  // ReactBrowserEventEmitterSetEnabled(false);
  return activeInstance;
}
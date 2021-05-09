import { FiberRoot, HostComponent, Fiber, 
  Container, ReactPriorityLevel, 
  Instance,TextInstance, SuspenseInstance , ReactScopeInstance,
  Lane, Lanes, Props}  from '../type/index'
import Scheduler from '../scheduler'
import {  IdleLane, NoLanes } from './lane'
const {

  unstable_getCurrentPriorityLevel: Scheduler_getCurrentPriorityLevel,
  unstable_ImmediatePriority: Scheduler_ImmediatePriority,
  unstable_UserBlockingPriority: Scheduler_UserBlockingPriority,
  unstable_NormalPriority: Scheduler_NormalPriority,
  unstable_LowPriority: Scheduler_LowPriority,
  unstable_IdlePriority: Scheduler_IdlePriority,
  unstable_now: Scheduler_now
} = Scheduler;

const randomKey = Math.random()
  .toString(36)
  .slice(2);
export function getPublicInstance(instance: Element) {
  return instance;
}

/**
 * 
 * @param container root节点
 * @returns 渲染之后的整个dom树
 */
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
const internalInstanceKey = '__reactFiber$' + randomKey;
const internalPropsKey = '__reactProps$' + randomKey;
const internalEventHandlersKey = '__reactEvents$' + randomKey;
const internalEventHandlerListenersKey = '__reactListeners$' + randomKey;
const internalEventHandlesSetKey = '__reactHandles$' + randomKey;
export function markContainerAsRoot(hostRoot: Fiber|null, node: Container): void {
  
  node[internalContainerInstanceKey] = hostRoot;
}

export function updateFiberProps(
  node:  {[key: string]: any} ,
  props: Props,
): void {
  node[internalPropsKey] = props;
}
export function precacheFiberNode(
  hostInst: Fiber,
  node: Instance | TextInstance | SuspenseInstance | ReactScopeInstance,
): void {
  node[internalInstanceKey] = hostInst;
}
const initialTimeMs: number = Scheduler_now();
export const now =
  initialTimeMs < 10000 ? Scheduler_now : () => Scheduler_now() - initialTimeMs;



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


//markRootUpdated 将updateLane更新到pendingLanes， 并将suspendedLanes ，
//pingedLanes 首先与小于的updateLane(updateLane -1)区并，再进行更行, 并更新updateLane 对应的eventTime
export function markRootUpdated(
  root: FiberRoot,
  updateLane: Lane,
  eventTime: number,
) {
  root.pendingLanes |= updateLane;
  console.log('root pendingLanes被赋值', {...root})

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

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32
 * 按照二进制 计算第一个1出现的位置前边有多少个0 
 * 比如1 -> 0000 0000 0000 0000 0000 0000 0000 0001  clz32(1) = 31  clz32(2) = 30 clz32(3) 
*/
const clz32 = Math.clz32 ? Math.clz32 : clz32Fallback;
/**
 * 
*/
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


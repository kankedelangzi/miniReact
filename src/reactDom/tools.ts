import { FiberRoot, HostComponent, Fiber, Container, ReactPriorityLevel}  from '../type/index'
import Scheduler from '../scheduler'


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
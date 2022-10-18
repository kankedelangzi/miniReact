import  { FiberRoot } from '../type'

const NESTED_UPDATE_LIMIT = 50;
let nestedUpdateCount: number = 0;
let rootWithNestedUpdates: FiberRoot | null = null;
export function checkForNestedUpdates() {
  // nextedUpdateCount是在renderRootSync 中执行自增操作的，目前不考虑
  if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
    nestedUpdateCount = 0;
    rootWithNestedUpdates = null;
    throw new Error('调用栈溢出')
  }
}

export type ReactPriorityLevel = 99 | 98 | 97 | 96 | 95 | 90;

export function getCurrentPriorityLevel(): ReactPriorityLevel {
  // switch (Scheduler_getCurrentPriorityLevel()) {
  //   case Scheduler_ImmediatePriority:
  //     return ImmediatePriority;
  //   case Scheduler_UserBlockingPriority:
  //     return UserBlockingPriority;
  //   case Scheduler_NormalPriority:
  //     return NormalPriority;
  //   case Scheduler_LowPriority:
  //     return LowPriority;
  //   case Scheduler_IdlePriority:
  //     return IdlePriority;
  //   default:
  //     invariant(false, 'Unknown priority level.');
  // }
  return 99;
}


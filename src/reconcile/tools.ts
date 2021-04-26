import  { FiberRoot, StackCursor } from '../type'
import { ImmediatePriority} from '../scheduler/propity'
const NESTED_UPDATE_LIMIT = 50;
let nestedUpdateCount: number = 0;
let rootWithNestedUpdates: FiberRoot | null = null;
export function checkForNestedUpdates() {
  if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
    nestedUpdateCount = 0;
    rootWithNestedUpdates = null;
    throw new Error('调用栈溢出')
  }
}
type ReactPriorityLevel = number
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
  return ImmediatePriority
}



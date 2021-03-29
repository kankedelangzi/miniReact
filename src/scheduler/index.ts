/* eslint-disable import/no-anonymous-default-export */
import { NormalPriority, ImmediatePriority, UserBlockingPriority,LowPriority, IdlePriority} from './propity'
var currentPriorityLevel = NormalPriority;

function unstable_getCurrentPriorityLevel() {
  return currentPriorityLevel;
}
function unstable_runWithPriority(priorityLevel: any, eventHandler: any) {
  console.log(priorityLevel)
  return eventHandler();
}
export default {
  unstable_ImmediatePriority: ImmediatePriority,
  unstable_runWithPriority: unstable_runWithPriority,
  unstable_scheduleCallback: null,
  unstable_cancelCallback: null,
  unstable_shouldYield: null,
  unstable_requestPaint: null,
  unstable_now: null,
  unstable_getCurrentPriorityLevel: unstable_getCurrentPriorityLevel,
  unstable_UserBlockingPriority: UserBlockingPriority,
  unstable_NormalPriority: NormalPriority,
  unstable_LowPriority: LowPriority,
  unstable_IdlePriority: IdlePriority,
}
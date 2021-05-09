import { now } from "./tools";
import { Cxt, RenderContext, CommitContext, NoContext } from "./context";
import { FiberRoot } from "../type";
export const NoTimestamp = -1;// TODO
interface WorkInProgressConstant {
  workInProgressRootRenderTargetTime: number;
  workInProgressRoot: FiberRoot | null
}
export const WorkIn: WorkInProgressConstant = {
  workInProgressRootRenderTargetTime: Infinity,
  workInProgressRoot: null
}

const RENDER_TIMEOUT_MS = 500;
let currentEventTime: number = NoTimestamp;

export function resetRenderTimer() {
  WorkIn.workInProgressRootRenderTargetTime = now() + RENDER_TIMEOUT_MS;
}
export function requestEventTime() {

  if ((Cxt.executionContext & (RenderContext | CommitContext)) !== NoContext) {
    // We're inside React, so it's fine to read the actual time.
    return now();
  }
  // We're not inside React, so we may be in the middle of a browser event.
  if (currentEventTime !== NoTimestamp) {
    // Use the same start time for all updates until we enter React again.
    return currentEventTime;
  }
  // This is the first update since React yielded. Compute a new start time.
  currentEventTime = now();
  return currentEventTime;
}
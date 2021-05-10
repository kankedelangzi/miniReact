import { now } from "./tools";
import { Cxt, RenderContext, CommitContext, NoContext } from "./context";
import { Fiber, FiberRoot, Lanes } from "../type";
export const NoTimestamp = -1;// TODO
export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;

export type RootExitStatus = 0 | 1 | 2 | 3 | 4 | 5;
export const RootIncomplete = 0;
export const RootFatalErrored = 1;
export const RootErrored = 2;
export const RootSuspended = 3;
export const RootSuspendedWithDelay = 4;
export const RootCompleted = 5;


interface WorkInProgressConstant {
  workInProgressRootRenderTargetTime: number;
  workInProgressRoot: FiberRoot | null;
  workInProgress: Fiber|null
  workInProgressRootRenderLanes: Lanes;
  workInProgressRootExitStatus: RootExitStatus;

}
export const WorkIn: WorkInProgressConstant = {
  workInProgressRootRenderTargetTime: Infinity,
  workInProgressRoot: null,
  workInProgress: null,
  workInProgressRootRenderLanes: NoLanes,
  workInProgressRootExitStatus: RootIncomplete
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
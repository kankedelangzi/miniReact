import { Fiber, Lane, Lanes,FiberRoot,BlockingMode, NoMode, ConcurrentMode, LaneMap } from '../type/index'
import { getCurrentPriorityLevel, ImmediatePriority as ImmediateSchedulerPriority} from './tools'

export const TotalLanes = 31;

export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;

export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000001;
export const SyncBatchedLane: Lane = /*                 */ 0b0000000000000000000000000000010;

export const InputDiscreteHydrationLane: Lane = /*      */ 0b0000000000000000000000000000100;
export const InputDiscreteLane: Lanes = /*              */ 0b0000000000000000000000000001000;

const InputContinuousHydrationLane: Lane = /*           */ 0b0000000000000000000000000010000;
export const InputContinuousLane: Lanes = /*            */ 0b0000000000000000000000000100000;

export const DefaultHydrationLane: Lane = /*            */ 0b0000000000000000000000001000000;
export const DefaultLane: Lanes = /*                    */ 0b0000000000000000000000010000000;

const TransitionHydrationLane: Lane = /*                */ 0b0000000000000000000000100000000;
const TransitionLanes: Lanes = /*                       */ 0b0000000011111111111111000000000;
const TransitionLane1: Lane = /*                        */ 0b0000000000000000000001000000000;
const TransitionLane2: Lane = /*                        */ 0b0000000000000000000010000000000;
const TransitionLane3: Lane = /*                        */ 0b0000000000000000000100000000000;
const TransitionLane4: Lane = /*                        */ 0b0000000000000000001000000000000;
const TransitionLane5: Lane = /*                        */ 0b0000000000000000010000000000000;
const TransitionLane6: Lane = /*                        */ 0b0000000000000000100000000000000;
const TransitionLane7: Lane = /*                        */ 0b0000000000000001000000000000000;
const TransitionLane8: Lane = /*                        */ 0b0000000000000010000000000000000;
const TransitionLane9: Lane = /*                        */ 0b0000000000000100000000000000000;
const TransitionLane10: Lane = /*                       */ 0b0000000000001000000000000000000;
const TransitionLane11: Lane = /*                       */ 0b0000000000010000000000000000000;
const TransitionLane12: Lane = /*                       */ 0b0000000000100000000000000000000;
const TransitionLane13: Lane = /*                       */ 0b0000000001000000000000000000000;
const TransitionLane14: Lane = /*                       */ 0b0000000010000000000000000000000;

const RetryLanes: Lanes = /*                            */ 0b0000111100000000000000000000000;
const RetryLane1: Lane = /*                             */ 0b0000000100000000000000000000000;
const RetryLane2: Lane = /*                             */ 0b0000001000000000000000000000000;
const RetryLane3: Lane = /*                             */ 0b0000010000000000000000000000000;
const RetryLane4: Lane = /*                             */ 0b0000100000000000000000000000000;

export const SomeRetryLane: Lane = RetryLane1;

export const SelectiveHydrationLane: Lane = /*          */ 0b0001000000000000000000000000000;

const NonIdleLanes = /*                                 */ 0b0001111111111111111111111111111;

export const IdleHydrationLane: Lane = /*               */ 0b0010000000000000000000000000000;
export const IdleLane: Lanes = /*                              */ 0b0100000000000000000000000000000;

export const OffscreenLane: Lane = /*                   */ 0b1000000000000000000000000000000;

export const NoContext = /*             */ 0b0000000;
const BatchedContext = /*               */ 0b0000001;
const EventContext = /*                 */ 0b0000010;
const DiscreteEventContext = /*         */ 0b0000100;
const LegacyUnbatchedContext = /*       */ 0b0001000;
export const RenderContext = /*                */ 0b0010000;
const CommitContext = /*                */ 0b0100000;
export const RetryAfterError = /*       */ 0b1000000;

function getHighestPriorityLane(lanes: Lanes) {
  return lanes & -lanes;
}


export function pickArbitraryLane(lanes: Lanes): Lane {
  // This wrapper function gets inlined. Only exists so to communicate that it
  // doesn't matter which bit is selected; you can pick any bit without
  // affecting the algorithms where its used. Here I'm using
  // getHighestPriorityLane because it requires the fewest operations.
  return getHighestPriorityLane(lanes);
}


type ExecutionContext = number;

export const executionContext: ExecutionContext = NoContext;

let workInProgressRootRenderLanes: Lanes = NoLanes;

export const deferRenderPhaseUpdateToNextBatch = true;

export function requestUpdateLane(fiber: Fiber): Lane {
  const mode = fiber.mode;
  if ((mode & BlockingMode) === NoMode) {
    return (SyncLane as Lane);
  } else if ((mode & ConcurrentMode) === NoMode) {
    return getCurrentPriorityLevel() === ImmediateSchedulerPriority ? 
    (SyncLane as Lane) : (SyncBatchedLane as Lane);
  } else if (
    !deferRenderPhaseUpdateToNextBatch &&
    (executionContext & RenderContext) !== NoContext &&
    workInProgressRootRenderLanes !== NoLanes
  ) {
   
    return pickArbitraryLane(workInProgressRootRenderLanes);
  }
  // todo
  return SyncLane;
}
export function createLaneMap<T>(initial: T): LaneMap<T> {
  // Intentionally pushing one by one.
  // https://v8.dev/blog/elements-kinds#avoid-creating-holes
  const laneMap = [];
  for (let i = 0; i < TotalLanes; i++) {
    laneMap.push(initial);
  }
  return laneMap;
}


// 当前不完整
export function getNextLanes(root: FiberRoot, wipLanes: Lanes): Lanes{
  const pendingLanes = root.pendingLanes;
  if (pendingLanes === NoLanes) {
    // return_highestLanePriority = NoLanePriority;
    return NoLanes;
  }
  let nextLanes = NoLanes;
  return  nextLanes;

}
export function mergeLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a | b;
}
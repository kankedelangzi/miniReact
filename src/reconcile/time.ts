import { Fiber } from "../type";
import { enableProfilerCommitHooks, enableProfilerTimer } from "../type/constant";
import  Scheduler  from "../scheduler/index";
const {unstable_now: now} = Scheduler;
let commitTime: number = 0;
let layoutEffectStartTime: number = -1;
let profilerStartTime: number = -1;
let passiveEffectStartTime: number = -1;

interface Time {
  passiveEffectStartTime: number
}
export const Time = {
  passiveEffectStartTime: -1
}


export function stopProfilerTimerIfRunning(fiber: Fiber): void {
  if (!enableProfilerTimer) {
    return;
  }
  profilerStartTime = -1;
}

export function startLayoutEffectTimer(): void {
  if (!enableProfilerTimer || !enableProfilerCommitHooks) {
    return;
  }
  layoutEffectStartTime = now();
}


export function getCommitTime(): number {
  return commitTime;
}

export function recordCommitTime(): void {
  if (!enableProfilerTimer) {
    return;
  }
  commitTime = now();
}

export function startProfilerTimer(fiber: Fiber): void {
  if (!enableProfilerTimer) {
    return;
  }

  profilerStartTime = now();

  if (!fiber.actualStartTime || fiber.actualStartTime < 0) {
    fiber.actualStartTime = now();
  }
}


export function stopProfilerTimerIfRunningAndRecordDelta(
  fiber: Fiber,
  overrideBaseTime: boolean,
): void {
  if (!enableProfilerTimer) {
    return;
  }

  if (profilerStartTime >= 0) {
    const elapsedTime = now() - profilerStartTime;
    if(fiber.actualDuration) {
      fiber.actualDuration += elapsedTime;
    } else {
      fiber.actualDuration = -1 + elapsedTime;
    }
   
    if (overrideBaseTime) {
      fiber.selfBaseDuration = elapsedTime;
    }
    profilerStartTime = -1;
  }
}
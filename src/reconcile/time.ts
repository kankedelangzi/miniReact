import { Fiber } from "../type";
import { enableProfilerCommitHooks, enableProfilerTimer } from "../type/constant";
import  Scheduler  from "../scheduler/index";
const {unstable_now: now} = Scheduler;
let commitTime: number = 0;
let layoutEffectStartTime: number = -1;
let profilerStartTime: number = -1;
let passiveEffectStartTime: number = -1;


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
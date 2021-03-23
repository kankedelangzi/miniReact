import { Fiber, UpdateQueue, Update, Lane, Lanes, FiberRoot, BlockingMode, NoMode} from '../type'
import { NoLanes, executionContext, RenderContext, NoContext } from './lane'

export const UpdateState = 0;
export const ReplaceState = 1;
export const ForceUpdate = 2;
export const CaptureUpdate = 3;


export function initializeUpdateQueue<State>(fiber: Fiber): void {
  const queue: UpdateQueue<State> = {
    baseState: fiber.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: {
      pending: null,
      interleaved: null,
      lanes: NoLanes,
    },
    effects: null,
  };
  fiber.updateQueue = queue;
}

export function createUpdate(eventTime: number, lane: Lane): Update<any> {
  const update: Update<any> = {
    eventTime,
    lane,

    tag: UpdateState,
    payload: null,
    callback: null,

    next: null,
  };
  return update;
}
export type SharedQueue<State> = {
  pending: Update<any> | null,
  interleaved: Update<State> | null,
  lanes: Lanes,
};
//每次setState都会update，每次update，都会入updateQueue
//current即fiber
// 主体逻辑： 在rootFiber updateQueue 增加update
export function enqueueUpdate( fiber: Fiber,update: Update<any>,lane: Lane,) {
   // 当前更新的updateQueue
  const updateQueue = fiber.updateQueue;
   // fiber 没有被挂载
  if (updateQueue === null) {
    // Only occurs if the fiber has been unmounted.
    return;
  }
  // 共享的queue
  const sharedQueue: SharedQueue<any> = (updateQueue).shared;
  if (isInterleavedUpdate(fiber, lane)) {
    //
    console.log(1)
  } else {
    //
    const pending = sharedQueue.pending;
    if (pending === null) {
      // This is the first update. Create a circular list.
       // This is the first update. Create a circular list.
      // 这是第一次更新，创建一个循环单链表
      update.next = update;
      // 最终结构为sharedQueue.pending = update
      //    update.next = update   循环指向自己
      // 只有一个 update1 
      // sharedQueue.pending = update1
      // update1.next = update1
    } else {
       // 优先级更高， 插入到pending 之后
      update.next = pending.next;
      // 将update 插入在pending 与pending.next 中间
      pending.next = update;
      // pending  --next-->    update --next-->   pending.next 中间 
    // 双重指向， 指向自己
    //  update -next->   pending.next 
    // sharedQueue.pending = update;
    // update1 update2   2个
    //  sharedQueue.pending = update2; update2.next = update1; update1.next= update2
    // update1 update2 update3  3个
    //  sharedQueue.pending = update3; update3.next = update1; update1.next= update2; update2.next= update3;
    // ......
    }
     // 等待更新的
    sharedQueue.pending = update;
  }

}
let workInProgressRoot: FiberRoot | null = null;
export const deferRenderPhaseUpdateToNextBatch = true;

export function isInterleavedUpdate(fiber: Fiber, lane: Lane) {
  return (
    // TODO: Optimize slightly by comparing to root that fiber belongs to.
    // Requires some refactoring. Not a big deal though since it's rare for
    // concurrent apps to have more than a single root.
    workInProgressRoot !== null &&
    (fiber.mode & BlockingMode) !== NoMode &&
    // If this is a render phase update (i.e. UNSAFE_componentWillReceiveProps),
    // then don't treat this as an interleaved update. This pattern is
    // accompanied by a warning but we haven't fully deprecated it yet. We can
    // remove once the deferRenderPhaseUpdateToNextBatch flag is enabled.
    (deferRenderPhaseUpdateToNextBatch ||
      (executionContext & RenderContext) === NoContext)
  );
}

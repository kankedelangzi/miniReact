import { Fiber, UpdateQueue, Update, Lane, Lanes, FiberRoot, BlockingMode, NoMode} from '../type'
import { NoLanes,  } from './lane'
import { Cxt, RenderContext, NoContext } from "./context";

export const UpdateState = 0;
export const ReplaceState = 1;
export const ForceUpdate = 2;
export const CaptureUpdate = 3;


export function initializeUpdateQueue<State>(fiber: Fiber): void {
  const queue: UpdateQueue<State> = {
    // 前一次更新计算得出的状态，它是第一个被跳过的update之前的那些update计算得出的state。会以它为基础计算本次的state
    baseState: fiber.memoizedState,
    // 前一次更新时updateQueue中第一个被跳过的update对象
    firstBaseUpdate: null,
    // 前一次更新中，updateQueue中以第一个被跳过的update为起点一直到的最后一个update截取的队列中的最后一个update
    lastBaseUpdate: null,
    // 存储着本次更新的update队列，是实际的updateQueue。
    // shared的意思是current节点与workInProgress节点共享一条更新队列。
    shared: { 
      pending: null,
      interleaved: null,
      lanes: NoLanes,
    },
    effects: null,// 数组。保存update.callback !== null的Update
  };
  fiber.updateQueue = queue;
}

export function createUpdate(eventTime: number, lane: Lane): Update<any> {
  const update: Update<any> = {
    eventTime,// update的产生时间，若该update一直因为优先级不够而得不到执行，那么它会超时，会被立刻执行
    lane,// update的优先级，即更新优先级

    tag: UpdateState,//表示更新是哪种类型（UpdateState，ReplaceState，ForceUpdate，CaptureUpdate）
    payload: null, // 根组件中是React.element，即ReactDOM.render的第一个参数 ----类组件中：有两种可能，对象（{}），和函数（(prevState, nextProps):newState => {}）
    callback: null,// 可理解为setState的回调

    next: null,// 指向下一个update的指针
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
/**

  关于更新队列为什么是环状。?
  这是因为方便定位到链表的第一个元素。updateQueue指向它的最后一个update，updateQueue.next指向它的第一个update。
  试想一下，若不使用环状链表，updateQueue指向最后一个元素，需要遍历才能获取链表首部。即使将updateQueue指向第一个元素，
  那么新增update时仍然要遍历到尾部才能将新增的接入链表。而环状链表，只需记住尾部，无需遍历操作就可以找到首部


 */
export function enqueueUpdate( fiber: Fiber,update: Update<any>,lane: Lane,) {
   // 当前更新的updateQueue
  const updateQueue = fiber.updateQueue;
   // fiber 没有被挂载
  if (updateQueue === null) {
    // Only occurs if the fiber has been unmounted.
    return;
  }
  // 
  const sharedQueue: SharedQueue<any> = (updateQueue).shared;
  // debugger
  if (isInterleavedUpdate(fiber, lane)) {
    //
    console.log(1)
  } else {
    //  ppending是真正的updateQueue，存储update
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
      // 有元素，现有队列（pending）指向的是链表的尾部update，
     // pending.next就是头部update，新update会放到现有队列的最后
     // 并首尾相连
     // 将新队列的尾部（新插入的update）的next指向队列的首部，实现
     // 首位相连
      update.next = pending.next;
    
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
      (Cxt.executionContext & RenderContext) === NoContext)
  );
}




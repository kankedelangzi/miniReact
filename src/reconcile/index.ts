import { Fiber, Lane, FiberRoot, HostRoot } from '../type'
import { checkForNestedUpdates } from './tools'
import { markRootUpdated } from '../reactDom/tools'
import { ensureRootIsScheduled, mergeLanes, SyncLane} from '../reactDom/lane'
import { performSyncWorkOnRoot } from './commit'
import { WorkIn } from '../reactDom/workInprogress'
import { CommitContext, Cxt, LegacyUnbatchedContext, NoContext, RenderContext } from '../reactDom/context'
import { schedulePendingInteractions } from '../reactDom/scheduler'
export function scheduleUpdateOnFiber( fiber: Fiber,  // 触发fiber 
  lane: Lane,  // 更新的lane
  eventTime: number,  //触发更新的时间
): FiberRoot | null {
  // 检查是否溢出
  checkForNestedUpdates();
  // dev环境忽略
  // warnAboutRenderPhaseUpdatesInDEV(fiber);
  // 处理 render中调用setState

  console.log('scheduleUpdateOnFiber',fiber)
  
  // 从产生更新的节点开始，往上一直循环到root，目的是将fiber.lanes一直向上收集，
  // 收集到父级节点的childLanes中，childLanes是识别这个fiber子树是否需要更新的关键。
  //如果fiber.lanes不为空，则说明该fiber节点有更新，而fiber.childLanes是判断当前子树是否有更新的重要依据，若有更新，则继续向下构建，
  // 否则直接复用已有的fiber树，就不往下循环了，可以屏蔽掉那些无需更新的fiber节点。
  // TODO这样做的目的是什么--> 首次渲染这个忽略。这里要从useEffect这些操作中看，比如在某个子节点触发useEffect  
  // TODO 这时候那个节点的Fiber会添加 MountPassiveDevEffect | PassiveEffect | PassiveStaticEffect这些lane
  // TODO 通过这个函数，将这个节点上的所有父节点的childLanes上添加这些lane。 这样从root开始就产生了一条具有这些lane的
  // TODO 链条， 作者将此比作圣诞树🎄上的彩灯， 这些彩灯就是接下来执行时需要去处理的副作用
  //
  const root = markUpdateLaneFromFiberToRoot(fiber, lane);
  // root 不存在时， 开发报错  fiberRoot 
  if (root === null) {
    // warnAboutUpdateOnUnmountedFiberInDEV(fiber); // 这个函数只在dev环境报错暂时注释
    return null;
  }

  // 在root上标记更新，也就是将update的lane放到root.pendingLanes中，
  // 每次渲染的优先级基准：renderLanes就是取自root.pendingLanes中最紧急的那一部分lanes。
  //
  markRootUpdated(root, lane, eventTime);
  // 如果当前是workInProget
  // 已经在进行调度

  // 获取当前环境的优先级

  // executionContext  执行环境  同步更新时
  
  if (root === WorkIn.workInProgressRoot) {
    // 
    console.log('root === workInProgressRoot')
  }

  if(lane === SyncLane) {
    // 同步更新的时候
    //初始化非批量同步更新
    // Cxt.executionContext 在unbatchedUpdates中切换为LegacyUnbatchedContext上下文
    // 在renderRootSync 中切换为RenderContext上下文  
    // 在flushPassiveEffectsImpl  中切换为CommitContext上下文
    if( (Cxt.executionContext & LegacyUnbatchedContext) !== NoContext &&
    (Cxt.executionContext & (RenderContext | CommitContext)) === NoContext) {
      // 如果是本次更新是同步的，并且当前还未渲染，意味着主线程空闲--> NoContext，并没有React的
      // 更新任务在执行，那么调用performSyncWorkOnRoot开始执行同步任务
      schedulePendingInteractions(root, lane) 
      performSyncWorkOnRoot(root);
    } else {
      // 如果是本次更新是同步的，不过当前有React更新任务正在进行，
      // 而且因为无法打断，所以调用ensureRootIsScheduled
      // 目的是去复用已经在更新的任务，让这个已有的任务
      // 把这次更新顺便做了
      schedulePendingInteractions(root, lane)
      ensureRootIsScheduled(root, eventTime);
    }
    
  } else {
    // 异步的更新的时候
    
  }

  
  return root;

}

/**
 * 从触发状态更新的fiber一直向上遍历到rootFiber，并返回rootFiber。
 * 由于不同更新优先级不尽相同，所以过程中还会更新遍历到的fiber的优先级
 * @param sourceFiber 
 * @param lane 
 * @returns 
 */

function markUpdateLaneFromFiberToRoot( sourceFiber: Fiber,lane: Lane,): FiberRoot|null {
  sourceFiber.lanes = mergeLanes(sourceFiber.lanes, lane);
// debugger
  let alternate = sourceFiber.alternate;
  // 这里只是改变了待更新的fiber的lanes
  if (alternate !== null) {
    alternate.lanes = mergeLanes(alternate.lanes, lane);
  }

  console.log('alternate',alternate)
  let node = sourceFiber;
  let parent = sourceFiber.return;
  // 请注意这个过程中只改变了childlanes 没有改变lanes
  // 从产生更新的fiber节点开始，向上收集childLanes,这样只要看到根节点的额
  // childlanes不是NoLanes就可以知道其子节点有更新,便可以沿着这个链条向下访问直到找到对应的fiber几点
  // 执行对应的更新操作
  while(parent !== null) {
    // 这个地方画图理解
    parent.childLanes = mergeLanes(parent.childLanes, lane);
    alternate = parent.alternate;
    if (alternate !== null) {
      alternate.childLanes = mergeLanes(alternate.childLanes, lane);
    } 
    // do some things
    node = parent;
    parent = parent.return;
  }
  if (node.tag === HostRoot) {
    const root: FiberRoot = node.stateNode;
    return root;
  } else {
    return null;
  }
}
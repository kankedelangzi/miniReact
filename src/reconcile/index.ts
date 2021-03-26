import { Fiber, Lane, FiberRoot, HostRoot } from '../type'
import { checkForNestedUpdates } from './tools'
import { markRootUpdated } from '../reactDom/tools'
import { SyncLane} from '../reactDom/lane'
import { performSyncWorkOnRoot } from './commit'
export function scheduleUpdateOnFiber( fiber: Fiber,  // 触发fiber 
  lane: Lane,  // 更新的lane
  eventTime: number,  //触发更新的时间
): FiberRoot | null {
  // 检查是都溢出
  checkForNestedUpdates();
  // 处理 render中调用setState


  // 找寻fiberRoot, 并标识所有父fiber de childLanes
  // 1 标示source fiber 的lanes    sourrce 的alter的alne
  // 2 标示source fiber  所有父节点的 childLanes 对应 alternate 的childLanes
  // 3  返回fiberROot
  const root = markUpdateLaneFromFiberToRoot(fiber, lane);
  // root 不存在时， 开发报错  fiberRoot 
  if (root === null) {
    // warnAboutUpdateOnUnmountedFiberInDEV(fiber); // 这个函数只在dev环境报错暂时注释
    return null;
  }

  // 标示现在root 具有一个d等待的更新
  markRootUpdated(root, lane, eventTime);
  // 如果当前是workInProget
  // 已经在进行调度

  // 获取当前环境的优先级

  // executionContext  执行环境  同步更新时
  
  if(lane === SyncLane) {
    // 同步更新的时候
    //初始化非批量同步更新
    performSyncWorkOnRoot(root);
  } else {
    // 异步的更新的时候
    
  }

  
  return root;

}


function markUpdateLaneFromFiberToRoot( sourceFiber: Fiber,lane: Lane,): FiberRoot|null {
  let alternate = sourceFiber.alternate;
  console.log(alternate)
  let node = sourceFiber;
  let parent = sourceFiber.return;
  while(parent !== null) {
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
import { FiberRoot, ReactPriorityLevel,Fiber, 
  Placement,Update , Hydrating, PlacementAndUpdate,
  HostComponent, HostRoot,HostPortal,
  HostText,DehydratedFragment,Instance,
  HydratingAndUpdate,
  Container,
  BeforeMutationMask, NoFlags, MutationMask } from '../type/index'
import { getCurrentPriorityLevel } from './tools'
import { NoLanes}  from '../reactDom/lane'
import { ImmediatePriority as  ImmediateSchedulerPriority, prepareForCommit} from '../reactDom/tools'
import { ImmediatePriority } from '../scheduler/propity'
import Scheduler from '../scheduler/index'
import { insertInContainerBefore, appendChildToContainer, insertBefore, appendChild } from '../reactDom/domOperation'
const { unstable_runWithPriority  } = Scheduler
const Scheduler_runWithPriority = unstable_runWithPriority
let nextEffect: Fiber | null = null;

//获取当前优先级， 调用runWithPriority ， 传入的函数的参数第一个为最高的优先级,
// 第二个参数commitRootImpl 为执行的函数
export function commitRoot(root: FiberRoot) {
  // 优先级
  // getCurrentPriorityLevel 表示获得当前执行优先级
  const renderPriorityLevel = getCurrentPriorityLevel() as ReactPriorityLevel;
  // 以指定的优选级执行函数 commitRootImpl 方法
  // ImmediateSchedulerPriority 是最高优先级，表示立即执行 commitRootImpl 方法
  runWithPriority(
    ImmediateSchedulerPriority,  // 最高的优先级  // 立即 99
    commitRootImpl.bind(null, root, renderPriorityLevel),
  );
  return null;
}

export function runWithPriority<T>(
  reactPriorityLevel: ReactPriorityLevel,
  fn: () => T,
): T {
  // const priorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel);
  const priorityLevel = ImmediatePriority
  return Scheduler_runWithPriority(priorityLevel, fn);
}


function commitRootImpl(root: FiberRoot, renderPriorityLevel: ReactPriorityLevel) {
  // finishedWork ， finishedLanes
   // 获得 root 上的 finishedWork，这个就是前面调度更新的结果
   debugger
   const finishedWork = root.finishedWork;
   const lanes = root.finishedLanes;
   // //表示该节点没有要更新的任务，直接 return
  if (finishedWork === null) {
   
     return null;
   }
  // commitRoot永远不会反回延续；它总是同步完成的
  // 因此，我们现在可以清除这些内容以允许安排新的回调。
  // 对 root 上的 finishedWork 和 expirationTime reset
  root.finishedWork = null;  // 清空
  root.finishedLanes = NoLanes;  // 清空


   // 提交阶段分为几个子阶段。
    // 根据子阶段将 effect 链做了分隔，所有的 mutation(突变) effect 都在所有的 layout effect 之前
    
    // commit阶段分为几个子阶段。
    // 我们对每个节点的副作用列表都要做一次对应的处理：
    // 所有的mutation effects都比layout effects优先
 
    // 第一个阶段叫做”before mutation“阶段（mutate应该是指DOM树host tree已经构建完成了在内存中存储但是还未append到根容器）
    // 我们用这个阶段去读取host tree的状态在我们mutate它之前
    // 在这个阶段会调用getSnapshotBeforeUpdate
    // focusedInstanceHandle = prepareForCommit(root.containerInfo);
    //更新当前选中的DOM节点，一般为 document.activeElement || document.body
    // shouldFireAfterActiveInstanceBlur = false;

   
    const shouldFireAfterActiveInstanceBlur = commitBeforeMutationEffects(
      root,
      finishedWork,
    );

     // 下一个阶段是”mutation“阶段，在这个阶段我们会把构建好的DOM树（host tree）append到根容器
    // 重要！只有到了这个阶段react的渲染效果才会呈现在浏览器上

    commitMutationEffects(root, renderPriorityLevel, finishedWork);

     // 下一个阶段是“layout”阶段，我们调用副作用方法在host tree被挂载进更容器后。
    // 这个阶段的习惯用法是用于布局，但出于遗留原因，类组件生命周期也会触发
    // commitLayoutEffects(finishedWork, root, lanes);

}

let focusedInstanceHandle: null | Fiber = null;
let shouldFireAfterActiveInstanceBlur: boolean = false;
export function commitBeforeMutationEffects(
  root: FiberRoot,
  firstChild: Fiber,
) {
  focusedInstanceHandle = prepareForCommit(root.containerInfo) as Fiber |null;
  nextEffect = firstChild;

  commitBeforeMutationEffects_begin();

  // We no longer need to track the active instance fiber
  const shouldFire = shouldFireAfterActiveInstanceBlur;
  shouldFireAfterActiveInstanceBlur = false;
  focusedInstanceHandle = null;

  return shouldFire;

}

function commitBeforeMutationEffects_begin() {
  while (nextEffect !== null) {
    const fiber = nextEffect;

    // TODO: Should wrap this in flags check, too, as optimization
    const deletions = fiber.deletions;
    // if (deletions !== null) {
    //   for (let i = 0; i < deletions.length; i++) {
    //     const deletion = deletions[i];
    //     console.log('commit commitBeforeMutationEffectsDeletion')
    //     // commitBeforeMutationEffectsDeletion(deletion);
    //   }
    // }

    const child = fiber.child;
    // 如果当前节点没有子节点进入else 如果有子节点进入if
    console.log('complete in commitBeforeMutationEffects_begin',fiber)
    if (
      (fiber.subtreeFlags & BeforeMutationMask) !== NoFlags &&
      child !== null
    ) {
      // 挂载return指针
      ensureCorrectReturnPointer(child, fiber);
      nextEffect = child;
    } else {
      commitBeforeMutationEffects_complete();
    }
  }
}
// 挂载return
function ensureCorrectReturnPointer(fiber: Fiber, expectedReturnFiber: Fiber) {
  fiber.return = expectedReturnFiber;
}


function commitBeforeMutationEffects_complete() {
  while (nextEffect !== null) {
    const fiber = nextEffect;
 
    try {
      commitBeforeMutationEffectsOnFiber(fiber);
    } catch (error) {
      // captureCommitPhaseError(fiber, fiber.return, error);
    }
    

    const sibling = fiber.sibling;
    if (sibling !== null && fiber.return ) {
      ensureCorrectReturnPointer(sibling, fiber.return);
      nextEffect = sibling;
      return;
    }
    console.log('next effect',nextEffect)
    nextEffect = fiber.return;
  }
}

function commitBeforeMutationEffectsOnFiber(finishedWork: Fiber) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;
  //
}

export function commitMutationEffects(
  root: FiberRoot,
  renderPriorityLevel: ReactPriorityLevel,
  firstChild: Fiber,
) {
  nextEffect = firstChild;
  commitMutationEffects_begin(root, renderPriorityLevel);
}


function commitMutationEffects_begin(
  root: FiberRoot,
  renderPriorityLevel: ReactPriorityLevel,
) {
  while (nextEffect !== null) {
    const fiber = nextEffect;
    const child = fiber.child;
    if ((fiber.subtreeFlags & MutationMask) !== NoFlags && child !== null) {
      ensureCorrectReturnPointer(child, fiber);
      nextEffect = child;
    } else {
      commitMutationEffects_complete(root, renderPriorityLevel);
    }
  }
}

function commitMutationEffects_complete(
  root: FiberRoot,
  renderPriorityLevel: ReactPriorityLevel,
) {
  while (nextEffect !== null) {
    const fiber = nextEffect;
    try {
      commitMutationEffectsOnFiber(fiber, root, renderPriorityLevel);
    } catch (error) {
      // captureCommitPhaseError(fiber, fiber.return, error);
    }
    const sibling = fiber.sibling;
    if (sibling !== null && fiber.return) {
      ensureCorrectReturnPointer(sibling, fiber.return);
      nextEffect = sibling;
      return;
    }

    nextEffect = fiber.return;
  }
}

function commitMutationEffectsOnFiber(
  finishedWork: Fiber,
  root: FiberRoot,
  renderPriorityLevel: ReactPriorityLevel,
) {
  const flags = finishedWork.flags;
  const primaryFlags = flags & (Placement | Update | Hydrating);
  console.log('commit mutation', primaryFlags)
  switch (primaryFlags) {
    case Placement: {
      commitPlacement(finishedWork);
      // Clear the "placement" from effect tag so that we know that this is
      // inserted, before any life-cycles like componentDidMount gets called.
      // TODO: findDOMNode doesn't rely on this any more but isMounted does
      // and isMounted is deprecated anyway so we should be able to kill this.
      finishedWork.flags &= ~Placement;
      break;
    }
    case PlacementAndUpdate: {
      // Placement
      commitPlacement(finishedWork);
      // Clear the "placement" from effect tag so that we know that this is
      // inserted, before any life-cycles like componentDidMount gets called.
      finishedWork.flags &= ~Placement;

      // Update
      const current = finishedWork.alternate;
      commitWork(current, finishedWork);
      break;
    }
    case Hydrating: {
      finishedWork.flags &= ~Hydrating;
      break;
    }
    case HydratingAndUpdate: {
      finishedWork.flags &= ~Hydrating;

      // Update
      const current = finishedWork.alternate;
      commitWork(current, finishedWork);
      break;
    }
    case Update: {
      const current = finishedWork.alternate;
      commitWork(current, finishedWork);
      break;
    }
  }
}

function commitPlacement(finishedWork: Fiber): void {
  // if (!supportsMutation) {
  //   return;
  // }

  // Recursively insert all host nodes into the parent.
  const parentFiber = getHostParentFiber(finishedWork);

  // Note: these two variables *must* always be updated together.
  let parent;
  let isContainer;
  const parentStateNode = parentFiber ? parentFiber.stateNode : {};
  const tag = parentFiber ? parentFiber.tag : 1
  switch (tag) {
    case HostComponent:
      parent = parentStateNode;
      isContainer = false;
      break;
    case HostRoot:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    case HostPortal:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    // eslint-disable-next-line-no-fallthrough
    default:
    
  }
  // if (parentFiber && (parentFiber.flags & ContentReset)) {
  //   // Reset the text content of the parent before doing any insertions
  //   resetTextContent(parent);
  //   // Clear ContentReset from the effect tag
  //   parentFiber.flags &= ~ContentReset;
  // }

  const before = getHostSibling(finishedWork);
  // We only have the top Fiber that was inserted but we need to recurse down its
  // children to find all the terminal nodes.
  if (isContainer && before) {
    insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
  } else if(before) {
    insertOrAppendPlacementNode(finishedWork, before, parent);
  }
}

function getHostParentFiber(fiber: Fiber): Fiber|null {
  let parent = fiber.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
     break
    }
    parent = parent.return;
  }
  return parent;
}
function isHostParent(fiber: Fiber): boolean {
  return (
    fiber.tag === HostComponent ||
    fiber.tag === HostRoot ||
    fiber.tag === HostPortal
  );
}

function getHostSibling(fiber: Fiber):Instance|null {
  // We're going to search forward into the tree until we find a sibling host
  // node. Unfortunately, if multiple insertions are done in a row we have to
  // search past them. This leads to exponential search for the next sibling.
  // TODO: Find a more efficient way to do this.
  let node: Fiber = fiber;
  siblings: while (true) {
    // If we didn't find anything, let's try the next sibling.
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        // If we pop out of the root or hit the parent the fiber we are the
        // last sibling.
        return null;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
    while (
      node.tag !== HostComponent &&
      node.tag !== HostText &&
      node.tag !== DehydratedFragment
    ) {
      // If it is not host node and, we might have a host node inside it.
      // Try to search down until we find one.
      if (node.flags & Placement) {
        // If we don't have a child, try the siblings instead.
        continue siblings;
      }
      // If we don't have a child, try the siblings instead.
      // We also skip portals because they are not part of this host tree.
      if (node.child === null || node.tag === HostPortal) {
        continue siblings;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }
    // Check if this host node is stable or about to be placed.
    if (!(node.flags & Placement)) {
      // Found it!
      return node.stateNode;
    }
  }
}

function insertOrAppendPlacementNodeIntoContainer(
  node: Fiber,
  before?:Instance,
  parent?: Container,
): void {
  const {tag} = node;
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost) {
    const stateNode = isHost ? node.stateNode : node.stateNode.instance;
    if (before && parent) {
      insertInContainerBefore(parent, stateNode, before);
    } else if(parent){
      appendChildToContainer(parent, stateNode);
    }
  } else if (tag === HostPortal) {
    // If the insertion itself is a portal, then we don't want to traverse
    // down its children. Instead, we'll get insertions from each child in
    // the portal directly.
  } else {
    const child = node.child;
    if (child !== null) {
      insertOrAppendPlacementNodeIntoContainer(child, before, parent);
      let sibling = child.sibling;
      while (sibling !== null) {
        insertOrAppendPlacementNodeIntoContainer(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}

function insertOrAppendPlacementNode(
  node: Fiber,
  before?:Instance,
  parent?: Instance,
): void {
  const {tag} = node;
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost) {
    const stateNode = isHost ? node.stateNode : node.stateNode.instance;
    if (before && parent) {
      insertBefore(parent, stateNode, before);
    } else if(parent) {
      appendChild(parent, stateNode);
    }
  } else if (tag === HostPortal) {
    // If the insertion itself is a portal, then we don't want to traverse
    // down its children. Instead, we'll get insertions from each child in
    // the portal directly.
  } else {
    const child = node.child;
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent);
      let sibling = child.sibling;
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}

function commitWork(current: Fiber | null, finishedWork: Fiber): void {
   //
   console.log('commitWork',current, finishedWork)
}
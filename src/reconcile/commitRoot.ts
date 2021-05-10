import { FiberRoot, ReactPriorityLevel,Fiber, 
  Placement,Update , Hydrating, PlacementAndUpdate,
  HostComponent, HostRoot,HostPortal,
  HostText,DehydratedFragment,Instance,ProfileMode,
  Profiler,UpdatePayload,
  HydratingAndUpdate, FunctionComponent,Callback,
  Container,LayoutMask,ForwardRef,SimpleMemoComponent,
  BeforeMutationMask, NoFlags, MutationMask, Lanes, ClassComponent, UpdateQueue, Props, PassiveMask, SuspenseComponent, Snapshot, IncompleteClassComponent, ContentReset, MemoComponent } from '../type/index'

import { NoLanes}  from '../reactDom/lane'
import { getCurrentPriorityLevel, getPublicInstance, ImmediatePriority as  ImmediateSchedulerPriority, prepareForCommit} from '../reactDom/tools'
import { ImmediatePriority } from '../scheduler/propity'
import Scheduler from '../scheduler/index'
import { startLayoutEffectTimer } from "./time";
import { FunctionComponentUpdateQueue, 
  Layout as HookLayout,
  HasEffect as HookHasEffect,
  Passive as HookPassive, enableScopeAPI } from "../type/constant";
import { insertInContainerBefore, appendChildToContainer, insertBefore, appendChild, resetTextContent } from '../reactDom/domOperation'
import { enableProfilerCommitHooks, enableProfilerTimer } from '../type/constant'
import { cEffect, flushPassiveEffects, scheduleCallback,NormalPriority } from './scheduler'
import { clearContainer } from '../reactDom/config'
import { commitUpdate } from '../reactDom/property'
const { unstable_runWithPriority } = Scheduler
const Scheduler_runWithPriority = unstable_runWithPriority
let nextEffect: Fiber | null = null;
export const supportsMutation = true;
//获取当前优先级， 调用runWithPriority ， 传入的函数的参数第一个为最高的优先级,
// 第二个参数commitRootImpl 为执行的函数
export function commitRoot(root: FiberRoot) {
  // 优先级
  // getCurrentPriorityLevel 表示获得当前执行优先级
  console.log('commit root', root)
  // debugger
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
  // 进入commit阶段，先执行一次之前未执行的useEffect
  do {
    // `flushPassiveEffects` will call `flushSyncUpdateQueue` at the end, which
    // means `flushPassiveEffects` will sometimes result in additional
    // passive effects. So we need to keep flushing in a loop until there are
    // no more pending effects.
    // TODO: Might be better if `flushPassiveEffects` did not automatically
    // flush synchronous work at the end, to avoid factoring hazards like this.
    flushPassiveEffects();
  } while (cEffect.rootWithPendingPassiveEffects !== null);
  // finishedWork ， finishedLanes
   // 获得 root 上的 finishedWork，这个就是前面调度更新的结果
  //  debugger
   const finishedWork = root.finishedWork;
   const lanes = root.finishedLanes;
   // //表示该节点没有要更新的任务，直接 return
  if (finishedWork === null) {
   
     return null;
   }
  // commitRoot永远不会反回延续；它总是同步完成的
  // 因此，我们现在可以清除这些内容以允许安排新的回调。
  // 对 root 上的 finishedWork 和 expirationTime reset
  // 重置Scheduler绑定的回调函数
  root.finishedWork = null;  // 清空
  root.finishedLanes = NoLanes;  // 清空

  
  // 请注意PassiveMask = Passive | ChildDeletion; 也就是说PassiveMask是一个通道集 同时具备Passive | ChildDeletion 
  // 也就是 finishedWork.subtreeFlags & PassiveMask 前者只要具备Passive | ChildDeletion其中任何一个结果都会不是NoFlags
  // 映射成表达的意义就是只要有 Effect相关或者dom的删除相关这个就会是true的
  if (
    (finishedWork.subtreeFlags & PassiveMask) !== NoFlags ||
    (finishedWork.flags & PassiveMask) !== NoFlags
  ) {
    if (!cEffect.rootDoesHavePassiveEffects) {
      cEffect.rootDoesHavePassiveEffects = true;
      console.log('rootDoesHavePassiveEffects设置为true')
      const NormalSchedulerPriority = NormalPriority
      scheduleCallback(NormalSchedulerPriority, () => {
        flushPassiveEffects();
        return null;
      });
    }
  }

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
    commitLayoutEffects(finishedWork, root, lanes);



    const rootDidHavePassiveEffects = cEffect.rootDoesHavePassiveEffects;

    if (cEffect.rootDoesHavePassiveEffects) {
      // This commit has passive effects. Stash a reference to them. But don't
      // schedule a callback until after flushing layout work.
      cEffect.rootDoesHavePassiveEffects = false;
      cEffect.rootWithPendingPassiveEffects = root;
      cEffect.pendingPassiveEffectsLanes = lanes;
      cEffect.pendingPassiveEffectsRenderPriority = renderPriorityLevel;
    }

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
    if (deletions !== null) {
      for (let i = 0; i < deletions.length; i++) {
        const deletion = deletions[i];
        console.log('commit commitBeforeMutationEffectsDeletion')
        commitBeforeMutationEffectsDeletion(deletion);
      }
    }

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
function ensureCorrectReturnPointer(fiber: Fiber, expectedReturnFiber: Fiber|null) {
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

/*
  到目前为止当前这个函数处理的事情非常少一个事HostRoot 清空container中的text信息
  一个事classComponent这种类型下调用一下getSnapshotBeforeUpdate这个生命周期

*/
function commitBeforeMutationEffectsOnFiber(finishedWork: Fiber) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;

  if (!shouldFireAfterActiveInstanceBlur && focusedInstanceHandle !== null) {
    // Check to see if the focused element was inside of a hidden (Suspense) subtree.
    // TODO: Move this out of the hot path using a dedicated effect tag.
    if (
      finishedWork.tag === SuspenseComponent 
      // isSuspenseBoundaryBeingHidden(current, finishedWork) &&
      // doesFiberContain(finishedWork, focusedInstanceHandle)
    ) {
      // shouldFireAfterActiveInstanceBlur = true;
      // beforeActiveInstanceBlur(finishedWork);
    }
  }
  //
  if ((flags & Snapshot) !== NoFlags) {
    switch (finishedWork.tag) {
      case FunctionComponent:
      case ForwardRef:
      case HostComponent:
      case HostText:
      case HostPortal:
      case IncompleteClassComponent:
      case SimpleMemoComponent: {
          break;
      }
      case HostRoot: {
        if (supportsMutation) {
          const root = finishedWork.stateNode;
          clearContainer(root.containerInfo);
        }
        break;
      }
      
      case ClassComponent: {
        // 在classComponent这种类型下主要是调用getSnapshotBeforeUpdate生命周期
        if (current !== null) {
          const prevProps = current.memoizedProps;
          const prevState = current.memoizedState;
          const instance = finishedWork.stateNode;
         
          const snapshot = instance.getSnapshotBeforeUpdate(
            finishedWork.elementType === finishedWork.type
              ? prevProps
              : resolveDefaultProps(finishedWork.type, prevProps),
            prevState,
          );
          
          instance.__reactInternalSnapshotBeforeUpdate = snapshot;
        }
        break;
      }

      default: {
        
      }

    }
  }
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
  console.log('commit mutation', primaryFlags, finishedWork)

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
  if (!supportsMutation) {
    return;
  }

  // Recursively insert all host nodes into the parent.
  const parentFiber = getHostParentFiber(finishedWork);

  // Note: these two variables *must* always be updated together.
  let parent;
  let isContainer;
  const parentStateNode = parentFiber ? parentFiber.stateNode : {};
  const tag = parentFiber ? parentFiber.tag : 1
  // debugger
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
  // 重置text信息，这个看reconcileChild部分
  if (parentFiber && (parentFiber.flags & ContentReset)) {
    // Reset the text content of the parent before doing any insertions
    resetTextContent(parent);
    // Clear ContentReset from the effect tag
    parentFiber.flags &= ~ContentReset;
  }

  const before = getHostSibling(finishedWork);
  // We only have the top Fiber that was inserted but we need to recurse down its
  // children to find all the terminal nodes.
  if (isContainer) {
    insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
  } else  {
  
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
  before?:Instance|null,
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
  before?:Instance|null,
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
   if (!supportsMutation) {
    // switch (finishedWork.tag) {
    //   case FunctionComponent:
    //   case ForwardRef:
    //   case MemoComponent:
    //   case SimpleMemoComponent: {
    //     // Layout effects are destroyed during the mutation phase so that all
    //     // destroy functions for all fibers are called before any create functions.
    //     // This prevents sibling component effects from interfering with each other,
    //     // e.g. a destroy function in one component should never override a ref set
    //     // by a create function in another component during the same commit.
    //     if (
    //       enableProfilerTimer &&
    //       enableProfilerCommitHooks &&
    //       finishedWork.mode & ProfileMode
    //     ) {
    //       try {
    //         startLayoutEffectTimer();
    //         commitHookEffectListUnmount(
    //           HookLayout | HookHasEffect,
    //           finishedWork,
    //           finishedWork.return,
    //         );
    //       } finally {
    //         recordLayoutEffectDuration(finishedWork);
    //       }
    //     } else {
    //       commitHookEffectListUnmount(
    //         HookLayout | HookHasEffect,
    //         finishedWork,
    //         finishedWork.return,
    //       );
    //     }
    //     return;
    //   }
    //   case Profiler: {
    //     return;
    //   }
    //   case SuspenseComponent: {
    //     commitSuspenseComponent(finishedWork);
    //     attachSuspenseRetryListeners(finishedWork);
    //     return;
    //   }
    //   case SuspenseListComponent: {
    //     attachSuspenseRetryListeners(finishedWork);
    //     return;
    //   }
    //   case HostRoot: {
    //     if (supportsHydration) {
    //       const root: FiberRoot = finishedWork.stateNode;
    //       if (root.hydrate) {
    //         // We've just hydrated. No need to hydrate again.
    //         root.hydrate = false;
    //         commitHydratedContainer(root.containerInfo);
    //       }
    //     }
    //     break;
    //   }
    //   case OffscreenComponent:
    //   case LegacyHiddenComponent: {
    //     return;
    //   }
    // }

    // commitContainer(finishedWork);
    // return;
  }
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent: {

      return;
    }
    case ClassComponent: {
      return;
    }
    case HostComponent: {
      const instance: Instance = finishedWork.stateNode;
      if (instance != null) {
        // Commit the work prepared earlier.
        const newProps = finishedWork.memoizedProps;
        // For hydration we reuse the update path but we treat the oldProps
        // as the newProps. The updatePayload will contain the real change in
        // this case.
        const oldProps = current !== null ? current.memoizedProps : newProps;
        const type = finishedWork.type;
        // TODO: Type the updateQueue to be specific to host components.
        const updatePayload: null | UpdatePayload = (finishedWork.updateQueue as any);
        finishedWork.updateQueue = null;
        if (updatePayload !== null) {
          commitUpdate(
            instance,
            updatePayload,
            type,
            oldProps,
            newProps,
            finishedWork,
          );
        }
      }
      return
    }
    default: {
      console.log('commitWork一种未实现的tag ',finishedWork.tag)
    }
    
  }
}



/*******************layout阶段相关***********************/

export function commitLayoutEffects(
  finishedWork: Fiber,
  root: FiberRoot,
  committedLanes: Lanes,
): void {
  nextEffect = finishedWork;
  commitLayoutEffects_begin(finishedWork, root, committedLanes);
}

function commitLayoutEffects_begin(
  subtreeRoot: Fiber,
  root: FiberRoot,
  committedLanes: Lanes,
) {
  while (nextEffect !== null) {
    const fiber = nextEffect;
    const firstChild = fiber.child;
    if ((fiber.subtreeFlags & LayoutMask) !== NoFlags && firstChild !== null) {
      ensureCorrectReturnPointer(firstChild, fiber);
      nextEffect = firstChild;
    } else {
      commitLayoutMountEffects_complete(subtreeRoot, root, committedLanes);
    }
  }
}

function commitLayoutMountEffects_complete(
  subtreeRoot: Fiber,
  root: FiberRoot,
  committedLanes: Lanes,
) {
  while (nextEffect !== null) {
    const fiber = nextEffect;
    if ((fiber.flags & LayoutMask) !== NoFlags) {
      const current = fiber.alternate;
      try {
        commitLayoutEffectOnFiber(root, current, fiber, committedLanes);
      } catch (error) {
        console.log('%c commitLayoutMountEffects_complete error', 'color: blue; background: red', error)
        // captureCommitPhaseError(fiber, fiber.return, error);
      }
    }

    if (fiber === subtreeRoot) {
      nextEffect = null;
      return;
    }

    const sibling = fiber.sibling;
    if (sibling !== null) {
      ensureCorrectReturnPointer(sibling, fiber.return);
      nextEffect = sibling;
      return;
    }

    nextEffect = fiber.return;
  }
}

function commitLayoutEffectOnFiber(
  finishedRoot: FiberRoot,
  current: Fiber | null,
  finishedWork: Fiber,
  committedLanes: Lanes,
): void {
  if ((finishedWork.flags & (Update | Callback)) !== NoFlags) {
    switch (finishedWork.tag) {
      case FunctionComponent:
      case ForwardRef:
      case SimpleMemoComponent: {
        // At this point layout effects have already been destroyed (during mutation phase).
        // This is done to prevent sibling component effects from interfering with each other,
        // e.g. a destroy function in one component should never override a ref set
        // by a create function in another component during the same commit.
        if (
          enableProfilerTimer &&
          enableProfilerCommitHooks &&
          finishedWork.mode & ProfileMode
        ) {
          try {
            startLayoutEffectTimer();
            commitHookEffectListMount(HookLayout | HookHasEffect, finishedWork);
          } finally {
            // recordLayoutEffectDuration(finishedWork);
          }
        } else {
          commitHookEffectListMount(HookLayout | HookHasEffect, finishedWork);
        }
        break;
      }
      case ClassComponent: {
        // const instance = finishedWork.stateNode;
        // if (finishedWork.flags & Update) {
        //   if (current === null) {
            
        //     if (
        //       enableProfilerTimer &&
        //       enableProfilerCommitHooks &&
        //       finishedWork.mode & ProfileMode
        //     ) {
        //       try {
        //         startLayoutEffectTimer();
        //         instance.componentDidMount();
        //       } finally {
        //         recordLayoutEffectDuration(finishedWork);
        //       }
        //     } else {
        //       instance.componentDidMount();
        //     }
        //   } else {
        //     const prevProps =
        //       finishedWork.elementType === finishedWork.type
        //         ? current.memoizedProps
        //         : resolveDefaultProps(finishedWork.type, current.memoizedProps);
        //     const prevState = current.memoizedState;
          
            
        //     if (
        //       enableProfilerTimer &&
        //       enableProfilerCommitHooks &&
        //       finishedWork.mode & ProfileMode
        //     ) {
        //       try {
        //         startLayoutEffectTimer();
        //         instance.componentDidUpdate(
        //           prevProps,
        //           prevState,
        //           instance.__reactInternalSnapshotBeforeUpdate,
        //         );
        //       } finally {
        //         recordLayoutEffectDuration(finishedWork);
        //       }
        //     } else {
        //       instance.componentDidUpdate(
        //         prevProps,
        //         prevState,
        //         instance.__reactInternalSnapshotBeforeUpdate,
        //       );
        //     }
        //   }
        // }

        // // TODO: I think this is now always non-null by the time it reaches the
        // // commit phase. Consider removing the type check.
        // const updateQueue: UpdateQueue<
        //   *,
        // > | null = (finishedWork.updateQueue as any);
        // if (updateQueue !== null) {
        //   commitUpdateQueue(finishedWork, updateQueue, instance);
        // }
        break;
      }
      case HostRoot: {
        // TODO: I think this is now always non-null by the time it reaches the
        // commit phase. Consider removing the type check.
        const updateQueue: UpdateQueue<
          any
        > | null = (finishedWork.updateQueue as any);
        if (updateQueue !== null) {
          let instance = null;
          if (finishedWork.child !== null) {
            switch (finishedWork.child.tag) {
              case HostComponent:
                instance = getPublicInstance(finishedWork.child.stateNode);
                break;
              case ClassComponent:
                instance = finishedWork.child.stateNode;
                break;
            }
          }
          
          commitUpdateQueue(finishedWork, updateQueue, instance);
        }
        break;
      }
      case HostComponent: {
        const instance: Instance = finishedWork.stateNode;

        // Renderers may schedule work to be done after host components are mounted
        // (eg DOM renderer may schedule auto-focus for inputs and form controls).
        // These effects should only be committed when components are first mounted,
        // aka when there is no current/alternate.
        if (current === null && finishedWork.flags & Update) {
          const type = finishedWork.type;
          const props = finishedWork.memoizedProps;
          commitMount(instance, type, props, finishedWork);
        }
        break;
      }
      case HostText: {
        // We have no life-cycles associated with text.
        break;
      }
      case HostPortal: {
        // We have no life-cycles associated with portals.
        break;
      }
      case Profiler: {
        // if (enableProfilerTimer) {
        //   const {onCommit, onRender} = finishedWork.memoizedProps;
        //   const {effectDuration} = finishedWork.stateNode;

        //   const commitTime = getCommitTime();

        //   let phase = current === null ? 'mount' : 'update';
        //   if (enableProfilerNestedUpdatePhase) {
        //     if (isCurrentUpdateNested()) {
        //       phase = 'nested-update';
        //     }
        //   }

        //   if (typeof onRender === 'function') {
        //     if (enableSchedulerTracing) {
        //       onRender(
        //         finishedWork.memoizedProps.id,
        //         phase,
        //         finishedWork.actualDuration,
        //         finishedWork.treeBaseDuration,
        //         finishedWork.actualStartTime,
        //         commitTime,
        //         finishedRoot.memoizedInteractions,
        //       );
        //     } else {
        //       onRender(
        //         finishedWork.memoizedProps.id,
        //         phase,
        //         finishedWork.actualDuration,
        //         finishedWork.treeBaseDuration,
        //         finishedWork.actualStartTime,
        //         commitTime,
        //       );
        //     }
        //   }

        //   if (enableProfilerCommitHooks) {
        //     if (typeof onCommit === 'function') {
        //       if (enableSchedulerTracing) {
        //         onCommit(
        //           finishedWork.memoizedProps.id,
        //           phase,
        //           effectDuration,
        //           commitTime,
        //           finishedRoot.memoizedInteractions,
        //         );
        //       } else {
        //         onCommit(
        //           finishedWork.memoizedProps.id,
        //           phase,
        //           effectDuration,
        //           commitTime,
        //         );
        //       }
        //     }

        //     // Schedule a passive effect for this Profiler to call onPostCommit hooks.
        //     // This effect should be scheduled even if there is no onPostCommit callback for this Profiler,
        //     // because the effect is also where times bubble to parent Profilers.
        //     enqueuePendingPassiveProfilerEffect(finishedWork);

        //     // Propagate layout effect durations to the next nearest Profiler ancestor.
        //     // Do not reset these values until the next render so DevTools has a chance to read them first.
        //     let parentFiber = finishedWork.return;
        //     while (parentFiber !== null) {
        //       if (parentFiber.tag === Profiler) {
        //         const parentStateNode = parentFiber.stateNode;
        //         parentStateNode.effectDuration += effectDuration;
        //         break;
        //       }
        //       parentFiber = parentFiber.return;
        //     }
        //   }
        // }
        break;
      }
      // case SuspenseComponent: {
      //   commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
      //   break;
      // }
      // case SuspenseListComponent:
      // case IncompleteClassComponent:
      // case ScopeComponent:
      // case OffscreenComponent:
      // case LegacyHiddenComponent:
        // break;
      default:
        console.log('%c 这里有一种类型未处理','color: blue; background: red',finishedWork.tag)
    }
  }

  if (enableScopeAPI) {
    // TODO: This is a temporary solution that allowed us to transition away
    // from React Flare on www.
    // if (finishedWork.flags & Ref && finishedWork.tag !== ScopeComponent) {
    //   commitAttachRef(finishedWork);
    // }
  } else {
    // if (finishedWork.flags & Ref) {
    //   commitAttachRef(finishedWork);
    // }
  }
}



function commitHookEffectListMount(tag: number, finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue as any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & tag) === tag) {
        // Mount
        const create = effect.create;
        effect.destroy = create();

        
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

export function commitUpdateQueue<State>(
  finishedWork: Fiber,
  finishedQueue: UpdateQueue<State>,
  instance: any,
): void {
  // Commit the effects
  const effects = finishedQueue.effects;
  finishedQueue.effects = null;
  if (effects !== null) {
    for (let i = 0; i < effects.length; i++) {
      const effect = effects[i];
      const callback = effect.callback;
      if (callback !== null) {
        effect.callback = null;
        callCallback(callback, instance);
      }
    }
  }
}

function callCallback(callback: any, context: any) {
 
  callback.call(context);
}

export function commitMount(
  domElement: Instance,
  type: string,
  newProps: Props,
  internalInstanceHandle: Object,
): void {
  // Despite the naming that might imply otherwise, this method only
  // fires if there is an `Update` effect scheduled during mounting.
  // This happens if `finalizeInitialChildren` returns `true` (which it
  // does to implement the `autoFocus` attribute on the client). But
  // there are also other cases when this might happen (such as patching
  // up text content during hydration mismatch). So we'll check this again.
  if (shouldAutoFocusHostComponent(type, newProps)) {
    (domElement as
       HTMLButtonElement
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement).focus();
  }
}

function shouldAutoFocusHostComponent(type: string, props: Props): boolean {
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      return !!props.autoFocus;
  }
  return false;
}



// 当没有主动传入属性时用defaultProps

export function resolveDefaultProps(Component: any, baseProps: {[key: string]: string}): Object {
  if (Component && Component.defaultProps) {
    // Resolve default props. Taken from ReactElement
    const props = Object.assign({}, baseProps);
    const defaultProps = Component.defaultProps;
    for (const propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
    return props;
  }
  return baseProps;
}



function commitBeforeMutationEffectsDeletion(deletion: Fiber) {

  if (doesFiberContain(deletion, (focusedInstanceHandle as Fiber))) {
    shouldFireAfterActiveInstanceBlur = true;
    console.log('beforeActiveInstanceBlur 未实现')
    // beforeActiveInstanceBlur(deletion);
  }
}

export function doesFiberContain(
  parentFiber: Fiber,
  childFiber: Fiber,
): boolean {
  let node: Fiber|null = childFiber;
  const parentFiberAlternate = parentFiber.alternate;
  while (node !== null) {
    if (node === parentFiber || node === parentFiberAlternate) {
      return true;
    }
    node = node.return;
  }
  return false;
}

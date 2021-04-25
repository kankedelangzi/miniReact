import { FiberRoot,HostEffectMask, 
  Fiber,StaticMask, Lanes, ClassComponent,
  HostText,Snapshot,Container,HostContext,Update,mixed,RootExitStatus,
  HostRoot,HostComponent, ShouldCapture,DidCapture, StackCursor,RootIncomplete,
  ProfileMode, NoMode, Incomplete, NoFlags } from '../type'
import {  NoLanes,getNextLanes, mergeLanes } from '../reactDom/lane'
import { createFiber} from '../reactDom/create'
import { beginWork } from './beginWork'
import {  commitRoot } from './commitRoot'
import {  createInstance, createTextInstance } from '../reactDom/instance'
import { createCursor, NO_CONTEXT, NoContextT , rootInstanceStackCursor } from './fiberStack'
import { appendAllChildren, finalizeInitialChildren } from '../reactDom/domOperation'
import {popHydrationState } from './hydrad'

let workInProgressRootIncludedLanes: Lanes = NoLanes;
// The work left over by components that were visited during this render. Only
// includes unprocessed updates, not work in bailed out children.
let workInProgressRootSkippedLanes: Lanes = NoLanes;
// Lanes that were updated (in an interleaved event) during this render.
let workInProgressRootUpdatedLanes: Lanes = NoLanes;
// Lanes that were pinged (in an interleaved event) during this render.
let workInProgressRootPingedLanes: Lanes = NoLanes;
let workInProgressRootExitStatus: RootExitStatus = RootIncomplete;
let workInProgressRootFatalError: mixed = null;

let workInProgressRoot: FiberRoot | null = null;
let workInProgress: Fiber | null = null;
let workInProgressRootRenderLanes: Lanes = NoLanes;
let subtreeRenderLanes: Lanes = NoLanes;

const contextStackCursor: StackCursor<HostContext | NoContextT> = createCursor(
  NO_CONTEXT,
);
const enableProfilerTimer = false;





function unwindWork(workInProgress: Fiber, renderLanes: Lanes):Fiber|null {
  // debugger
  switch (workInProgress.tag) {
    case ClassComponent:
      break
    case HostRoot: 
      // if (enableCache) {
      //   const root: FiberRoot = workInProgress.stateNode;
      //   popRootCachePool(root, renderLanes);

      //   const cache: Cache = workInProgress.memoizedState.cache;
      //   popCacheProvider(workInProgress, cache);
      // }
      // popHostContainer(workInProgress);
      // popTopLevelLegacyContextObject(workInProgress);
      // resetMutableSourceWorkInProgressVersions();
      const flags = workInProgress.flags;
      // debugger
      workInProgress.flags = (flags & ~ShouldCapture) | DidCapture;
      return workInProgress;
    case HostComponent:
      break
    default:
      return null;
  }
  return null
}
function bubbleProperties(completedWork: Fiber) {
  const didBailout =
    completedWork.alternate !== null &&
    completedWork.alternate.child === completedWork.child;

  let newChildLanes = NoLanes;
  let subtreeFlags = NoFlags;
  if (!didBailout) {
    if ((completedWork.mode & ProfileMode) !== NoMode) {
      //
      let actualDuration = completedWork.actualDuration ||0;
      let treeBaseDuration = (completedWork.selfBaseDuration as number);

      let child = completedWork.child;
      while (child !== null) {
        newChildLanes = mergeLanes(
          newChildLanes,
          mergeLanes(child.lanes, child.childLanes),
        );

        subtreeFlags |= child.subtreeFlags;
        subtreeFlags |= child.flags;

        // When a fiber is cloned, its actualDuration is reset to 0. This value will
        // only be updated if work is done on the fiber (i.e. it doesn't bailout).
        // When work is done, it should bubble to the parent's actualDuration. If
        // the fiber has not been cloned though, (meaning no work was done), then
        // this value will reflect the amount of time spent working on a previous
        // render. In that case it should not bubble. We determine whether it was
        // cloned by comparing the child pointer.
        actualDuration += child.actualDuration || 0;

        treeBaseDuration += child.treeBaseDuration || 0;
        child = child.sibling;
      }

      completedWork.actualDuration = actualDuration;
      completedWork.treeBaseDuration = treeBaseDuration;
    } else{
      let child = completedWork.child;
      while (child !== null) {
        newChildLanes = mergeLanes(
          newChildLanes,
          mergeLanes(child.lanes, child.childLanes),
        );

        subtreeFlags |= child.subtreeFlags;
        subtreeFlags |= child.flags;

        // Update the return pointer so the tree is consistent. This is a code
        // smell because it assumes the commit phase is never concurrent with
        // the render phase. Will address during refactor to alternate model.
        child.return = completedWork;

        child = child.sibling;
      }
    }
    completedWork.subtreeFlags |= subtreeFlags;
  } else {
    if ((completedWork.mode & ProfileMode) !== NoMode) {
      //
    } else {
      let child = completedWork.child;
      while (child !== null) {
        newChildLanes = mergeLanes(
          newChildLanes,
          mergeLanes(child.lanes, child.childLanes),
        );

        // "Static" flags share the lifetime of the fiber/hook they belong to,
        // so we should bubble those up even during a bailout. All the other
        // flags have a lifetime only of a single render + commit, so we should
        // ignore them.
        subtreeFlags |= child.subtreeFlags & StaticMask;
        subtreeFlags |= child.flags & StaticMask;

        // Update the return pointer so the tree is consistent. This is a code
        // smell because it assumes the commit phase is never concurrent with
        // the render phase. Will address during refactor to alternate model.
        child.return = completedWork;

        child = child.sibling;
      }
    }
    completedWork.subtreeFlags |= subtreeFlags;
  }
  completedWork.childLanes = newChildLanes;
  return didBailout;
}
function requiredContext<Value>(c: Value ): Value {
  return c;
}
function getHostContext(): HostContext {
  const context = requiredContext(contextStackCursor.current);
  return context as HostContext;
}

function getRootHostContainer(): Container| NoContextT{
  const rootInstance = requiredContext<Container|NoContextT>(rootInstanceStackCursor.current);
  return rootInstance;
}


// 备注：(1) 对于IndeterminateComponent， LazyComponent，SimpleMemoComponent，FunctionComponent
// ForwardRef， Fragment，Mode， Profiler， ContextConsumer， MemoComponent ，直接返回null
// (2) ClassComponent ， 处理旧版本的context 后， 返回null。（3 ） HostRoot ， 执行了一个
// 空函数， 其他后面补充。（4） HostComponent 类型 ， 处理context, 更新时， 更新更新函数， updateHostComponent
// ref的更新。 新建时， dom节点的初始化，添加当前下直接dom子节点（只有一层）， 处理节点的props
// 的初始化和ref ， 最后返回null (5) HostText 新建时 文本实例  ， 更新时， 内容更新， 返回null

function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  const newProps = workInProgress.pendingProps;
  // debugger
  switch (workInProgress.tag) {
    case ClassComponent: {
      const Component = workInProgress.type;
      // if (isLegacyContextProvider(Component)) {
      //   popLegacyContext(workInProgress);
      // }
      bubbleProperties(workInProgress);
      return null;
    }
    case HostRoot: {
      const fiberRoot = (workInProgress.stateNode as FiberRoot);
      // updateHostContainer(current, workInProgress);
      // popHostContainer(workInProgress);
      // popTopLevelLegacyContextObject(workInProgress);
      // resetMutableSourceWorkInProgressVersions();
      if (fiberRoot.pendingContext) {
        fiberRoot.context = fiberRoot.pendingContext;
        fiberRoot.pendingContext = null;
      }
      if (current === null || current.child === null) {
        // If we hydrated, pop so that we can delete any remaining children
        // that weren't hydrated.
        const wasHydrated = false
        if (wasHydrated) {
          // If we hydrated, then we'll need to schedule an update for
          // the commit side-effects on the root.
          // markUpdate(workInProgress);
        } else if (!fiberRoot.hydrate) {
          // Schedule an effect to clear this container at the start of the next commit.
          // This handles the case of React rendering into a container with previous children.
          // It's also safe to do for updates too, because current.child would only be null
          // if the previous render was null (so the the container would already be empty).
          workInProgress.flags |= Snapshot;
        }
      }
      // updateHostContainer(current, workInProgress); noop
      bubbleProperties(workInProgress);
      return null;
    }
    case HostComponent: {
      // debugger
      const type = workInProgress.type
      const rootContainerInstance = getRootHostContainer() as Container;
      const currentHostContext = getHostContext();
      if (current !== null && workInProgress.stateNode != null) {
        // 
      } else {
        if (!newProps) {
          console.error('error newProps null')
          // This can happen when we abort work.
          bubbleProperties(workInProgress);
          return null;
        }
        // const currentHostContext = getHostContext();
        const wasHydrated = false; 
        if(wasHydrated) {
          //
        } else {
          // debugger
          const instance = createInstance(
            type,
            newProps,
            rootContainerInstance,
            currentHostContext,
            workInProgress,
          );

          appendAllChildren(instance, workInProgress, false, false);

          workInProgress.stateNode = instance;

          // Certain renderers require commit-time effects for initial mount.
          // (eg DOM renderer supports auto-focus for certain elements).
          // Make sure such renderers get scheduled for later work.
          if (
            finalizeInitialChildren(
              instance,
              type,
              newProps,
              rootContainerInstance,
              currentHostContext,
            )
          ) {
            markUpdate(workInProgress);
          }
        }
        // if (workInProgress.ref !== null) { // TODO
        //   // If there is a ref on a host node we need to schedule a callback
        //   markRef(workInProgress);
        // }
      }
      bubbleProperties(workInProgress);
      return null;

    }
    case HostText: {
      const newText = newProps;
      if (current && workInProgress.stateNode != null) {
        // const oldText = current.memoizedProps;
      
        // updateHostText(current, workInProgress, oldText, newText);
      } else {
        if (typeof newText !== 'string') {
          // error
        }
        const rootContainerInstance = getRootHostContainer();
        const currentHostContext = getHostContext();
        const wasHydrated = popHydrationState(workInProgress);
        if (wasHydrated) {
          // hydrated
        } else {
          workInProgress.stateNode = createTextInstance(
            newText,
            rootContainerInstance,
            currentHostContext,
            workInProgress,
          );
        }
      }
      bubbleProperties(workInProgress);
      return null;
    }
  }
  
  return null

}

 // 备注：循环判断， 首先根据执行是否出错（1） 1.当fiber 执行没有报错的时候，执行completeWokr(主要处理HostConent, HostTest,
// 和Host 类型)； 2.根据子fiber 的la呢和childLane, 重新计算当前fiber的childLane;  3. 将
// 当前fiber 上记录的有更新的子孙effct 增加到returnFiber 上， 当前fiber 上有更新，则 也添加
// 上returnFiber, 跳到第三步， (2)            (3) 判断有无兄弟fiber, 有设置workInprogress
// 跳出循环 ， 无sibling,将 returnFiber 设置为 workInprogress, 继续循环. (4) 上面
// 的fiber 都会增加effect, 最后会增加到rootFiber 上面。（2） 当执行出现错误的时候,
// 首先执行unwindWork， 因为当前sourceFiber 没有shouleCapture, 首次执行为unwindWork 为
// null, 将设置returnFiber的flag 为Incomplete  unwindWork 找寻已经捕获到错误的fiber
// (classComponent  或HostRoot), 直到找寻到捕获到错误的fiber.在寻找期间的fiber 都增加
// flag Incomplete。如当前fiber为捕获到错误的classComponent ， 将执行beginWork, 执行 updateClassComponent
// 将执行proceUpdateQueue, 执行更新， getDrivedStateFormError 方法或ComponentDidCatach
// 执行captureUpdate 的更新， 再finishCOmponent 时， 当有didCapture, 和getDerivedStateFromError
// 生成错误状态的children。最后forceUnmountCurrentAndReconcile ，清空原来的children , 
// 最后使用使用新生成的children ,进行协调。
function completeUnitOfWork(unitOfWork: Fiber): void {

  let completedWork: Fiber|null = unitOfWork;
  do {
     // 当前节点，已刷新，该fiber的状态是备份的。
    // 理想状态下没有什么应该依赖它，是在这里依靠它意味着我们不
    // 需要添加其他字段到workInProgress。
    const current = completedWork.alternate;
    const returnFiber:any = completedWork.return;
    // 检查工作是否完成或是否有东西抛出。， 没有错误时候
    if ((completedWork.flags & Incomplete) === NoFlags) {
      let next;
      next = completeWork(current, completedWork, subtreeRenderLanes);
      if (next !== null) {
        // Completing this fiber spawned new work. Work on that next.
        // 完成这个fiber结点的时候产生了一个新的work，接下来处理这个work
        workInProgress = next;
        return;  // 结束流程
      }
      const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      // If there is more work to do in this returnFiber, do that next.
      workInProgress = siblingFiber;
      return;
    }
    completedWork = returnFiber;
    // Update the next thing we're working on in case something throws.
    workInProgress = completedWork;

    } else {
      const next = unwindWork(completedWork, subtreeRenderLanes);

      // Because this fiber did not complete, don't reset its expiration time.

      if (next !== null) {
        // If completing this work spawned new work, do that next. We'll come
        // back here again.
        // Since we're restarting, remove anything that is not a host effect
        // from the effect tag.
        next.flags &= HostEffectMask;
        workInProgress = next;
        return;
      }
    }

  } while (completedWork !== null);
}
/**
 * 
 * @param unitOfWork 
 * 功能:
  ① 协助 workLoopSync 深度优先（先序优先）遍历生成 Fiber 树，原理：
  当 workLoopSync 遍历到当前分支最深的节点时向上寻找父节点并判断父节点有无同级节点，
  有的话将 workInProgress 其设置为此节点，从而实现寻找下一个节点
  ② 判断 effectTag 创建副作用链表（由子结点往上指向父节点）
  ③ 调用 completeWork 方法
 */
// 执行更新的操作
function performUnitOfWork(unitOfWork: Fiber):void {
   // 创建一个备份的fiber
    // 最理想的情况是不依靠current fiber, 创建一个workInProgress
    // 创建一个workInProgress的alternate属性指向current fiber
    const current = unitOfWork.alternate;  // current 
    
     let next;
    //  debugger
      // ProfileMode 模式问题， ProfileMode 模式下
    if (false && (unitOfWork.mode & ProfileMode) !== NoMode) {
      // startProfilerTimer(unitOfWork);
      // next = beginWork(current, unitOfWork, subtreeRenderLanes);
      // stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
      
    } else {
      try {
        next = beginWork(current, unitOfWork, subtreeRenderLanes);
      } catch (error) {
        console.log('%c beginWork 出错',  
        'color:white;background:red;', error)
      }
     
      console.log('next1')
    }
    

    unitOfWork.memoizedProps = unitOfWork.pendingProps;
    if (next === null) {
      // If this doesn't spawn new work, complete the current work.
      // 进行共搜
       // 如果没有分配新的工作，完成当前工作
      //  debugger
      completeUnitOfWork(unitOfWork);
    } else {
      // 如果具有
      // workInProgress设置为一下个工作
      console.log('next')
      workInProgress = next || null;
    }
  
    // ReactCurrentOwner.current = null;

}
// 循环遍历performUnitOfWork， 同步更新
function workLoopSync() {
  // debugger
  while (workInProgress !== null) {  // 同步更新的时候，一次性更新完
    // 执行更新操作
   console.log('work loop')
  //  debugger
    performUnitOfWork(workInProgress);  // rootFiber的alternate
  }
}
// 处理更新
export function renderRootSync (root: FiberRoot, lanes: Lanes) {
  // 如果root或者lanes改变，丢弃现有的栈
  // 而且准备一个新的，否则我们会继续离开我们所在的地方
  // debugger
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    // 准备一个当前fiber节点的克隆 放在全局变量workInProgress中

    prepareFreshStack(root, lanes);
    // 不处理
    startWorkOnPendingInteractions(root, lanes);
  }
  debugger
  do {
    try {
      // 进行更新， workLook 
       // 循环处理workInProgress
      workLoopSync();
      break;
    } catch (thrownValue) {
      // handleError(root, thrownValue);
      console.error('函数renderRootSync','进入catch成为死循环', thrownValue)
    }
  } while (true);
  
}
function startWorkOnPendingInteractions(root: FiberRoot, lanes: Lanes) {
  //
  console.log('执行startWorkOnPendingInteractions')
}
export function createWorkInProgress(current: Fiber|null, pendingProps: any): Fiber {
  if(!current) {
    return {} as Fiber;
  }

  let workInProgress = current.alternate;
  if(workInProgress === null) {
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode,
    );
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {

  }

  workInProgress.flags = current.flags & StaticMask;
  workInProgress.childLanes = current.childLanes;
  workInProgress.lanes = current.lanes;

  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;

  // Clone the dependencies object. This is mutated during the render phase, so
  // it cannot be shared with the current fiber.
  // const currentDependencies = current.dependencies;
  // workInProgress.dependencies =
    // currentDependencies === null
    //   ? null
    //   : {
    //       lanes: currentDependencies.lanes,
    //       firstContext: currentDependencies.firstContext,
    //     };

  // These will be overridden during the parent's reconciliation
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  // workInProgress.ref = current.ref;

  return workInProgress;
}
function prepareFreshStack(root: FiberRoot, lanes: Lanes) {
  root.finishedWork = null;
  root.finishedLanes = NoLanes;
  workInProgressRoot = root;
  workInProgress = createWorkInProgress(root.current, null);

  workInProgressRootRenderLanes = subtreeRenderLanes = workInProgressRootIncludedLanes = lanes;
  workInProgressRootExitStatus = RootIncomplete;
  workInProgressRootFatalError = null;
  workInProgressRootSkippedLanes = NoLanes;
  workInProgressRootUpdatedLanes = NoLanes;
  workInProgressRootPingedLanes = NoLanes;

}
export function performSyncWorkOnRoot(root: FiberRoot) {
  let lanes;
  let exitStatus;
 
  lanes = getNextLanes(root, NoLanes);  // 当前lanes
  exitStatus = renderRootSync(root, lanes);  // lanes 
//   // 标示完成的工作
 const finishedWork: Fiber|null = (root.current?.alternate)||null;
 root.finishedWork = finishedWork;
 root.finishedLanes = lanes;
//  // 开始commitRoot的部分

 commitRoot(root);
}


function markUpdate(workInProgress: Fiber) {
  // Tag the fiber with an update effect. This turns a Placement into
  // a PlacementAndUpdate.
  workInProgress.flags |= Update;
}

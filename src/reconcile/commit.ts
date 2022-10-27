import { FiberRoot,HostEffectMask, 
  Fiber,StaticMask, Lanes, ClassComponent,ReactPriorityLevel,
  HostText,Snapshot,Container,HostContext,Update,mixed,RootExitStatus,
  Lane,Interaction,SchedulerCallback,
  HostRoot,HostComponent, ShouldCapture,DidCapture, StackCursor,RootIncomplete,
  SchedulerCallbackOptions,
  ProfileMode, NoMode, Incomplete, NoFlags, Props, Instance } from '../type'
import {  getNextLanes, mergeLanes,  includesSomeLane, computeThreadID, ensureRootIsScheduled } from '../reactDom/lane'
import { createFiber} from '../reactDom/create'
import { beginWork } from './beginWork'
import {  commitRoot } from './commitRoot'
import {  createInstance, createTextInstance } from '../reactDom/instance'
import { createCursor, NO_CONTEXT, NoContextT , rootInstanceStackCursor } from './fiberStack'
import { appendAllChildren, finalizeInitialChildren } from '../reactDom/domOperation'
import {popHydrationState } from './hydrad'
import { ReactCurrentDispatcher } from "../react/hooks";
import { resetContextDependencies } from "./functionComponent";
import { enableSchedulerTracing } from '../type/constant'
import { __subscriberRef } from "../scheduler";
import {  ImmediatePriority as ImmediateSchedulerPriority, now} from '../reactDom/tools'
import { Cxt, RenderContext } from '../reactDom/context'
import { flushPassiveEffects, shouldYield } from './scheduler'
import { RootCompleted, WorkIn } from '../reactDom/workInprogress'
import { startProfilerTimer, stopProfilerTimerIfRunningAndRecordDelta } from './time'
import { diffProperties } from '../reactDom/property'
export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
const noTimeout = -1;
const cancelTimeout = typeof clearTimeout === 'function' ? clearTimeout : () => null;
let workInProgressRootIncludedLanes: Lanes = NoLanes;
// The work left over by components that were visited during this render. Only
// includes unprocessed updates, not work in bailed out children.
let workInProgressRootSkippedLanes: Lanes = NoLanes;
// Lanes that were updated (in an interleaved event) during this render.
let workInProgressRootUpdatedLanes: Lanes = NoLanes;
// Lanes that were pinged (in an interleaved event) during this render.
let workInProgressRootPingedLanes: Lanes = NoLanes;
// let workInProgressRootExitStatus: RootExitStatus = RootIncomplete;
let workInProgressRootFatalError: mixed = null;

// let workInProgressRoot: FiberRoot | null = null;
// workInProgress: Fiber | null = null;
// let workInProgressRootRenderLanes: Lanes = NoLanes;
// Describes where we are in the React execution stack

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


/*
  以 node = <div><p>123</p><p><h1>456</h1></p></div>为例
                      
                    (1)                               (2)
              root ---> rootFiber              root ---> rootFiber                  
                            |                               | 
                            |                               |
                        divFiber                         divFiber
                          /                                 /
                         /                                 /
workInprogress --> pFiber1                           pFiber1 --> pFiber2   
                                                                  /
                                                                 /
                                                             h1Fiber <--workInprogress
                                    
*/

// 它对应的dom节点为p，dom标签创建出来以后进入appendAllChildren，因为当前的workInProgress节点为p，
// 所以它的child为null，无子节点可插入，退出 return null。 调用栈回到workInProgress = siblingFiber 并且
// 开始pFiber2的beginwork， 然后开始其child 是h1进入到h1的beginwork 其child为null进入到h1的completework
// 也就是第二幅图执行完h1fiber的completework后它没有child和sibling 那么 completeWork = h1Fiber.return 
// 来到divFiber的completeWork阶段  并且将两个子节点p1 p2 的dom节点通过appendAllChildren都插入到div的dom节点下
// 课件beginwork是从上而下的深度遍历dom树，创建对应的fiber树，completeWork是从叶子几点开始向上，创建对应的dom节点
// 但是此时的dom节点并没有挂载到dom树上而是挂载到当前节点的stateNode上，并且把其子几点都append到自己的dom上这样执行
// 到最后其实所有的dom都被挂载到了div节点上，在commit节点只需要把这个div节点挂载到container节点即可
// 
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
      // 若current存在并且workInProgress.stateNode（workInProgress节点对应的DOM实例）存在，
      //说明此workInProgress节点的DOM节点已经存在，走更新逻辑，否则进行创建。
      // 若对已有DOM节点进行更新，说明只对属性进行更新即可，因为节点已经存在，不存在删除和新增的情况。
      // updateHostComponent函数负责HostComponent对应DOM节点属性的更新
      if (current !== null && workInProgress.stateNode != null) {
        // 更新的逻辑
        updateHostComponent(
          current,
          workInProgress,
          type,
          newProps,
          rootContainerInstance,
        );

        console.log('completeWork 更新dom的逻辑 未实现')
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
          
          // DOM的插入并不是将当前DOM插入它的父节点，而是将当前这个DOM节点的第一层子节点插入到它自己的下面。
          appendAllChildren(instance, workInProgress, false, false);

          workInProgress.stateNode = instance;

          // 上面的插入过程完成了DOM树的构建，这之后要做的就是为每个DOM节点计算它自己的属性（props）。
          // 由于节点存在创建和更新两种情况，所以对属性的处理也会区别对待。
          // 属性的创建相对更新来说比较简单，这个过程发生在DOM节点构建的最后，
          // 调用finalizeInitialChildren函数完成新节点的属性设置。
          if (
            finalizeInitialChildren(
              instance,
              type,
              newProps,
              rootContainerInstance,
              currentHostContext,
            )
          ) {
             // 最终会依据textarea的autoFocus属性
             // 来决定是否更新fiber
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
      // / 若current存在并且workInProgress.stateNode（workInProgress节点对应的DOM实例）存在，
      //说明此workInProgress节点的DOM节点已经存在，走更新逻辑，否则进行创建。
      if (current && workInProgress.stateNode != null) {
        // const oldText = current.memoizedProps;
        console.log('completeWork 更新Text的逻辑 未实现')
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
// 和Host 类型)； 2.根据子fiber 的lane和childLane, 重新计算当前fiber的childLane;  3. 将
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

      // 这里关于ProfileMode可以参考createHostRootFiber这个函数
      if (
        !enableProfilerTimer ||
        (completedWork.mode & ProfileMode) === NoMode
      ) {
        console.log('completeUnitOfWork, 流程进入到了if')
        // 对节点进行completeWork，生成DOM，更新props，绑定事件
        next = completeWork(current, completedWork, subtreeRenderLanes);
      } else {
        console.log('completeUnitOfWork, 流程进入到了else')
        startProfilerTimer(completedWork);
         // 对节点进行completeWork，生成DOM，更新props，绑定事件
        next = completeWork(current, completedWork, subtreeRenderLanes);
        // Update render duration assuming we didn't error.
        stopProfilerTimerIfRunningAndRecordDelta(completedWork, false);
      }

   
      // 下边next !== null 与 siblingFiber !== null 都是赋值workInprogress 
      // 然后结束complete流程回到performUnitOfWork 
      // 这里只有在SuspenseComponent这种类型下出现过next不是null的返回，所以暂时可以忽略之
      if (next !== null) {
        // Completing this fiber spawned new work. Work on that next.
        // 完成这个fiber结点的时候产生了一个新的work，接下来处理这个work
       WorkIn.workInProgress = next;
        return;  // 结束流程
      }

    

    } else {
      // 什么情况下节点会被标记上Incomplete呢？
      // 这还要从最外层的工作循环说起。
      // concurrent模式的渲染函数：renderRootConcurrent之中在构建workInProgress树时，
      //使用了try...catch来包裹执行函数，这对处理报错节点提供了机会。一旦某个节点执行出错，会进入handleError函数处理。
      //该函数中可以获取到当前出错的workInProgress节点，除此之外我们暂且不关注其他功能，只需清楚它调用了throwException。
     //throwException会为这个出错的workInProgress节点打上Incomplete 的 effectTag，
     // 表明未完成，在向上找到可以处理错误的节点（即错误边界），添加上ShouldCapture 的 effectTag。
     /*
      另外，创建代表错误的update，getDerivedStateFromError放入payload，componentDidCatch放入callback。最后这个update入队节点的updateQueue。

      throwException执行完毕，回到出错的workInProgress节点，执行completeUnitOfWork，目的是将错误终止到当前的节点，因为它本身都出错了，再向下渲染没有意义。
     */
    /*
      对出错节点执行unwindWork。
      将出错节点的父节点（returnFiber）标记上Incomplete，目的是在父节点执行到completeUnitOfWork的时候，
      也能被执行unwindWork，进而验证它是否是错误边界。
      清空出错节点父节点上的effect链
    */
   // 关于错误，react这里的水比较深注意处理https://segmentfault.com/a/1190000039031957
      const next = unwindWork(completedWork, subtreeRenderLanes);

      // Because this fiber did not complete, don't reset its expiration time.

      if (next !== null) {
        
        next.flags &= HostEffectMask;
        WorkIn.workInProgress = next;
        return;
      }
    }
      // 这里处理siblingFiber这就是fiber树这种模型设计的好处————> 可以很方便的访问层这个概念
      const siblingFiber = completedWork.sibling;
      if (siblingFiber !== null) {
        // If there is more work to do in this returnFiber, do that next.
        WorkIn.workInProgress = siblingFiber;
        return;
      }
      completedWork = returnFiber;
      // Update the next thing we're working on in case something throws.
      WorkIn.workInProgress = completedWork;

  } while (completedWork !== null);
   // We've reached the root.
   if (WorkIn.workInProgressRootExitStatus === RootIncomplete) {
    WorkIn.workInProgressRootExitStatus = RootCompleted;
  }
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

  // !在react代码中很多操作都是成对存在的 而且都是用begin和complete作为前缀或者后缀
 */
// 执行更新的操作
function performUnitOfWork(unitOfWork: Fiber):void {
   // 创建一个备份的fiber
    // 最理想的情况是不依靠current fiber, 创建一个workInProgress
    // 创建一个workInProgress的alternate属性指向current fiber
    const current = unitOfWork.alternate;  // current 
    
     let next;
  
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
      /*
        在Diff之后workInProgress节点就会进入complete阶段。
        这个时候拿到的workInProgress节点都是经过diff算法调和过的，
        也就意味着对于某个节点来说它fiber的形态已经基本确定了，但除此之外还有两点未实现：
        1 目前只有fiber形态变了，对于原生DOM组件（HostComponent）和文本节点（HostText）的fiber来说，
        对应的DOM节点（fiber.stateNode）还没变化。
        2经过Diff生成的新的workInProgress节点持有了flag(即effectTag)

        所以接下来要做的事：
        1构建或更新DOM节点， 会自下而上将子节点的一层一层插入到当前节点。更新过程中，
        会计算DOM节点的属性，一旦属性需要更新，会为DOM节点对应的workInProgress节点标记Update的effectTag。
        2自下而上收集effectList，最终收集到root上
      */
      completeUnitOfWork(unitOfWork);
    } else {
      // 如果具有
      // workInProgress设置为一下个工作
      console.log('next')
      WorkIn.workInProgress = next || null;
    }
  
    // ReactCurrentOwner.current = null;

}

// 循环遍历performUnitOfWork， 同步更新
function workLoopSync() {
  // debugger
  while (WorkIn.workInProgress !== null) {  // 同步更新的时候，一次性更新完
    // 执行更新操作
   console.log('work loop')
  //  debugger
    performUnitOfWork(WorkIn.workInProgress);  // rootFiber的alternate
  }
}


/** @noinline */
function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (WorkIn.workInProgress !== null && !shouldYield()) {
    performUnitOfWork(WorkIn.workInProgress);
  }
}

function popDispatcher(prevDispatcher: any) {
  ReactCurrentDispatcher.current = prevDispatcher;
}

// 处理更新
export function renderRootSync (root: FiberRoot, lanes: Lanes) {
  // debugger
  
  const prevExecutionContext = Cxt.executionContext;
  // 这里给Cxt.executionContext 添加RenderContext 标识当前主线程正在进行render 
  // 在后边的schedulerUpdateOnFiber中作为关键条件被使用
  Cxt.executionContext |= RenderContext;
  
  const prevDispatcher = pushDispatcher();

  // 如果root或者lanes改变，丢弃现有的栈
  // 而且准备一个新的，否则我们会继续离开我们所在的地方

  if (WorkIn.workInProgressRoot !== root || WorkIn.workInProgressRootRenderLanes !== lanes) {
    
    // 准备一个当前fiber节点的克隆 放在全局变量workInProgress中
    prepareFreshStack(root, lanes);
    // 不处理
    startWorkOnPendingInteractions(root, lanes);
  }
  // debugger
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
  resetContextDependencies();
  // if (enableSchedulerTracing) {
  //   popInteractions(((prevInteractions: any): Set<Interaction>));
  // }

  Cxt.executionContext = prevExecutionContext;
  popDispatcher(prevDispatcher);

  // if (enableSchedulingProfiler) {
  //   markRenderStopped();
  // }

  // Set this to null to indicate there's no in-progress render.
  WorkIn.workInProgressRoot = null;
  WorkIn.workInProgressRootRenderLanes = NoLanes;

  return WorkIn.workInProgressRootExitStatus;
}

export function scheduleCallback(
  reactPriorityLevel: ReactPriorityLevel,
  callback: SchedulerCallback,
  options: SchedulerCallbackOptions | void | null,
) {
  // const priorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel);
  // return Scheduler_scheduleCallback(priorityLevel, callback, options);
}
function startWorkOnPendingInteractions(root: FiberRoot, lanes: Lanes) {
  // This is called when new work is started on a root.
  if (!enableSchedulerTracing) {
    return;
  }

  // Determine which interactions this batch of work currently includes, So that
  // we can accurately attribute time spent working on it, And so that cascading
  // work triggered during the render phase will be associated with it.
  const interactions: Set<Interaction> = new Set();
  root.pendingInteractionMap.forEach((scheduledInteractions, scheduledLane) => {
    if (includesSomeLane(lanes, scheduledLane)) {
      scheduledInteractions.forEach(interaction =>
        interactions.add(interaction),
      );
    }
  });

  // Store the current set of interactions on the FiberRoot for a few reasons:
  // We can re-use it in hot functions like performConcurrentWorkOnRoot()
  // without having to recalculate it. We will also use it in commitWork() to
  // pass to any Profiler onRender() hooks. This also provides DevTools with a
  // way to access it when the onCommitRoot() hook is called.
  root.memoizedInteractions = interactions;

  if (interactions.size > 0) {
    
    const subscriber = __subscriberRef.current;
    if (subscriber !== null) {
      const threadID = computeThreadID(root, lanes);
      try {
        subscriber.onWorkStarted(interactions, threadID);
      } catch (error) {
        // If the subscriber throws, rethrow it in a separate task
        scheduleCallback(ImmediateSchedulerPriority, () => {
          throw error;
        });
      }
    }
  }
}
export function createWorkInProgress(current: Fiber|null, pendingProps: any): Fiber {
  // debugger
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
    console.info('%c ⚛️  更新','color: red; font-size: 26px;background: yellow')
    workInProgress.pendingProps = pendingProps;
    // Needed because Blocks store data on type.
    workInProgress.type = current.type;

    // We already have an alternate.
    // Reset the effect tag.
    workInProgress.flags = NoFlags;

    // The effects are no longer valid.
    workInProgress.subtreeFlags = NoFlags;
    workInProgress.deletions = null;

    if (enableProfilerTimer) {
      // We intentionally reset, rather than copy, actualDuration & actualStartTime.
      // This prevents time from endlessly accumulating in new commits.
      // This has the downside of resetting values for different priority renders,
      // But works for yielding (the common case) and should support resuming.
      workInProgress.actualDuration = 0;
      workInProgress.actualStartTime = -1;
    }
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
  const timeoutHandle = root.timeoutHandle;
  if (timeoutHandle !== noTimeout) {
    // The root previous suspended and scheduled a timeout to commit a fallback
    // state. Now that we have additional work, cancel the timeout.
    root.timeoutHandle = noTimeout;
    // $FlowFixMe Complains noTimeout is not a TimeoutID, despite the check above
    cancelTimeout(timeoutHandle);
  }
  // debugger
  if (WorkIn.workInProgress !== null) {
    let interruptedWork = WorkIn.workInProgress.return;
    while (interruptedWork !== null) {
      console.log('unwindInterruptedWork未实现')
      // unwindInterruptedWork(interruptedWork, workInProgressRootRenderLanes);
      interruptedWork = interruptedWork.return;
    }
  }

  // 这里对全局变量workInProgressRoot赋值赋值为当前的root对象
  WorkIn.workInProgressRoot = root;
  WorkIn.workInProgress = createWorkInProgress(root.current, null);

  WorkIn.workInProgressRootRenderLanes = subtreeRenderLanes = workInProgressRootIncludedLanes = lanes;
  WorkIn.workInProgressRootExitStatus = RootIncomplete;
  workInProgressRootFatalError = null;
  workInProgressRootSkippedLanes = NoLanes;
  workInProgressRootUpdatedLanes = NoLanes;
  workInProgressRootPingedLanes = NoLanes;

}

export function markSkippedUpdateLanes(lane: Lane | Lanes): void {
  workInProgressRootSkippedLanes = mergeLanes(
    lane,
    workInProgressRootSkippedLanes,
  );
}

const supportsMicrotasks = false;
export function performSyncWorkOnRoot(root: FiberRoot) {

  flushPassiveEffects();
  let lanes;
  let exitStatus;
 
  if(  root === WorkIn.workInProgressRoot 
    &&includesSomeLane(root.expiredLanes, WorkIn.workInProgressRootRenderLanes)) 
    {
      lanes = WorkIn.workInProgressRootRenderLanes;
      exitStatus = renderRootSync(root, lanes);
    } else {
      lanes = getNextLanes(root, NoLanes);

      if (supportsMicrotasks) {
        // const nextLanesPriority = returnNextLanesPriority();
        // if (nextLanesPriority < InputDiscreteLanePriority) {
        //   return null;
        // }
      }
      exitStatus = renderRootSync(root, lanes);
  }

//   // 标示完成的工作
 const finishedWork: Fiber|null = (root.current?.alternate)||null;
 root.finishedWork = finishedWork;
 root.finishedLanes = lanes;
//  // 开始commitRoot的部分
// 至此，render阶段全部工作完成。在performSyncWorkOnRoot函数中fiberRootNode被传递给commitRoot方法，
// 开启commit阶段工作流程。
 commitRoot(root);
 ensureRootIsScheduled(root, now());
 return null;
}


function markUpdate(workInProgress: Fiber) {
  // Tag the fiber with an update effect. This turns a Placement into
  // a PlacementAndUpdate.
  workInProgress.flags |= Update;
}

function pushDispatcher() {
  const prevDispatcher = ReactCurrentDispatcher.current;
  ReactCurrentDispatcher.current = {} as any; // TODO
  if (prevDispatcher === null) {
    // The React isomorphic package does not include a default dispatcher.
    // Instead the first renderer will lazily attach one, in order to give
    // nicer error messages.
    return {} as any;
  } else {
    return prevDispatcher;
  }
}


// This is the entry point for every concurrent task, i.e. anything that
// goes through Scheduler.
export function performConcurrentWorkOnRoot(root: FiberRoot, didTimeout: boolean) {
  console.log('执行performConcurrentWorkOnRoot')
  // if (enableProfilerTimer && enableProfilerNestedUpdatePhase) {
  //   resetNestedUpdateFlag();
  // }

  // // Since we know we're in a React event, we can clear the current
  // // event time. The next update will compute a new event time.
  // currentEventTime = NoTimestamp;
  // currentEventWipLanes = NoLanes;
  // currentEventTransitionLane = NoLanes;

  // invariant(
  //   (executionContext & (RenderContext | CommitContext)) === NoContext,
  //   'Should not already be working.',
  // );

  // // Flush any pending passive effects before deciding which lanes to work on,
  // // in case they schedule additional work.
  // const originalCallbackNode = root.callbackNode;
  // const didFlushPassiveEffects = flushPassiveEffects();
  // if (didFlushPassiveEffects) {
  //   // Something in the passive effect phase may have canceled the current task.
  //   // Check if the task node for this root was changed.
  //   if (root.callbackNode !== originalCallbackNode) {
  //     // The current task was canceled. Exit. We don't need to call
  //     // `ensureRootIsScheduled` because the check above implies either that
  //     // there's a new task, or that there's no remaining work on this root.
  //     return null;
  //   } else {
  //     // Current task was not canceled. Continue.
  //   }
  // }

  // // Determine the next expiration time to work on, using the fields stored
  // // on the root.
  // let lanes = getNextLanes(
  //   root,
  //   root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes,
  // );
  // if (lanes === NoLanes) {
  //   // Defensive coding. This is never expected to happen.
  //   return null;
  // }

  // // TODO: We only check `didTimeout` defensively, to account for a Scheduler
  // // bug we're still investigating. Once the bug in Scheduler is fixed,
  // // we can remove this, since we track expiration ourselves.
  // if (!disableSchedulerTimeoutInWorkLoop && didTimeout) {
  //   // Something expired. Flush synchronously until there's no expired
  //   // work left.
  //   markRootExpired(root, lanes);
  //   // This will schedule a synchronous callback.
  //   ensureRootIsScheduled(root, now());
  //   return null;
  // }

  // let exitStatus = renderRootConcurrent(root, lanes);
  // if (exitStatus !== RootIncomplete) {
  //   if (exitStatus === RootErrored) {
  //     executionContext |= RetryAfterError;

  //     // If an error occurred during hydration,
  //     // discard server response and fall back to client side render.
  //     if (root.hydrate) {
  //       root.hydrate = false;
  //       clearContainer(root.containerInfo);
  //     }

  //     // If something threw an error, try rendering one more time. We'll render
  //     // synchronously to block concurrent data mutations, and we'll includes
  //     // all pending updates are included. If it still fails after the second
  //     // attempt, we'll give up and commit the resulting tree.
  //     lanes = getLanesToRetrySynchronouslyOnError(root);
  //     if (lanes !== NoLanes) {
  //       exitStatus = renderRootSync(root, lanes);
  //     }
  //   }

  //   if (exitStatus === RootFatalErrored) {
  //     const fatalError = workInProgressRootFatalError;
  //     prepareFreshStack(root, NoLanes);
  //     markRootSuspended(root, lanes);
  //     ensureRootIsScheduled(root, now());
  //     throw fatalError;
  //   }

  //   // We now have a consistent tree. The next step is either to commit it,
  //   // or, if something suspended, wait to commit it after a timeout.
  //   const finishedWork: Fiber = (root.current.alternate: any);
  //   root.finishedWork = finishedWork;
  //   root.finishedLanes = lanes;
  //   finishConcurrentRender(root, exitStatus, lanes);
  // }

  // ensureRootIsScheduled(root, now());
  // if (root.callbackNode === originalCallbackNode) {
  //   // The task node scheduled for this root is the same one that's
  //   // currently executed. Need to return a continuation.
  //   return performConcurrentWorkOnRoot.bind(null, root);
  // }
  return null;
}


function updateHostComponent (current: Fiber,
  workInProgress: Fiber,
  type: any,
  newProps: Props,
  rootContainerInstance: Container,) {
    const oldProps = current.memoizedProps;
    if (oldProps === newProps) {
      return;
    }
    const instance: Instance = workInProgress.stateNode;
    const currentHostContext = getHostContext();

    // 它的形式是以2为单位，index为偶数的是key，为奇数的是value：
    // eg [ 'style', { color: 'blue' }, title, '测试标题' ]
    const updatePayload = prepareUpdate(
      instance,
      type,
      oldProps,
      newProps,
      rootContainerInstance,
      currentHostContext,
    );
    // 最终新属性被挂载到updateQueue中，供commit阶段使用
    workInProgress.updateQueue = (updatePayload);

    if (updatePayload) {
      // 标记workInProgress节点有更新主要是flags实现
      markUpdate(workInProgress);
    }
}

export function prepareUpdate(
  domElement: Instance,
  type: string,
  oldProps: Props,
  newProps: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
): null | Array<mixed> {
 
  return diffProperties(
    domElement,
    type,
    oldProps,
    newProps,
    rootContainerInstance,
  );
}
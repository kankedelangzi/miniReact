import { FiberRoot, ReactPriorityLevel,Fiber, 
  Placement,Update , Hydrating, PlacementAndUpdate,
  HostComponent, HostRoot,HostPortal,
  HostText,DehydratedFragment,Instance,
  HydratingAndUpdate,
  Container,
  BeforeMutationMask, NoFlags, MutationMask, 
  Snapshot, Passive, ContentReset, Ref, Profiler, 
  LayoutMask, FunctionComponent, ForwardRef, SimpleMemoComponent, 
  Block, ClassComponent, Callback, SuspenseComponent, 
  Props, UpdateQueue, ScopeComponent, Deletion } from '../type/index'
import { getCurrentPriorityLevel } from './tools'
import { NoLanes}  from '../reactDom/lane'
import { ImmediatePriority as  ImmediateSchedulerPriority} from '../reactDom/tools'
import { ImmediatePriority } from '../scheduler/propity'
import Scheduler from '../scheduler/index'
import { insertInContainerBefore, appendChildToContainer, insertBefore, appendChild } from '../reactDom/domOperation'
import { FunctionComponentUpdateQueue, HookFlags, 
  Layout as HookLayout,  HasEffect as HookHasEffect, enableScopeAPI, } from '../type/constant'
import { commitWork } from './commitWork'
import { commitBeforeMutationLifeCycles as commitBeforeMutationEffectOnFiber } from './classComponent'
import { NormalPriority as NormalSchedulerPriority, scheduleCallback } from './scheduler'
const { unstable_runWithPriority  } = Scheduler
const Scheduler_runWithPriority = unstable_runWithPriority

const requestPaint = () => null;

let nextEffect: Fiber | null = null;
let hasUncaughtError = false;
let firstUncaughtError = null;
let legacyErrorBoundariesThatAlreadyFailed: Set<mixed> | null = null;

let rootWithPendingPassiveEffects: FiberRoot | null = null;
// let pendingPassiveEffectsRenderPriority: ReactPriorityLevel = NoSchedulerPriority;
let pendingPassiveEffectsLanes: Lanes = NoLanes;
let pendingPassiveHookEffectsMount: Array<HookEffect | Fiber> = [];
let pendingPassiveHookEffectsUnmount: Array<HookEffect | Fiber> = [];
let pendingPassiveProfilerEffects: Array<Fiber> = [];

let rootsWithPendingDiscreteUpdates: Set<FiberRoot> | null = null;

// Use these to prevent an infinite loop of nested updates
const NESTED_UPDATE_LIMIT = 50;
let nestedUpdateCount: number = 0;
let rootWithNestedUpdates: FiberRoot | null = null;

const NESTED_PASSIVE_UPDATE_LIMIT = 50;
let nestedPassiveUpdateCount: number = 0;

let rootDoesHavePassiveEffects: boolean = false;
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

/*
commit 阶段大致可以分为以下几个过程：

获取 effectList 链表，如果 root 上有 effect，则将其也添加进 effectList 中
对 effectList 进行第一次遍历，执行 commitBeforeMutationEffects 函数来更新class组件实例上的state、props 等，以及执行 getSnapshotBeforeUpdate 生命周期函数
对 effectList 进行第二次遍历，执行 commitMutationEffects 函数来完成副作用的执行，主要包括重置文本节点以及真实 dom 节点的插入、删除和更新等操作。
对 effectList 进行第三次遍历，执行 commitLayoutEffects 函数，去触发 componentDidMount、componentDidUpdate 以及各种回调函数等
最后进行一点变量还原之类的收尾，就完成了 commit 阶段

*/


/*
在rootFiber.firstEffect上保存了一条需要执行副作用的Fiber节点的单向链表effectList，
这些Fiber节点的updateQueue中保存了变化的props。这些副作用对应的DOM操作在commit阶段执行。
除此之外，一些生命周期钩子（比如componentDidXXX）、hook（比如useEffect）需要在commit阶段执行。
*/
function commitRootImpl(root: FiberRoot, renderPriorityLevel: ReactPriorityLevel) {
  do {
    /* 翻译的原文注释
    `flushPassiveEffects` 会在最后调用 `flushSyncUpdateQueue`，
    这意味着 `flushPassiveEffects` 有时会导致额外的被动效果。所以我们需要保持循环刷新，
    直到没有更多的待处理效果。
    TODO：如果 `flushPassiveEffects` 没有自动执行可能会更好
    最后刷新同步工作，以避免像这样的分解危险。
    */
    flushPassiveEffects();
  } while (rootWithPendingPassiveEffects !== null);
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


   // 总的来说执行的是mutate之前的准备工作，包括被标记delete的Fiber以及useEffect的依赖删除
   // 也就是我们写的useEffect的return函数的调用，防止内存泄漏
    const shouldFireAfterActiveInstanceBlur = commitBeforeMutationEffects(
      finishedWork
    );

     // 下一个阶段是”mutation“阶段，在这个阶段我们会把构建好的DOM树（host tree）append到根容器
    // 重要！只有到了这个阶段react的渲染效果才会呈现在浏览器上

    commitMutationEffects(finishedWork, root, renderPriorityLevel);

     // 下一个阶段是“layout”阶段，我们调用副作用方法在host tree被挂载进更容器后。
    // 这个阶段的习惯用法是用于布局，但出于遗留原因，类组件生命周期也会触发
    /*
     //commit lifecycles,也就是触发生命周期的 api

          //① 循环 effect 链，针对不同的 fiber 类型，进行effect.destroy()/componentDidMount()/callback/node.focus()等操作
          //② 指定 ref 的引用
    
    */

      try {
        recursivelyCommitLayoutEffects(finishedWork, root);
      } catch (error) {
        // captureCommitPhaseErrorOnRoot(finishedWork, finishedWork, error);
      }


      requestPaint();

}

function recursivelyCommitLayoutEffects(
  finishedWork: Fiber,
  finishedRoot: FiberRoot,
) {
  const {flags, tag} = finishedWork;
  switch (tag) {
    case Profiler: {
      let prevProfilerOnStack = null;
      if (enableProfilerTimer && enableProfilerCommitHooks) {
        prevProfilerOnStack = nearestProfilerOnStack;
        nearestProfilerOnStack = finishedWork;
      }

      let child = finishedWork.child;
      while (child !== null) {
        const primarySubtreeFlags = finishedWork.subtreeFlags & LayoutMask;
        if (primarySubtreeFlags !== NoFlags) {
          if (__DEV__) {
            const prevCurrentFiberInDEV = currentDebugFiberInDEV;
            setCurrentDebugFiberInDEV(child);
            invokeGuardedCallback(
              null,
              recursivelyCommitLayoutEffects,
              null,
              child,
              finishedRoot,
            );
            if (hasCaughtError()) {
              const error = clearCaughtError();
              captureCommitPhaseError(child, finishedWork, error);
            }
            if (prevCurrentFiberInDEV !== null) {
              setCurrentDebugFiberInDEV(prevCurrentFiberInDEV);
            } else {
              resetCurrentDebugFiberInDEV();
            }
          } else {
            try {
              recursivelyCommitLayoutEffects(child, finishedRoot);
            } catch (error) {
              captureCommitPhaseError(child, finishedWork, error);
            }
          }
        }
        child = child.sibling;
      }

      const primaryFlags = flags & (Update | Callback);
      if (primaryFlags !== NoFlags) {
        if (enableProfilerTimer) {
          if (__DEV__) {
            const prevCurrentFiberInDEV = currentDebugFiberInDEV;
            setCurrentDebugFiberInDEV(finishedWork);
            invokeGuardedCallback(
              null,
              commitLayoutEffectsForProfiler,
              null,
              finishedWork,
              finishedRoot,
            );
            if (hasCaughtError()) {
              const error = clearCaughtError();
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }
            if (prevCurrentFiberInDEV !== null) {
              setCurrentDebugFiberInDEV(prevCurrentFiberInDEV);
            } else {
              resetCurrentDebugFiberInDEV();
            }
          } else {
            try {
              commitLayoutEffectsForProfiler(finishedWork, finishedRoot);
            } catch (error) {
              captureCommitPhaseError(finishedWork, finishedWork.return, error);
            }
          }
        }
      }

      if (enableProfilerTimer && enableProfilerCommitHooks) {
        // Propagate layout effect durations to the next nearest Profiler ancestor.
        // Do not reset these values until the next render so DevTools has a chance to read them first.
        if (prevProfilerOnStack !== null) {
          prevProfilerOnStack.stateNode.effectDuration +=
            finishedWork.stateNode.effectDuration;
        }

        nearestProfilerOnStack = prevProfilerOnStack;
      }
      break;
    }

    // case Offscreen: {
    //   TODO: Fast path to invoke all nested layout effects when Offscren goes from hidden to visible.
    //   break;
    // }

    default: {
      let child = finishedWork.child;
      while (child !== null) {
        const primarySubtreeFlags = finishedWork.subtreeFlags & LayoutMask;
        if (primarySubtreeFlags !== NoFlags) {
          try {
            recursivelyCommitLayoutEffects(child, finishedRoot);
          } catch (error) {
            // captureCommitPhaseError(child, finishedWork, error);
          }
        }
        child = child.sibling;
      }

      const primaryFlags = flags & (Update | Callback);
      if (primaryFlags !== NoFlags) {
        switch (tag) {
          case FunctionComponent:
          case ForwardRef:
          case SimpleMemoComponent:
          case Block: {
            // if (
            //   enableProfilerTimer &&
            //   enableProfilerCommitHooks &&
            //   finishedWork.mode & ProfileMode
            // ) {
            //   try {
            //     startLayoutEffectTimer();
            //     commitHookEffectListMount(
            //       HookLayout | HookHasEffect,
            //       finishedWork,
            //     );
            //   } finally {
            //     recordLayoutEffectDuration(finishedWork);
            //   }
            // } else {
            //   commitHookEffectListMount(
            //     HookLayout | HookHasEffect,
            //     finishedWork,
            //   );
            // }
            commitHookEffectListMount( HookLayout | HookHasEffect, finishedWork);

            // if ((finishedWork.subtreeFlags & PassiveMask) !== NoFlags) {
            //   schedulePassiveEffectCallback();
            // }
            break;
          }
          case ClassComponent: {
            // NOTE: Layout effect durations are measured within this function.
            commitLayoutEffectsForClassComponent(finishedWork);
            break;
          }
          case HostRoot: {
            commitLayoutEffectsForHostRoot(finishedWork);
            break;
          }
          case HostComponent: {
            commitLayoutEffectsForHostComponent(finishedWork);
            break;
          }
          case SuspenseComponent: {
            // commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
            break;
          }
          // case FundamentalComponent:
          // case HostPortal:
          // case HostText:
          // case IncompleteClassComponent:
          // case LegacyHiddenComponent:
          // case OffscreenComponent:
          // case ScopeComponent:
          // case SuspenseListComponent: {
          //   // We have no life-cycles associated with these component types.
          //   break;
          // }
          default: {
            // invariant(
            //   false,
            //   'This unit of work tag should not have side-effects. This error is ' +
            //     'likely caused by a bug in React. Please file an issue.',
            // );
          }
        }
      }

      // if (enableScopeAPI) {
      //   // TODO: This is a temporary solution that allowed us to transition away from React Flare on www.
      //   if (flags & Ref && tag !== ScopeComponent) {
      //     commitAttachRef(finishedWork);
      //   }
      // } else {
      //   if (flags & Ref) {
      //     commitAttachRef(finishedWork);
      //   }
      // }
      break;
    }
  }
}

function commitHookEffectListMount(flags: HookFlags, finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue as any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect!.tag & flags) === flags) {
        // Mount
        const create = effect!.create;
        effect!.destroy = create();
      }
      effect = effect!.next;
    } while (effect !== firstEffect);
  }
}

// 在这里处理了classComponent的各种生命周期
function commitLayoutEffectsForClassComponent(finishedWork: Fiber) {
  const instance = finishedWork.stateNode;
  const current = finishedWork.alternate;
  if (finishedWork.flags & Update) {
    if (current === null) {
      // We could update instance props and state here,
      // but instead we rely on them being set during last render.
      // TODO: revisit this when we implement resuming.
      
      // if (
      //   enableProfilerTimer &&
      //   enableProfilerCommitHooks &&
      //   finishedWork.mode & ProfileMode
      // ) {
      //   try {
      //     startLayoutEffectTimer();
      //     instance.componentDidMount();
      //   } finally {
      //     recordLayoutEffectDuration(finishedWork);
      //   }
      // } else {
      //   instance.componentDidMount();
      // }
    } else {
      // const prevProps =
      //   finishedWork.elementType === finishedWork.type
      //     ? current.memoizedProps
      //     : resolveDefaultProps(finishedWork.type, current.memoizedProps);
      // const prevState = current.memoizedState;
      // We could update instance props and state here,
      // but instead we rely on them being set during last render.
      // TODO: revisit this when we implement resuming.
      
      // if (
      //   enableProfilerTimer &&
      //   enableProfilerCommitHooks &&
      //   finishedWork.mode & ProfileMode
      // ) {
      //   try {
      //     startLayoutEffectTimer();
      //     instance.componentDidUpdate(
      //       prevProps,
      //       prevState,
      //       instance.__reactInternalSnapshotBeforeUpdate,
      //     );
      //   } finally {
      //     recordLayoutEffectDuration(finishedWork);
      //   }
      // } else {
      //   instance.componentDidUpdate(
      //     prevProps,
      //     prevState,
      //     instance.__reactInternalSnapshotBeforeUpdate,
      //   );
      // }
    }
  }

  // TODO: I think this is now always non-null by the time it reaches the
  // commit phase. Consider removing the type check.
  const updateQueue: UpdateQueue<any> | null = (finishedWork.updateQueue as any);
  if (updateQueue !== null) {
    // We could update instance props and state here,
    // but instead we rely on them being set during last render.
    // TODO: revisit this when we implement resuming.
    commitUpdateQueue(finishedWork, updateQueue, instance);
  }
}
export function getPublicInstance(instance: Instance): any {
  return instance;
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
        // callCallback(callback, instance);
        callback.call(instance);
      }
    }
  }
}
function commitLayoutEffectsForHostRoot(finishedWork: Fiber) {
  // TODO: I think this is now always non-null by the time it reaches the
  // commit phase. Consider removing the type check.
  const updateQueue: UpdateQueue<any> | null = (finishedWork.updateQueue as any);
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
}
function commitLayoutEffectsForHostComponent(finishedWork: Fiber) {
  const instance: Instance = finishedWork.stateNode;
  const current = finishedWork.alternate;

  // Renderers may schedule work to be done after host components are mounted
  // (eg DOM renderer may schedule auto-focus for inputs and form controls).
  // These effects should only be committed when components are first mounted,
  // aka when there is no current/alternate.
  if (current === null && finishedWork.flags & Update) {
    const type = finishedWork.type;
    const props = finishedWork.memoizedProps;
    commitMount(instance, type, props, finishedWork);
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
    (domElement as any).focus();
  }
}

let focusedInstanceHandle: null | Fiber = null;
let shouldFireAfterActiveInstanceBlur: boolean = false;

/*
commitBeforeMutationEffects 中，会从 firstEffect 开始，通过 nextEffect 不断对 
effectList 链表进行遍历，若是当前的 fiber 节点有 flags 副作用，则执行 
commitBeforeMutationEffectOnFiber 节点去对针对 class 组件单独处理。
*/

function commitBeforeMutationEffects() {
   // eslint-disable-next-line react-internal/no-production-logging
  console.log('##&&::','commitBeforeMutationEffects')
  while (nextEffect !== null) {
    const current = nextEffect.alternate;

    if (!shouldFireAfterActiveInstanceBlur && focusedInstanceHandle !== null) {
      // if ((nextEffect.flags & Deletion) !== NoFlags) {
      //   if (doesFiberContain(nextEffect, focusedInstanceHandle)) {
      //     shouldFireAfterActiveInstanceBlur = true;
      //     beforeActiveInstanceBlur();
      //   }
      // } else {
      //   // TODO: Move this out of the hot path using a dedicated effect tag.
      //   if (
      //     nextEffect.tag === SuspenseComponent &&
      //     isSuspenseBoundaryBeingHidden(current, nextEffect) &&
      //     doesFiberContain(nextEffect, focusedInstanceHandle)
      //   ) {
      //     shouldFireAfterActiveInstanceBlur = true;
      //     beforeActiveInstanceBlur();
      //   }
      // }
    }

    const flags = nextEffect.flags;
    if ((flags & Snapshot) !== NoFlags) {
      // setCurrentDebugFiberInDEV(nextEffect);

      commitBeforeMutationEffectOnFiber(current, nextEffect);

      // resetCurrentDebugFiberInDEV();
    }
    if ((flags & Passive) !== NoFlags) {
      // If there are passive effects, schedule a callback to flush at
      // the earliest opportunity.
      if (!rootDoesHavePassiveEffects) {
        rootDoesHavePassiveEffects = true;
        
        scheduleCallback(NormalSchedulerPriority, () => {
          flushPassiveEffects();
          return null;
        });
      }
    }
    nextEffect = nextEffect.nextEffect;
  }
}



/*
  flushPassiveEffects内部会设置优先级，并执行flushPassiveEffectsImpl

*/
function flushPassiveEffects() {
  
  flushPassiveEffectsImpl()
}
/*
flushPassiveEffectsImpl主要做三件事：
调用该useEffect在上一次render时的销毁函数
调用该useEffect在本次render时的回调函数
如果存在同步任务，不需要等待下次事件循环的宏任务，提前执行他
*/
function flushPassiveEffectsImpl() {
  console.log('flushPassiveEffectsImpl')
}

function commitMutationEffects(
  root: FiberRoot,
  renderPriorityLevel: ReactPriorityLevel,
) {
  // TODO: Should probably move the bulk of this function to commitWork.
  // eslint-disable-next-line no-debugger
  debugger
  while (nextEffect !== null) {
    // setCurrentDebugFiberInDEV(nextEffect);

    const flags = nextEffect.flags;

    if (flags & ContentReset) {
      // commitResetTextContent(nextEffect);
    }

    if (flags & Ref) {
      const current = nextEffect.alternate;
      if (current !== null) {
        // commitDetachRef(current);
      }
      if (enableScopeAPI) {
        // TODO: This is a temporary solution that allowed us to transition away
        // from React Flare on www.
        if (nextEffect.tag === ScopeComponent) {
          // commitAttachRef(nextEffect);
        }
      }
    }

    // The following switch statement is only concerned about placement,
    // updates, and deletions. To avoid needing to add a case for every possible
    // bitmap value, we remove the secondary effects from the effect tag and
    // switch on that value.
    const primaryFlags = flags & (Placement | Update | Deletion | Hydrating);
    switch (primaryFlags) {
      case Placement: {
        commitPlacement(nextEffect);
        // Clear the "placement" from effect tag so that we know that this is
        // inserted, before any life-cycles like componentDidMount gets called.
        // TODO: findDOMNode doesn't rely on this any more but isMounted does
        // and isMounted is deprecated anyway so we should be able to kill this.
        nextEffect.flags &= ~Placement;
        break;
      }
      case PlacementAndUpdate: {
        // Placement
        commitPlacement(nextEffect);
        // Clear the "placement" from effect tag so that we know that this is
        // inserted, before any life-cycles like componentDidMount gets called.
        nextEffect.flags &= ~Placement;

        // Update
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      case Hydrating: {
        nextEffect.flags &= ~Hydrating;
        break;
      }
      case HydratingAndUpdate: {
        nextEffect.flags &= ~Hydrating;

        // Update
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      case Update: {
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      case Deletion: {
        // commitDeletion(root, nextEffect, renderPriorityLevel);
        break;
      }
    }

    // resetCurrentDebugFiberInDEV();
    nextEffect = nextEffect.nextEffect;
  }
}

function commitMutationEffectsImpl(
  fiber: Fiber,
  root: FiberRoot,
  renderPriorityLevel: any,
) {
  const flags = fiber.flags;
  if (flags & ContentReset) {
    // commitResetTextContent(fiber);
  }

  if (flags & Ref) {
    const current = fiber.alternate;
    if (current !== null) {
      // commitDetachRef(current);
    }
    // if (enableScopeAPI) {
    //   // TODO: This is a temporary solution that allowed us to transition away from React Flare on www.
    //   if (fiber.tag === ScopeComponent) {
    //     commitAttachRef(fiber);
    //   }
    // }
  }

  // The following switch statement is only concerned about placement,
  // updates, and deletions. To avoid needing to add a case for every possible
  // bitmap value, we remove the secondary effects from the effect tag and
  // switch on that value.
  const primaryFlags = flags & (Placement | Update | Hydrating);
  // 这里的意思是处理Placement | Update | Hydrating 这三类操作
  // 根据flag的不同进行分别处理
  switch (primaryFlags) { 
    case Placement: {
      commitPlacement(fiber);
      // Clear the "placement" from effect tag so that we know that this is
      // inserted, before any life-cycles like componentDidMount gets called.
      // TODO: findDOMNode doesn't rely on this any more but isMounted does
      // and isMounted is deprecated anyway so we should be able to kill this.
      fiber.flags &= ~Placement;
      break;
    }
    case PlacementAndUpdate: {
      // Placement
      commitPlacement(fiber);
      // Clear the "placement" from effect tag so that we know that this is
      // inserted, before any life-cycles like componentDidMount gets called.
      fiber.flags &= ~Placement;

      // Update
      const current = fiber.alternate;
      commitWork(current, fiber);
      break;
    }
    case Hydrating: {
      fiber.flags &= ~Hydrating;
      break;
    }
    case HydratingAndUpdate: {
      fiber.flags &= ~Hydrating;

      // Update
      const current = fiber.alternate;
      commitWork(current, fiber);
      break;
    }
    case Update: {
      const current = fiber.alternate;
      commitWork(current, fiber);
      break;
    }
  }
}

function commitMutationEffectsDeletions(
  deletions: Array<Fiber>,
  nearestMountedAncestor: Fiber,
  root: FiberRoot,
  renderPriorityLevel: any,
) {
  for (let i = 0; i < deletions.length; i++) {
    const childToDelete = deletions[i];
    
      try {
        commitDeletion(
          root,
          childToDelete,
          nearestMountedAncestor,
          renderPriorityLevel,
        );
      } catch (error) {
        // captureCommitPhaseError(childToDelete, nearestMountedAncestor, error);
      }
    
  }
}

function commitDeletion(
  finishedRoot: FiberRoot,
  current: Fiber,
  nearestMountedAncestor: Fiber,
  renderPriorityLevel: ReactPriorityLevel,
): void {
  console.log(finishedRoot, current, nearestMountedAncestor, renderPriorityLevel)
  // if (supportsMutation) {
  //   // Recursively delete all host nodes from the parent.
  //   // Detach refs and call componentWillUnmount() on the whole subtree.
  //   unmountHostComponents(
  //     finishedRoot,
  //     current,
  //     nearestMountedAncestor,
  //     renderPriorityLevel,
  //   );
  // } else {
  //   // Detach refs and call componentWillUnmount() on the whole subtree.
  //   commitNestedUnmounts(
  //     finishedRoot,
  //     current,
  //     nearestMountedAncestor,
  //     renderPriorityLevel,
  //   );
  // }
  // const alternate = current.alternate;
  // detachFiberMutation(current);
  // if (alternate !== null) {
  //   detachFiberMutation(alternate);
  // }
}


// 执行到这一步就是将dom节点挂到container上去了，也就是dom渲染
function commitPlacement(finishedWork: Fiber): void {
 

  // Recursively insert all host nodes into the parent.
  const parentFiber = getHostParentFiber(finishedWork);

  // Note: these two variables *must* always be updated together.
  let parent;
  let isContainer;
  const parentStateNode = parentFiber!.stateNode;
  switch (parentFiber?.tag) {
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
    // case FundamentalComponent:
    //   if (enableFundamentalAPI) {
    //     parent = parentStateNode.instance;
    //     isContainer = false;
    //   }
    // eslint-disable-next-line-no-fallthrough
    default:
     // 报错
  }
  if (parentFiber!.flags & ContentReset) {// 处理重置text内容
    // Reset the text content of the parent before doing any insertions
    // resetTextContent(parent);
    // Clear ContentReset from the effect tag
    parentFiber!.flags &= ~ContentReset;
  }

  const before = getHostSibling(finishedWork);
  // We only have the top Fiber that was inserted but we need to recurse down its
  // children to find all the terminal nodes.
  if (isContainer) { 
    insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
  } else {
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



export function resolveDefaultProps() {
  //
}
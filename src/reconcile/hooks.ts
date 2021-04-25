import { Fiber, Lanes, Lane, ReactPriorityLevel} from '../type'
import { NoLanes } from '../reactDom/lane'
type Update<S, A> = {
  lane: Lane,
  action: A,
  eagerReducer: ((S: any, A: any) => S) | null,
  eagerState: S | null,
  next: Update<S, A>,
  priority?: ReactPriorityLevel,
};
export type UpdateQueue<S, A> = {
  pending: Update<S, A> | null,
  interleaved: Update<S, A> | null,
  lanes: Lanes,
  dispatch: any,
  lastRenderedReducer: ((S: any, A: any) => S) | null,
  lastRenderedState: S | null,
};
export type Hook = {
  memoizedState: any,
  baseState: any,
  baseQueue: Update<any, any> | null,
  queue: UpdateQueue<any, any> | null,
  next: Hook | null,
};

let renderLanes: Lanes = NoLanes;
let currentlyRenderingFiber: Fiber|null = null
let didScheduleRenderPhaseUpdate: boolean = false;
let didScheduleRenderPhaseUpdateDuringThisPass: boolean = false;
let currentHook: Hook | null = null;
let workInProgressHook: Hook | null = null;
export function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes,
): any {
  
  renderLanes = nextRenderLanes;
  currentlyRenderingFiber = workInProgress;



  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.lanes = NoLanes;

 
    // ReactCurrentDispatcher.current =
    //   current === null || current.memoizedState === null
    //     ? HooksDispatcherOnMount
    //     : HooksDispatcherOnUpdate;
  

  let children = Component(props, secondArg);

  // Check if there was a render phase update
  if (didScheduleRenderPhaseUpdateDuringThisPass) {
    // Keep rendering in a loop for as long as render phase updates continue to
    // be scheduled. Use a counter to prevent infinite loops.
    let numberOfReRenders: number = 0;
    do {
      didScheduleRenderPhaseUpdateDuringThisPass = false;
      

      numberOfReRenders += 1;
      // Start over from the beginning of the list
      currentHook = null;
      workInProgressHook = null;
      workInProgress.updateQueue = null;

      // ReactCurrentDispatcher.current = __DEV__
      //   ? HooksDispatcherOnRerenderInDEV
      //   : HooksDispatcherOnRerender;

      children = Component(props, secondArg);
    } while (didScheduleRenderPhaseUpdateDuringThisPass);
  }

  // We can assume the previous dispatcher is always this one, since we set it
  // at the beginning of the render phase and there's no re-entrancy.
  // ReactCurrentDispatcher.current = ContextOnlyDispatcher;



  // This check uses currentHook so that it works the same in DEV and prod bundles.
  // hookTypesDev could catch more cases (e.g. context) but only in DEV bundles.
  const didRenderTooFewHooks =
    currentHook !== null && currentHook.next !== null;

  renderLanes = NoLanes;
  currentlyRenderingFiber =  null;

  currentHook = null;
  workInProgressHook = null;


  didScheduleRenderPhaseUpdate = false;


  return children;
}
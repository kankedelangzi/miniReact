

export let REACT_ELEMENT_TYPE = 0xeac7;

export type ReactText = string | number;
export const HostComponent = 5;
export type ReactNode = IReactElement|ReactText
export type ReactEmpty = null | void | boolean;
export type ReactNodeList = ReactEmpty | ReactNode;
export const HostRoot = 3;
export type RootTag = 0 | 1 | 2;
export const LegacyRoot = 0;
export const BlockingRoot = 1;
export const ConcurrentRoot = 2;
export type WorkTag =| 0| 1| 2| 3| 4| 5| 6| 7 | 8| 9| 10| 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24;


  export type ReactPriorityLevel = 99 | 98 | 97 | 96 | 95 | 90|-1;

export type TypeOfMode = number;

export const NoMode = /*            */ 0b000000;
// TODO: Remove BlockingMode and ConcurrentMode by reading from the root tag instead
export const BlockingMode = /*      */ 0b000001;
export const ConcurrentMode = /*    */ 0b000010;
export const ProfileMode = /*       */ 0b000100;
export const DebugTracingMode = /*  */ 0b001000;
export const StrictLegacyMode = /*  */ 0b010000;
export const StrictEffectsMode = /* */ 0b100000;


export type Lanes = number;
export type Lane = number;
export type LaneMap<T> = Array<T>;







export type IReactElement = {
 
  $$typeof: number,
  type: string|null,
  key: string |null,
  ref: string|null,
  props: {[key: string]: any},
  _owner: string,
};

export type RootType = {
  render(children: ReactNodeList): void,
  unmount(): void,
  _internalRoot: FiberRoot,
};

export interface Container extends Element {
  _reactRootContainer: RootType
  [key: string]: any
}


export type Cache = Map<() => any, any>;

export interface Fiber {
  // // These first fields are conceptually members of an Instance. This used to
  // // be split into a separate type and intersected with the other Fiber fields,
  // // but until Flow fixes its intersection bugs, we've merged them into a
  // // single type.

  // // An Instance is shared between all versions of a component. We can easily
  // // break this out into a separate object to avoid copying so much to the
  // // alternate versions of the tree. We put this on a single object for now to
  // // minimize the number of objects created during the initial render.

  // // Tag identifying the type of fiber.
  tag: WorkTag,

  // // Unique identifier of this child.
  // key: null | string,

  // // The value of element.type which is used to preserve the identity during
  // // reconciliation of this child.
  // elementType: any,

  // // The resolved function/class/ associated with this fiber.
  // type: any,

  // // The local state associated with this fiber.
  stateNode: any,

  // // Conceptual aliases
  // // parent : Instance -> return The parent happens to be the same as the
  // // return fiber since we've merged the fiber and instance.

  // // Remaining fields belong to Fiber

  // // The Fiber to return to after finishing processing this one.
  // // This is effectively the parent, but there can be multiple parents (two)
  // // so this is only the parent of the thing we're currently processing.
  // // It is conceptually the same as the return address of a stack frame.
  return: Fiber | null,

  // // Singly Linked List Tree Structure.
  child: Fiber | null,
  sibling: Fiber | null,
  index: number,

  // // The ref last used to attach this node.
  // // I'll avoid adding an owner field for prod and model that as functions.
  // ref:
  //   | null
  //   | (((handle: mixed) => void) & {_stringRef: ?string, ...})
  //   | RefObject,

  // // Input is the data coming into process this fiber. Arguments. Props.
  // pendingProps: any, // This type will be more specific once we overload the tag.
  // memoizedProps: any, // The props used to create the output.

  // // A queue of state updates and callbacks.
  updateQueue: mixed,

  // // The state used to create the output
  memoizedState: any,

  // // Dependencies (contexts, events) for this fiber, if it has any
  // dependencies: Dependencies | null,

  // // Bitfield that describes properties about the fiber and its subtree. E.g.
  // // the ConcurrentMode flag indicates whether the subtree should be async-by-
  // // default. When a fiber is created, it inherits the mode of its
  // // parent. Additional flags can be set at creation time, but after that the
  // // value should remain unchanged throughout the fiber's lifetime, particularly
  // // before its child fibers are created.
  mode: TypeOfMode,

  // // Effect
  // flags: Flags,
  // subtreeFlags: Flags,
  // deletions: Array<Fiber> | null,

  // // Singly linked list fast path to the next fiber with side-effects.
  // nextEffect: Fiber | null,

  // // The first and last fiber with side-effect within this subtree. This allows
  // // us to reuse a slice of the linked list when we reuse the work done within
  // // this fiber.
  // firstEffect: Fiber | null,
  // lastEffect: Fiber | null,

  // lanes: Lanes,
  // childLanes: Lanes,

  // // This is a pooled version of a Fiber. Every fiber that gets updated will
  // // eventually have a pair. There are cases when we can clean up pairs to save
  // // memory if we need to.
  // alternate: Fiber | null,

  // // Time spent rendering this Fiber and its descendants for the current update.
  // // This tells us how well the tree makes use of sCU for memoization.
  // // It is reset to 0 each time we render and only updated when we don't bailout.
  // // This field is only set when the enableProfilerTimer flag is enabled.
  // actualDuration?: number,

  // // If the Fiber is currently active in the "render" phase,
  // // This marks the time at which the work began.
  // // This field is only set when the enableProfilerTimer flag is enabled.
  // actualStartTime?: number,

  // // Duration of the most recent render time for this Fiber.
  // // This value is not updated when we bailout for memoization purposes.
  // // This field is only set when the enableProfilerTimer flag is enabled.
  // selfBaseDuration?: number,

  // // Sum of base times for all descendants of this Fiber.
  // // This value bubbles up during the "complete" phase.
  // // This field is only set when the enableProfilerTimer flag is enabled.
  // treeBaseDuration?: number,

  // // Conceptual aliases
  // // workInProgress : Fiber ->  alternate The alternate used for reuse happens
  // // to be the same as work in progress.
  // // __DEV__ only
  // _debugID?: number,
  // _debugSource?: Source | null,
  // _debugOwner?: Fiber | null,
  // _debugIsCurrentlyTiming?: boolean,
  // _debugNeedsRemount?: boolean,

  // // Used to verify that the order of hooks does not change between renders.
  // _debugHookTypes?: Array<HookType> | null,
};
export interface BaseFiberRootProperties {
  // // The type of root (legacy, batched, concurrent, etc.)
  tag: RootTag,

  // // Any additional information from the host associated with this root.
  containerInfo: any,
  // // Used only by persistent updates.
  // pendingChildren: any,
  // // The currently active root fiber. This is the mutable root of the tree.
  current: Fiber|null,

  // pingCache: WeakMap<Wakeable, Set<mixed>> | Map<Wakeable, Set<mixed>> | null,

  // // A finished work-in-progress HostRoot that's ready to be committed.
  // finishedWork: Fiber | null,
  // // Timeout handle returned by setTimeout. Used to cancel a pending timeout, if
  // // it's superseded by a new one.
  // timeoutHandle: TimeoutHandle | NoTimeout,
  // // Top context object, used by renderSubtreeIntoContainer
  context: Object | null,
  pendingContext: Object | null,
  // // Determines if we should attempt to hydrate on the initial mount
  hydrate: boolean,

  // // Used by useMutableSource hook to avoid tearing during hydration.
  // mutableSourceEagerHydrationData?: Array<
  //   MutableSource<any> | MutableSourceVersion,
  // > | null,

  // // Node returned by Scheduler.scheduleCallback. Represents the next rendering
  // // task that the root will work on.
  // callbackNode: *,
  // callbackPriority: LanePriority,
  // eventTimes: LaneMap<number>,
  // expirationTimes: LaneMap<number>,

  // pendingLanes: Lanes,
  // suspendedLanes: Lanes,
  // pingedLanes: Lanes,
  // expiredLanes: Lanes,
  // mutableReadLanes: Lanes,

  // finishedLanes: Lanes,

  // entangledLanes: Lanes,
  // entanglements: LaneMap<Lanes>,

  pooledCache: Cache | null,
  // pooledCacheLanes: Lanes,
};

export interface FiberRoot extends BaseFiberRootProperties {
  
};

export type RootOptions = {
  hydrate?: boolean,
  hydrationOptions?: {
    onHydrated?: (suspenseNode: Comment) => void,
    onDeleted?: (suspenseNode: Comment) => void,
    mutableSources?: any,
  },
  unstable_strictModeLevel?: number,
};
type mixed = any


export type Update<State> = {
  // TODO: Temporary field. Will remove this by storing a map of
  // transition -> event time on the root.
  eventTime: number,
  lane: Lane,

  tag: 0 | 1 | 2 | 3,
  payload: any,
  callback: (() => mixed) | null,

  next: Update<State> | null,
};
export type SharedQueue<State> = {
  pending: Update<State> | null,
  interleaved: Update<State> | null,
  lanes: Lanes,
};

export type UpdateQueue<State> = {
  baseState: State,
  firstBaseUpdate: Update<State> | null,
  lastBaseUpdate: Update<State> | null,
  shared: SharedQueue<State>,
  effects: Array<Update<State>> | null,
};
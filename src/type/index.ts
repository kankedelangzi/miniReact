

export let REACT_ELEMENT_TYPE = 0xeac7;
export let REACT_PORTAL_TYPE = 0xeaca;
export let REACT_FRAGMENT_TYPE = 0xeacb;
export let REACT_STRICT_MODE_TYPE = 0xeacc;
export let REACT_PROFILER_TYPE = 0xead2;
export let REACT_PROVIDER_TYPE = 0xeacd;
export let REACT_CONTEXT_TYPE = 0xeace;
export let REACT_FORWARD_REF_TYPE = 0xead0;
export let REACT_SUSPENSE_TYPE = 0xead1;
export let REACT_SUSPENSE_LIST_TYPE = 0xead8;
export let REACT_MEMO_TYPE = 0xead3;
export let REACT_LAZY_TYPE = 0xead4;
export let REACT_SCOPE_TYPE = 0xead7;
export let REACT_OPAQUE_ID_TYPE = 0xeae0;
export let REACT_DEBUG_TRACING_MODE_TYPE = 0xeae1;
export let REACT_OFFSCREEN_TYPE = 0xeae2;
export let REACT_LEGACY_HIDDEN_TYPE = 0xeae3;
export let REACT_CACHE_TYPE = 0xeae4;

export type ReactText = string | number;
export const HostComponent = 5;
export const FunctionComponent = 0;
export type ReactNode = IReactElement|ReactText
export const IndeterminateComponent = 2; // Before we know whether it is function or class
export type ReactEmpty = null | void | boolean;
export type ReactNodeList = ReactEmpty | ReactNode;
export const HostRoot = 3;
export const HostText = 6;
export const HostPortal = 4; 
export const Fragment = 7;
export const Mode = 8;
export const ContextConsumer = 9;
export const ContextProvider = 10;
export const ForwardRef = 11;
export const Profiler = 12;
export const SuspenseComponent = 13;
export const MemoComponent = 14;
export const SimpleMemoComponent = 15;
export const LazyComponent = 16;
export const IncompleteClassComponent = 17;
export const DehydratedFragment = 18;
export const SuspenseListComponent = 19;
export const ScopeComponent = 21;
export const OffscreenComponent = 22;
export const LegacyHiddenComponent = 23;
export const CacheComponent = 24;



export type RootTag = 0 | 1 | 2;
export const LegacyRoot = 0;
export const BlockingRoot = 1;
export const ClassComponent = 1;
export const ConcurrentRoot = 2;
export type ExecutionContext = number;
export type LanePriority =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17;
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

export type RootExitStatus = 0 | 1 | 2 | 3 | 4 | 5;

export const RootIncomplete = 0;
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

// Don't change these two values. They're used by React Dev Tools.
export const NoFlags = /*                      */ 0b00000000000000000000;
export const PerformedWork = /*                */ 0b00000000000000000001;

// You can change the rest (and add more).
export const Placement = /*                    */ 0b00000000000000000010;
export const Update = /*                       */ 0b00000000000000000100;
export const PlacementAndUpdate = /*           */ Placement | Update;
export const Deletion = /*                     */ 0b00000000000000001000;
export const ChildDeletion = /*                */ 0b00000000000000010000;
export const ContentReset = /*                 */ 0b00000000000000100000;
export const Callback = /*                     */ 0b00000000000001000000;
export const DidCapture = /*                   */ 0b00000000000010000000;
export const Ref = /*                          */ 0b00000000000100000000;
export const Snapshot = /*                     */ 0b00000000001000000000;
export const Passive = /*                      */ 0b00000000010000000000;
export const Hydrating = /*                    */ 0b00000000100000000000;
export const HydratingAndUpdate = /*           */ Hydrating | Update;
export const Visibility = /*                   */ 0b00000001000000000000;

// Union of all commit flags (flags with the lifetime of a particular commit)
export const HostEffectMask = /*               */ 0b00000001111111111111;

// These are not really side effects, but we still reuse this field.
export const Incomplete = /*                   */ 0b00000010000000000000;
export const ShouldCapture = /*                */ 0b00000100000000000000;
// TODO (effects) Remove this bit once the new reconciler is synced to the old.
export const PassiveUnmountPendingDev = /*     */ 0b00001000000000000000;
export const ForceUpdateForLegacySuspense = /* */ 0b00010000000000000000;
export const PassiveStatic = /*                */ 0b00100000000000000000;
export const enableCreateEventHandleAPI = false;
export const StaticMask = PassiveStatic;

export const BeforeMutationMask =
  // TODO: Remove Update flag from before mutation phase by re-landing Visiblity
  // flag logic (see #20043)
  Update |
  Snapshot |
  (enableCreateEventHandleAPI
    ? // createEventHandle needs to visit deleted and hidden trees to
      // fire beforeblur
      // TODO: Only need to visit Deletions during BeforeMutation phase if an
      // element is focused.
      ChildDeletion | Visibility
    : 0);

export const MutationMask =
  Placement |
  Update |
  ChildDeletion |
  ContentReset |
  Ref |
  Hydrating |
  Visibility;

export type Lanes = number;
export type Lane = number;
export type LaneMap<T> = Array<T>;

export type HydratableInstance = Instance | TextInstance | SuspenseInstance;


export type Flags = number

export type ReactProviderType<T> = {
  $$typeof: Symbol | number,
  _context: ReactContext<T>,
};

export type ReactContext<T> = {
  $$typeof: Symbol | number,
  Consumer: ReactContext<T>,
  Provider: ReactProviderType<T>,
  _calculateChangedBits: ((a: T, b: T) => number) | null,
  _currentValue: T,
  _currentValue2: T,
  _threadCount: number,
  // DEV only
  _currentRenderer?: Object | null,
  _currentRenderer2?: Object | null,
  // This value may be added by application code
  // to improve DEV tooling display names
  displayName?: string,

};

export type ContextDependency<T> = {
  context: ReactContext<T>,
  observedBits: number,
  next: ContextDependency<mixed> | null,

};

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

export type Instance = Element;
export type Cache = Map<() => any, any>;
export type Dependencies = {
  lanes: Lanes,
  firstContext: ContextDependency<mixed> | null,
};

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
  key: null | string,

  // // The value of element.type which is used to preserve the identity during
  // // reconciliation of this child.
  elementType: any,

  // // The resolved function/class/ associated with this fiber.
  type: any,

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
  pendingProps: any, // This type will be more specific once we overload the tag.
  memoizedProps: any, // The props used to create the output.

  // // A queue of state updates and callbacks.
  updateQueue: mixed,

  // // The state used to create the output
  memoizedState: any,

  // Dependencies (contexts, events) for this fiber, if it has any
  dependencies: Dependencies | null,

  // // Bitfield that describes properties about the fiber and its subtree. E.g.
  // // the ConcurrentMode flag indicates whether the subtree should be async-by-
  // // default. When a fiber is created, it inherits the mode of its
  // // parent. Additional flags can be set at creation time, but after that the
  // // value should remain unchanged throughout the fiber's lifetime, particularly
  // // before its child fibers are created.
  mode: TypeOfMode,

  // // Effect
  flags: Flags,
  subtreeFlags: Flags,
  deletions: Array<Fiber> | null, // 要删除的child列表

  // // Singly linked list fast path to the next fiber with side-effects.
  // nextEffect: Fiber | null,

  // // The first and last fiber with side-effect within this subtree. This allows
  // // us to reuse a slice of the linked list when we reuse the work done within
  // // this fiber.
  // firstEffect: Fiber | null,
  // lastEffect: Fiber | null,

  lanes: Lanes,
  childLanes: Lanes,

  // // This is a pooled version of a Fiber. Every fiber that gets updated will
  // // eventually have a pair. There are cases when we can clean up pairs to save
  // // memory if we need to.
  alternate: Fiber | null,

  // // Time spent rendering this Fiber and its descendants for the current update.
  // // This tells us how well the tree makes use of sCU for memoization.
  // // It is reset to 0 each time we render and only updated when we don't bailout.
  // // This field is only set when the enableProfilerTimer flag is enabled.
  actualDuration?: number,

  // // If the Fiber is currently active in the "render" phase,
  // // This marks the time at which the work began.
  // // This field is only set when the enableProfilerTimer flag is enabled.
  actualStartTime?: number,

  // // Duration of the most recent render time for this Fiber.
  // // This value is not updated when we bailout for memoization purposes.
  // // This field is only set when the enableProfilerTimer flag is enabled.
  selfBaseDuration?: number,

  // // Sum of base times for all descendants of this Fiber.
  // // This value bubbles up during the "complete" phase.
  // // This field is only set when the enableProfilerTimer flag is enabled.
  treeBaseDuration?: number,

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

export type TimeoutHandle = mixed; // eslint-disable-line no-undef
export type NoTimeout = mixed; // eslint-disable-line no-undef
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
  finishedWork: Fiber | null,
  // // Timeout handle returned by setTimeout. Used to cancel a pending timeout, if
  // // it's superseded by a new one.
  timeoutHandle: TimeoutHandle | NoTimeout,
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
  callbackNode: any,
  callbackPriority: LanePriority,
  eventTimes: LaneMap<number>,
  expirationTimes: LaneMap<number>,

  pendingLanes: Lanes,
  suspendedLanes: Lanes,
  // 包含了当前fiber树中所有待处理的update的lane。
  pingedLanes: Lanes,
  expiredLanes: Lanes,
  mutableReadLanes: Lanes,

  finishedLanes: Lanes,

  entangledLanes: Lanes,
  entanglements: LaneMap<Lanes>,

  pooledCache: Cache | null,
  // pooledCacheLanes: Lanes,
};

export interface FiberRoot extends BaseFiberRootProperties {
  interactionThreadID: number,
  memoizedInteractions: Set<Interaction>,
  pendingInteractionMap: Map<Lane | Lanes, Set<Interaction>>,
};


export type Interaction = {
  __count: number,
  id: number,
  name: string,
  timestamp: number,
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
// flow中的mixed相当于any @see https://flow.org/en/docs/types/mixed/
export type mixed = any


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


export type Props = {
  autoFocus?: boolean,
  children?: mixed,
  disabled?: boolean,
  hidden?: boolean,
  suppressHydrationWarning?: boolean,
  dangerouslySetInnerHTML?: mixed,
  style?: {display?: string, [key: string]: any},
  bottom?: null | number,
  left?: null | number,
  right?: null | number,
  top?: null | number,
  [key: string]: any
};




export const ELEMENT_NODE = 1;
export const TEXT_NODE = 3;
export const COMMENT_NODE = 8;
export const DOCUMENT_NODE = 9;
export const DOCUMENT_FRAGMENT_NODE = 11;
export type TextInstance = Text;
export type SuspenseInstance = Comment

export type ReactScopeInstance = any

export type HostContext = string

export type PropertyType = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const RESERVED = 0;

export type PropertyInfo = {
  acceptsBooleans: boolean,
  attributeName: string,
  attributeNamespace: string | null,
  mustUseProperty: boolean,
  propertyName: string,
  type: PropertyType,
  sanitizeURL: boolean,
  removeEmptyString: boolean,
};


export type StackCursor<T> = {current: T};

export type BasicStateAction<S> = ((s: S) => S) | S;

export type Dispatch<A> = (a: A) => void;
export type Dispatcher = {
  // getCacheForType?: <T>(resourceType: () => T) => T,
  // readContext<T>(
  //   context: ReactContext<T>,
  //   observedBits: void | number | boolean,
  // ): T,
  useState<S>(initialState: (() => S) | S): [S, Dispatch<BasicStateAction<S>>],
  // useReducer<S, I, A>(
  //   reducer: (S, A) => S,
  //   initialArg: I,
  //   init?: (I) => S,
  // ): [S, Dispatch<A>],
  // useContext<T>(
  //   context: ReactContext<T>,
  //   observedBits: void | number | boolean,
  // ): T,
  // useRef<T>(initialValue: T): {current: T},
  // useEffect(
  //   create: () => (() => void) | void,
  //   deps: Array<mixed> | void | null,
  // ): void,
  // useLayoutEffect(
  //   create: () => (() => void) | void,
  //   deps: Array<mixed> | void | null,
  // ): void,
  // useCallback<T>(callback: T, deps: Array<mixed> | void | null): T,
  // useMemo<T>(nextCreate: () => T, deps: Array<mixed> | void | null): T,
  // useImperativeHandle<T>(
  //   ref: {current: T | null} | ((inst: T | null) => mixed) | null | void,
  //   create: () => T,
  //   deps: Array<mixed> | void | null,
  // ): void,
  // useDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void,
  // useDeferredValue<T>(value: T): T,
  // useTransition(): [(() => void) => void, boolean],
  // useMutableSource<Source, Snapshot>(
  //   source: MutableSource<Source>,
  //   getSnapshot: MutableSourceGetSnapshotFn<Source, Snapshot>,
  //   subscribe: MutableSourceSubscribeFn<Source, Snapshot>,
  // ): Snapshot,
  // useOpaqueIdentifier(): any,
  // useCacheRefresh?: () => <T>(?() => T, ?T) => void,

  // unstable_isNewReconciler?: boolean,
};



export type SchedulerCallback = (isSync: boolean) => SchedulerCallback | null;
export type SchedulerCallbackOptions = {timeout?: number};



export const LayoutMask = Update | Callback | Ref;

export const PassiveMask = Passive | ChildDeletion;

export type UpdatePayload = Array<mixed>;
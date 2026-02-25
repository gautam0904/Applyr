# RULE.md — Angular 21 Project Standards

> **This document is MANDATORY for all contributors and reviewers.** Any code that violates the rules defined herein MUST be rejected during pull request review. Language: MUST, MUST NOT, REQUIRED, FORBIDDEN, SHALL, SHALL NOT.

---

## Table of Contents

1. [Project Architecture Rules](#1-project-architecture-rules)
2. [Naming Conventions](#2-naming-conventions)
3. [Logic Implementation Rules](#3-logic-implementation-rules)
4. [Component Rules](#4-component-rules)
5. [State Management Rules](#5-state-management-rules)
6. [Routing Rules](#6-routing-rules)
7. [Forms Rules](#7-forms-rules)
8. [Testing Rules](#8-testing-rules)
9. [CI / Pipeline Safety Rules](#9-ci--pipeline-safety-rules)
10. [Performance and Clean Code Rules](#10-performance-and-clean-code-rules)
11. [Reviewer Checklist](#11-reviewer-checklist)

---

## 1. PROJECT ARCHITECTURE RULES

### 1.1 Technology Stack

| Layer             | Technology                                                          |
| ----------------- | ------------------------------------------------------------------- |
| Framework         | Angular 21 (standalone components, signals-first)                   |
| Language          | TypeScript 5.x (strict mode)                                        |
| Package Manager   | pnpm (MUST NOT use npm or yarn)                                     |
| Styling           | Tailwind CSS v4 + `@apply` for reusable component styles            |
| UI Primitives     | Angular CDK                                                         |
| State Management  | Angular Signals + NgRx SignalStore (feature stores)                  |
| Server State      | TanStack Angular Query v5 (`@tanstack/angular-query-experimental`)  |
| Routing           | Angular Router v21 (lazy-loaded standalone routes)                  |
| Forms             | Angular Reactive Forms + Zod (via custom bridge validators)         |
| HTTP Client       | Angular `HttpClient` via a typed `ApiService`                       |
| Testing           | Vitest + Angular Testing Library + MSW v2                           |
| Build             | Angular CLI (esbuild) / `ng build`                                  |
| Linting           | ESLint + `@angular-eslint` + `eslint-plugin-import`                 |
| Formatting        | Prettier (single quotes, 100 char width, 2-space tabs)              |

### 1.2 Folder Structure

The project follows a **feature-based (vertical slice) architecture**. The canonical source layout:

```
src/
  app/
    app.component.ts          # Root component (standalone)
    app.config.ts             # provideRouter, provideHttpClient, provideAnimations, etc.
    app.routes.ts             # Top-level lazy-loaded route definitions
    core/                     # Singleton services, guards, interceptors (loaded once)
      guards/                 # Route guards
      interceptors/           # HTTP interceptors
      services/               # App-wide singleton services (auth, logger, etc.)
    layout/                   # Shell/layout components (header, sidebar, nav)
  features/                   # Feature modules (self-contained vertical slices)
    <feature-name>/
      api/                    # TanStack Query hooks / Angular Query injectables
        <resource>.query.ts   # injectQuery / injectMutation wrappers
      components/             # Feature-specific presentational components
        <ComponentName>/
          <ComponentName>.component.ts
          <ComponentName>.component.html
          <ComponentName>.component.scss   # (only if not using Tailwind inline)
      pages/                  # Routed page components (smart, container-level)
        <FeatureName>Page/
          <FeatureName>Page.component.ts
          <FeatureName>Page.component.html
      store/                  # NgRx SignalStore feature stores
        <feature>.store.ts
      types/                  # Feature-specific TypeScript types
        <feature>.type.ts
      utils/                  # Feature-specific utility functions
        <utility>.util.ts
      constants.ts            # Feature-specific constants
      <feature>.routes.ts     # Lazy-loaded child routes
      __tests__/              # Co-located feature tests
        <ComponentName>.spec.ts
  shared/                     # Shared, reusable layers (NEVER import from features/app)
    components/               # Shared UI components (not feature-specific)
      ui/                     # Low-level primitive components (button, dialog, badge, etc.)
      composite/              # Shared composite components (data-table, page-header, etc.)
    directives/               # Shared directives
    pipes/                    # Shared pipes
    guards/                   # Shared route guards (reusable across features)
    services/                 # Shared injectable services
    validators/               # Shared Zod schemas / Angular validator functions
    models/                   # Shared TypeScript interfaces / types
    utils/                    # Shared utility functions
    constants/                # Shared enums and constants
    tokens/                   # Angular InjectionTokens
  environments/               # environment.ts, environment.prod.ts
  assets/                     # Static assets
tests/                        # Test infrastructure (root-level)
  mocks/
    handlers/                 # MSW request handlers
    data/                     # Static mock data fixtures
    db/                       # Stateful mock database
  test-utils.ts               # Custom render helpers, provider setup
  setup.ts                    # Global Vitest setup (MSW server start, etc.)
```

### 1.3 Import Boundary Rules (ESLint-Enforced)

These rules MUST be enforced via `eslint-plugin-import` with `import/no-restricted-paths`. Violations WILL fail lint.

**Dependency flow (strictly top-to-bottom, NEVER upward):**

```
app (core, layout, routes)
 └──> features
       └──> shared (components, directives, pipes, services, utils, constants, models, tokens)
```

| Rule | Enforcement |
|------|-------------|
| Features MUST NOT import from other features | ESLint error |
| Features MUST NOT import from `app/core` or `app/layout` | ESLint error |
| Shared layers MUST NOT import from `features` | ESLint error |
| Shared layers MUST NOT import from `app` | ESLint error |
| `app/core` MAY import from `shared` | Allowed |
| Cross-feature composition MUST happen via routes or `app/layout` | Architectural rule |

**GOOD:**

```typescript
// app/app.routes.ts — app imports feature routes
{ path: 'members', loadChildren: () => import('@features/members/members.routes') }

// features/members/pages/MembersPage.component.ts — feature imports shared
import { DataTableComponent } from '@shared/components/composite/data-table';
import { MembersStore } from '../store/members.store';
```

**BAD:**

```typescript
// FORBIDDEN: feature importing another feature
import { TasksStore } from '@features/tasks/store/tasks.store';

// FORBIDDEN: shared importing feature
import { MembersStore } from '@features/members/store/members.store';

// FORBIDDEN: shared importing app
import { AppComponent } from '@app/app.component';
```

### 1.4 Path Aliases

All imports outside the current directory MUST use `@`-prefixed path aliases configured in `tsconfig.json`.

| Alias          | Target               |
|----------------|----------------------|
| `@app/*`       | `src/app/*`          |
| `@features/*`  | `src/features/*`     |
| `@shared/*`    | `src/shared/*`       |
| `@core/*`      | `src/app/core/*`     |
| `@env/*`       | `src/environments/*` |
| `@tests/*`     | `tests/*`            |

**Rules:**
- Relative imports (`./`, `../`) MUST only be used within the same feature folder or same directory level.
- Cross-module imports MUST use path aliases.
- Deep relative imports (`../../..`) are FORBIDDEN.

**GOOD:**
```typescript
import { ApiService } from '@core/services/api.service';
import { ButtonComponent } from '@shared/components/ui/button';
import { formatDate } from './utils/date.util'; // same feature
```

**BAD:**
```typescript
import { ApiService } from '../../../core/services/api.service'; // FORBIDDEN: deep relative
```

### 1.5 Standalone Components Policy

- ALL components, directives, and pipes MUST be `standalone: true`.
- `NgModule`-based architecture is FORBIDDEN for new code.
- Importing a module (e.g., `CommonModule`) is FORBIDDEN when individual standalone imports suffice.
- Use Angular 17+ control flow blocks (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`.

### 1.6 New Feature Module Structure Template

```
src/features/<feature-name>/
  api/
    <resource>.query.ts
  components/
    <ComponentName>/
      <ComponentName>.component.ts
      <ComponentName>.component.html
  pages/
    <FeatureName>Page/
      <FeatureName>Page.component.ts
      <FeatureName>Page.component.html
  store/
    <feature>.store.ts
  types/
    <feature>.type.ts
  utils/
    <utility>.util.ts
  constants.ts
  <feature>.routes.ts
  __tests__/
    <ComponentName>.spec.ts
```

- A feature folder MUST NOT exceed 4 levels of nesting.
- Sub-features MUST be flat — no recursive feature nesting.

---

## 2. NAMING CONVENTIONS

### 2.1 File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Component class + template | PascalCase folder + `.component.ts/.html` | `MemberCard/MemberCard.component.ts` |
| Page component | PascalCase suffixed with `Page` | `MembersPage.component.ts` |
| Service | kebab-case with `.service.ts` suffix | `auth.service.ts`, `api.service.ts` |
| Guard | kebab-case with `.guard.ts` suffix | `auth.guard.ts` |
| Interceptor | kebab-case with `.interceptor.ts` suffix | `jwt.interceptor.ts` |
| Store | kebab-case with `.store.ts` suffix | `members.store.ts` |
| Query file | kebab-case with `.query.ts` suffix | `members.query.ts` |
| Type definition | kebab-case with `.type.ts` suffix | `member.type.ts` |
| Utility | kebab-case with `.util.ts` suffix | `date.util.ts`, `address.util.ts` |
| Constants | kebab-case with `.constant.ts` | `member.constant.ts` |
| Directive | kebab-case with `.directive.ts` suffix | `click-outside.directive.ts` |
| Pipe | kebab-case with `.pipe.ts` suffix | `format-date.pipe.ts` |
| Validator | kebab-case with `.validator.ts` suffix | `email.validator.ts` |
| Test file | Same as source with `.spec.ts` suffix | `MembersPage.component.spec.ts` |
| Route file | kebab-case with `.routes.ts` suffix | `members.routes.ts` |

### 2.2 Variable and Function Naming

| Type | Convention | Example |
|------|-----------|---------|
| Boolean variables / signals | `is`, `has`, `should`, `can`, `will` prefix | `isLoading`, `hasError`, `canEdit` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| Enums | PascalCase name, UPPER_SNAKE_CASE members | `MemberStatus.ACTIVE` |
| Functions | camelCase, descriptive verb | `formatDate()`, `calculateTotal()` |
| Async functions | camelCase, descriptive verb | `fetchMembers()`, `submitForm()` |
| Signal (readable) | camelCase noun | `members`, `selectedMember` |
| Signal (computed) | camelCase noun describing the derived value | `filteredMembers`, `totalCount` |
| Type / Interface | PascalCase, intent-suffixed | `MemberResponse`, `CreateMemberPayload` |
| Injection token | UPPER_SNAKE_CASE | `AUTH_TOKEN`, `API_CONFIG` |

**GOOD:**
```typescript
const isAuthenticated = signal(false);
const hasPermission = computed(() => currentUser()?.role === 'admin');
const MAX_PAGE_SIZE = 50;

enum MemberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
```

**BAD:**
```typescript
const authenticated = signal(false);  // FORBIDDEN: missing boolean prefix
const loading = false;                // FORBIDDEN: missing boolean prefix
const maxPageSize = 50;               // FORBIDDEN: must be UPPER_SNAKE_CASE
```

### 2.3 Angular-Specific Naming

| Type | Convention | Example |
|------|-----------|---------|
| Component class | PascalCase + `Component` suffix | `MemberCardComponent` |
| Page class | PascalCase + `PageComponent` suffix | `MembersPageComponent` |
| Service class | PascalCase + `Service` suffix | `AuthService`, `MembersApiService` |
| Store class | PascalCase + `Store` suffix | `MembersStore` |
| Guard function | camelCase + `Guard` suffix (functional) | `authGuard` |
| Interceptor function | camelCase + `Interceptor` suffix | `jwtInterceptor` |
| Directive class | PascalCase + `Directive` suffix | `ClickOutsideDirective` |
| Pipe class | PascalCase + `Pipe` suffix | `FormatDatePipe` |
| Selector | `app-` for root shell, `feat-` for features | `app-header`, `feat-member-card` |
| Output property | camelCase noun (no `on` prefix in class) | `selected = output<Member>()` |
| Input property | camelCase noun | `member = input.required<Member>()` |

**GOOD:**
```typescript
@Component({
  selector: 'feat-member-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberCardComponent {
  member = input.required<Member>();
  selected = output<string>();

  protected handleClick(): void {
    this.selected.emit(this.member().id);
  }
}
```

**BAD:**
```typescript
@Component({ selector: 'memberCard' })  // FORBIDDEN: no kebab-case
export class memberCard {               // FORBIDDEN: missing Component suffix, lowercase
  @Input() m: any;                      // FORBIDDEN: any, cryptic name, old @Input()
  @Output() click = new EventEmitter(); // FORBIDDEN: conflicts with DOM events
}
```

### 2.4 Git Conventions

**Branch Naming:**
```
<type>/<ticket-id>-<short-description>

Examples:
  feat/APP-1234-add-member-export
  fix/APP-5678-fix-auth-redirect
  chore/APP-9012-update-angular
  refactor/APP-3456-extract-table-component
```

Allowed types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `ci`, `perf`.

**Commit Messages (Conventional Commits):**
```
<type>(<scope>): <short description>

Examples:
  feat(members): add csv export functionality
  fix(auth): resolve token refresh race condition
  test(members): add integration tests for member list
  refactor(shared): extract pagination into shared component
  chore(deps): upgrade to angular 21
```

- Subject line MUST be lowercase after the colon.
- Subject line MUST NOT exceed 72 characters.
- Breaking changes MUST include `BREAKING CHANGE:` in the footer.

---

## 3. LOGIC IMPLEMENTATION RULES

### 3.1 Business Logic Separation

- Business logic MUST NOT live inside component classes or templates.
- Components are ONLY responsible for rendering, input/output binding, and delegating interactions.
- Data transformation and computation MUST live in:
  - Feature-specific `utils/` for stateless transformations
  - Shared `src/shared/utils/` for cross-feature logic
  - NgRx SignalStore methods for stateful feature logic
  - TanStack Angular Query files for server state logic

**GOOD:**
```typescript
// features/members/utils/format-member.util.ts
export function formatMemberForDisplay(member: Member): DisplayMember {
  return {
    fullName: `${member.firstName} ${member.lastName}`,
    statusLabel: STATUS_LABELS[member.status],
  };
}

// features/members/components/MemberCard/MemberCard.component.ts
export class MemberCardComponent {
  member = input.required<Member>();
  protected displayMember = computed(() => formatMemberForDisplay(this.member()));
}
```

**BAD:**
```typescript
// FORBIDDEN: business logic inline in component
export class MemberCardComponent {
  member = input.required<Member>();
  protected status = computed(() =>
    this.member().status === 'active' ? 'Active'
    : this.member().status === 'inactive' ? 'Inactive'
    : 'Unknown'
  );
}
```

### 3.2 Pure Functions

- Utility functions MUST be pure (no side effects, same input = same output).
- Side effects (HTTP calls, storage, analytics) MUST be isolated in:
  - `@core/services/` or `@shared/services/`
  - TanStack Angular Query files (`features/<n>/api/`)

### 3.3 API Layer Structure

All API communication MUST follow this pattern:

1. HTTP calls go through `@core/services/api.service.ts` (typed `get<T>`, `post<T,R>`, `put<T,R>`, `delete<T>` helpers).
2. Feature-specific TanStack Query injectables wrap service calls in `features/<n>/api/<resource>.query.ts`.
3. Components consume data exclusively via TanStack Query injectables (`injectQuery`, `injectMutation`).

- Direct `HttpClient` calls from components are FORBIDDEN.
- Raw `fetch` calls anywhere in the codebase are FORBIDDEN.

**GOOD:**
```typescript
// features/members/api/members.query.ts
export const injectMembersQuery = () => {
  const api = inject(ApiService);

  return injectQuery(() => ({
    queryKey: ['members'],
    queryFn: () => api.get<MemberResponse[]>('/members'),
  }));
};

// features/members/pages/MembersPage/MembersPage.component.ts
export class MembersPageComponent {
  protected membersQuery = injectMembersQuery();
  protected members = this.membersQuery.data;
  protected isLoading = this.membersQuery.isPending;
}
```

**BAD:**
```typescript
// FORBIDDEN: direct HttpClient in component
export class MembersPageComponent {
  private http = inject(HttpClient);

  ngOnInit() {
    this.http.get('/api/members').subscribe((data) => {
      this.members.set(data as Member[]);
    });
  }
}
```

### 3.4 Signals-First State Rule

- Local component state MUST use `signal()` and `computed()` instead of class properties.
- `BehaviorSubject` for local state is FORBIDDEN in new code.
- RxJS MUST only be used for event streams that genuinely require it (e.g., `fromEvent`, multi-source `combineLatest`).
- Converting an Observable to a signal MUST use `toSignal()` from `@angular/core/rxjs-interop`.

### 3.5 TanStack Angular Query Cache Management Rules

**Optimistic Updates vs Invalidation:**
- A mutation MUST use EITHER optimistic cache updates OR `invalidateQueries`, NOT BOTH.
- Using `variables` (client-side mutation input) as a fallback for server response data is FORBIDDEN.

**Cache Key Consistency:**

| Method | Key Matching Behavior |
|--------|-----------------------|
| `invalidateQueries` | Prefix match |
| `getQueryData` | Exact match |
| `setQueryData` | Exact match |
| `cancelQueries` | Prefix match |

**FORBIDDEN Anti-Patterns:**
```typescript
// Bare key with getQueryData — returns undefined for parameterized queries
const prev = queryClient.getQueryData(['members']); // FORBIDDEN

// Both optimistic update AND invalidateQueries for the same key
onMutate: async () => { queryClient.setQueryData(key, newData); },
onSuccess: () => { queryClient.invalidateQueries({ queryKey: key }); } // FORBIDDEN: hybrid
```

**RECOMMENDED Pattern (invalidation-only, simplest):**
```typescript
export const injectUpdateMemberMutation = () => {
  const queryClient = injectQueryClient();
  const api = inject(ApiService);

  return injectMutation(() => ({
    mutationFn: (payload: UpdateMemberPayload) => api.put('/members', payload),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['members'] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  }));
};
```

### 3.6 Mutation Payload Construction Rules

- Mutation hooks MUST define their own payload type — NEVER reuse the full entity type.
- Components MUST construct only the required payload fields, not spread entire entities.

**GOOD:**
```typescript
// types/member.type.ts
export interface UpdateMemberPayload {
  id: string;
  status: MemberStatus | null;
}

// api/members.query.ts
injectMutation(() => ({
  mutationFn: (payload: UpdateMemberPayload) =>
    api.put<UpdateMemberPayload, MemberResponse>('/members', payload),
}));

// component
const handleStatusChange = (newStatus: MemberStatus) => {
  updateMember({ id: member().id, status: newStatus }); // only required fields
};
```

**BAD:**
```typescript
// FORBIDDEN: spreading full entity
updateMember({ ...member(), status: newStatus });

// FORBIDDEN: no payload type
mutationFn: (data: any) => api.put('/members', data);
```

### 3.7 Error Handling

- All async operations MUST have explicit error handling.
- TanStack Query `isError` / `error` states MUST be handled in the template.
- Errors MUST NOT be silently swallowed.
- Use `LoggerService` for logging — `console.log` / `console.error` are FORBIDDEN.

```typescript
// GOOD
protected mutation = injectUpdateMemberMutation();
// In template: @if (mutation.isError()) { <app-error-message /> }

// BAD — no error handling at all
protected mutation = injectMutation(() => ({
  mutationFn: (p: UpdateMemberPayload) => api.put('/members', p),
}));
```

### 3.8 Constant Reuse (DRY)

- A constant defined identically in 2+ files MUST be extracted.
- Shared constants → `@shared/constants/`.
- Feature-specific constants → `features/<n>/constants.ts`.

**Threshold:** If a constant or enum-to-array conversion appears in 2 files → extract immediately. No exceptions.

### 3.9 Function and Component Size Limits

| Metric | Maximum |
|--------|---------|
| Function body | 50 lines (excluding type definitions) |
| Component class body | 100 lines |
| Component template | 150 lines |
| File length | 300 lines (split if exceeded) |

### 3.10 Prohibited Patterns

| Pattern | Rule |
|---------|------|
| Magic numbers / strings | FORBIDDEN. Extract to named constants. |
| `any` type | FORBIDDEN except with `eslint-disable` + justification comment. |
| Non-null assertion (`!`) | FORBIDDEN unless provably safe with a justification comment. |
| `console.log` / `console.error` | FORBIDDEN. Use `LoggerService`. |
| `// @ts-ignore` / `// @ts-expect-error` | FORBIDDEN without a linked ticket. |
| Hardcoded API URLs | FORBIDDEN. Use `environment.ts`. |
| `var` keyword | FORBIDDEN. Use `const` by default, `let` when reassignment needed. |
| `ngOnInit` for signal-based state init | FORBIDDEN. Use `computed()` or `effect()`. |
| Subscribing without unsubscribing | FORBIDDEN. Use `takeUntilDestroyed()` or `toSignal()`. |
| Nested `.subscribe()` calls | FORBIDDEN. Use `switchMap`, `combineLatest`, etc. |
| Complex ternary (>2 branches) in template | FORBIDDEN. Use `@if/@switch` or extract to a function. |
| `NgModule` in new code | FORBIDDEN. All new code MUST be standalone. |
| `CommonModule` import in standalone component | FORBIDDEN. Import individual directives/pipes. |
| `*ngIf` / `*ngFor` / `*ngSwitch` | FORBIDDEN. Use `@if` / `@for` / `@switch` control flow. |

---

## 4. COMPONENT RULES

### 4.1 Component Design Principles

- Every component MUST be `standalone: true`.
- Components MUST follow the **Single Responsibility Principle**.
- **Smart (Container) components** live in `pages/`. They inject stores/queries and pass data down via inputs.
- **Dumb (Presentational) components** live in `components/`. They ONLY accept `input()` and emit `output()`. They MUST NOT inject feature stores or query files.
- Shared components in `@shared/components/` MUST NOT depend on any feature-specific service or store.

### 4.2 Input / Output Rules

- `input()` and `input.required()` MUST be used instead of the `@Input()` decorator.
- `output()` MUST be used instead of `@Output() ... = new EventEmitter()`.
- `model()` MAY be used for two-way binding where appropriate.
- All inputs MUST be explicitly typed. `input<any>()` is FORBIDDEN.

**GOOD:**
```typescript
export class MemberCardComponent {
  member = input.required<Member>();
  isSelected = input<boolean>(false);
  selected = output<string>();

  protected handleSelect(): void {
    this.selected.emit(this.member().id);
  }
}
```

**BAD:**
```typescript
export class MemberCardComponent {
  @Input() member: any;                     // FORBIDDEN: any, old decorator
  @Output() selected = new EventEmitter();  // FORBIDDEN: old decorator, no type
}
```

### 4.3 Change Detection Strategy

- ALL components MUST use `changeDetection: ChangeDetectionStrategy.OnPush`.
- Default change detection is FORBIDDEN for new components.

```typescript
@Component({
  selector: 'feat-member-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`,
})
export class MemberCardComponent { }
```

### 4.4 Template Rules

- Use Angular control flow blocks (`@if`, `@for`, `@switch`) — NEVER `*ngIf`, `*ngFor`, `*ngSwitch`.
- `@for` blocks MUST always include a `track` expression using a unique identifier.
- Inline complex expressions in templates are FORBIDDEN. Extract to `computed()` in the class.
- Template logic beyond simple property access or signal reads is FORBIDDEN.

**GOOD:**
```html
@for (member of filteredMembers(); track member.id) {
  <feat-member-card [member]="member" (selected)="handleSelect($event)" />
}

@if (isLoading()) {
  <app-spinner />
} @else if (hasError()) {
  <app-error-message [message]="errorMessage()" />
}
```

**BAD:**
```html
<!-- FORBIDDEN: old structural directives -->
<feat-member-card *ngFor="let m of members">

<!-- FORBIDDEN: complex logic in template -->
{{ member.firstName + ' ' + member.lastName + ' (' + (member.status === 'active' ? 'Active' : 'Inactive') + ')' }}

<!-- FORBIDDEN: missing track -->
@for (member of members()) { }
```

### 4.5 Lifecycle Hook Rules

- `ngOnInit` MUST NOT be used for state initialization. Use `computed()` or signal default values.
- `ngOnInit` is acceptable ONLY for one-time side effects (e.g., analytics, focus management).
- `ngOnDestroy` MUST NOT be used to unsubscribe. Use `takeUntilDestroyed()`.
- `DestroyRef` + `takeUntilDestroyed()` is the REQUIRED pattern for subscription cleanup.

**GOOD:**
```typescript
export class MembersPageComponent {
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    someObservable$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => { ... });
  }
}
```

**Even better — avoid lifecycle hooks entirely with `toSignal()`:**
```typescript
export class MembersPageComponent {
  protected value = toSignal(someObservable$, { initialValue: null });
}
```

### 4.6 Lazy Loading

- All page-level components MUST be lazy-loaded via `loadComponent` or `loadChildren`.
- Eager-loaded page components in root routes are FORBIDDEN (except the shell/layout).

---

## 5. STATE MANAGEMENT RULES

### 5.1 State Layers

| State Type | Solution |
|-----------|---------|
| Server / async state | TanStack Angular Query (`injectQuery`, `injectMutation`) |
| Feature client state | NgRx SignalStore (`signalStore()` in `features/<n>/store/`) |
| Global app state | NgRx SignalStore in `@core/store/` |
| Local UI state | `signal()` / `computed()` in component class |
| Form state | Angular Reactive Forms + Zod schemas |

- TanStack Angular Query MUST be the single source of truth for server state.
- Do NOT duplicate server state into a SignalStore.
- Prop drilling beyond 2 levels is FORBIDDEN. Use a SignalStore, shared service, or input inheritance.

### 5.2 NgRx SignalStore Rules

- Feature stores live in `features/<n>/store/<feature>.store.ts`.
- Stores MUST be provided at the correct level: `providedIn: 'root'` ONLY if truly global; otherwise provide in the feature route's `providers` array.
- Store state MUST be updated only through store methods — never mutated externally.
- Computed values MUST use `computed()` inside the store — not recalculated in components.

**GOOD:**
```typescript
// features/members/store/members.store.ts
export const MembersStore = signalStore(
  withState({
    searchTerm: '',
    selectedId: null as string | null,
  }),
  withComputed(({ searchTerm }) => ({
    hasSearch: computed(() => searchTerm().length > 0),
  })),
  withMethods((store) => ({
    setSearchTerm(term: string): void {
      patchState(store, { searchTerm: term });
    },
    selectMember(id: string): void {
      patchState(store, { selectedId: id });
    },
  }))
);
```

### 5.3 RxJS Usage Rules

- RxJS MUST only be used when the reactive operator model is genuinely superior.
- If the use case can be expressed with signals and `computed()`, use signals.
- Any Observable used in a component MUST be converted via `toSignal()` or cleaned up via `takeUntilDestroyed()`.
- Subscription in a component without cleanup is FORBIDDEN.

---

## 6. ROUTING RULES

### 6.1 Route Definition

- All routes MUST use `loadComponent` or `loadChildren` for lazy loading.
- Feature routes MUST be defined in `features/<n>/<feature>.routes.ts`.

**GOOD:**
```typescript
// app/app.routes.ts
export const APP_ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'members', loadChildren: () => import('@features/members/members.routes') },
      { path: 'tasks', loadChildren: () => import('@features/tasks/tasks.routes') },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('@shared/components/ui/not-found/not-found.component'),
  },
];

// features/members/members.routes.ts
export default [
  {
    path: '',
    loadComponent: () => import('./pages/MembersPage/MembersPage.component'),
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/MemberDetailPage/MemberDetailPage.component'),
  },
] satisfies Routes;
```

### 6.2 Route Guards

- Guards MUST use the functional `CanActivateFn` / `CanMatchFn` pattern — NOT class-based guards.
- Class-based guards are FORBIDDEN in new code.

**GOOD:**
```typescript
// core/guards/auth.guard.ts
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isAuthenticated()
    ? true
    : router.createUrlTree(['/login']);
};
```

### 6.3 Route Parameters

- Route parameters MUST be accessed via `input()` with `withComponentInputBinding()` enabled in `app.config.ts`.
- Using `ActivatedRoute.params` or `ActivatedRoute.snapshot` directly is STRONGLY DISCOURAGED.

**GOOD:**
```typescript
// app.config.ts
provideRouter(APP_ROUTES, withComponentInputBinding())

// MemberDetailPage.component.ts
export class MemberDetailPageComponent {
  id = input.required<string>(); // auto-bound from :id route param
}
```

---

## 7. FORMS RULES

### 7.1 General Rules

- All forms MUST use Angular Reactive Forms.
- Template-driven forms are FORBIDDEN in feature code.
- All form schemas MUST be validated with Zod, bridged to Angular validators via a custom `zodValidator` utility.
- Inline validation logic in components is FORBIDDEN. Define schemas in `types/` or `validators/`.

### 7.2 Form Schema Pattern

```typescript
// features/members/types/member-form.type.ts
import { z } from 'zod';

export const CreateMemberSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(MemberRole),
});

export type CreateMemberFormValues = z.infer<typeof CreateMemberSchema>;
```

```typescript
// features/members/components/CreateMemberForm/CreateMemberForm.component.ts
export class CreateMemberFormComponent {
  submitted = output<CreateMemberFormValues>();

  protected form = new FormGroup({
    firstName: new FormControl('', { validators: [Validators.required] }),
    lastName: new FormControl('', { validators: [Validators.required] }),
    email: new FormControl('', { validators: [Validators.required, Validators.email] }),
  });

  protected handleSubmit(): void {
    if (this.form.invalid) return;
    this.submitted.emit(this.form.getRawValue() as CreateMemberFormValues);
  }
}
```

### 7.3 Form Submission Rules

- Form submission MUST call a parent-emitted output or injected TanStack Query mutation.
- Components MUST NOT directly call `HttpClient` on submit.
- Form error states MUST be displayed to the user per field.
- `form.invalid` MUST be checked before submitting.
- Forms MUST show a loading state when the mutation is pending (`mutation.isPending()`).

---

## 8. TESTING RULES

### 8.1 General Rules

- Tests MUST NOT depend on execution order.
- Tests MUST NOT depend on real wall-clock time.
- Tests MUST NOT depend on network connectivity. All HTTP MUST be intercepted by MSW.
- Real API calls are FORBIDDEN in tests.
- Tests MUST use a `customRender` helper from `tests/test-utils.ts` that wraps with all required providers (QueryClient, SignalStore, Router, etc.).
- The testing pyramid defaults to **integration-style tests**. Pure unit tests are reserved for complex utility/logic functions.

### 8.2 Test Structure (AAA Pattern)

```typescript
it('should display member name after loading', async () => {
  // Arrange
  const member = createMockMember({ firstName: 'John', lastName: 'Doe' });
  server.use(getMembersHandler([member]));

  // Act
  await render(MembersPageComponent, testingProviders());

  // Assert
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

**Rules:**
- Each test MUST verify ONE behavior.
- Test descriptions MUST use `should` language.
- `describe` blocks MUST group related behaviors.
- Deeply nested `describe` blocks (>3 levels) are FORBIDDEN.
- Duplicate setup logic MUST be extracted to `beforeEach` or helper functions.

### 8.3 Test Location

```
src/features/members/
  __tests__/
    MembersPage.component.spec.ts
    MemberCard.component.spec.ts
  pages/
    MembersPage/
      MembersPage.component.ts
  components/
    MemberCard/
      MemberCard.component.ts
```

### 8.4 Mocking Rules

- MSW handlers live in `tests/mocks/handlers/`.
- Mock data fixtures live in `tests/mocks/data/`.
- Per-test handler overrides MUST use `server.use()` inside the test.
- `vi.mock()` for internal Angular services MUST include a justification comment.
- Over-mocking is FORBIDDEN. Only mock external boundaries (HTTP, browser APIs).

### 8.5 Timer Rules (CRITICAL)

Angular CDK overlays, animations, and notification systems use internal timers. Failing to manage them causes flaky tests.

```typescript
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(async () => {
  await act(async () => {
    vi.runOnlyPendingTimers();
  });
  vi.clearAllTimers();
  vi.useRealTimers();
});
```

| Timer Anti-Pattern | Rule |
|-------------------|------|
| `setTimeout` in test without fake timers | FORBIDDEN |
| `await new Promise(r => setTimeout(r, N))` | FORBIDDEN |
| `vi.runAllTimers()` (can infinite-loop) | FORBIDDEN — use `vi.runOnlyPendingTimers()` |
| Real `Date.now()` in assertions | FORBIDDEN — use `vi.setSystemTime()` |

### 8.6 Query and Assertion Rules

| Rule | Detail |
|------|--------|
| Use `findBy*` for async assertions | `findBy*` is idiomatic. Use `waitFor` only for non-query assertions. |
| Use `screen` only | `screen.getByRole()` REQUIRED. Destructured queries from `render()` FORBIDDEN. |
| No snapshot tests | FORBIDDEN for components. Use explicit assertions. |
| No implementation detail assertions | Do NOT assert on private properties, internal signals, or CSS class names. |
| `*ByRole` as primary query | `getByRole`, `getByLabelText` preferred over `getByTestId`. |
| `data-testid` is last resort | Only when no accessible query exists. |

### 8.7 No Export-for-Test Rule

- Modules MUST NOT export internal constants or implementation details solely for test access.
- If a value is not part of the module's public API, it MUST remain private.
- Breaking encapsulation to satisfy a test is a grounds for PR rejection.

---

## 9. CI / PIPELINE SAFETY RULES

### 9.1 Test Execution

- All tests MUST pass via `pnpm test` (Vitest in run mode).
- Tests MUST pass in isolated CI environments with no prior state.
- Tests MUST NOT rely on any specific system timezone.
- Tests MUST NOT produce unhandled promise rejections.

### 9.2 TypeScript

- `strict: true` MUST be enabled in `tsconfig.json` and MUST NOT be disabled.
- `noUnusedLocals: true` and `noUnusedParameters: true` MUST remain enabled.
- `pnpm typecheck` (`tsc --noEmit`) MUST pass with zero errors before any PR merges.

### 9.3 Linting and Formatting

- `pnpm lint` MUST pass with zero errors (0 errors, max 2 warnings).
- `pnpm format:check` MUST pass. All code MUST be Prettier-formatted.
- Import sorting via `simple-import-sort` is enforced:
  1. Angular core + third-party packages
  2. Path alias imports (`@features/*`, `@shared/*`, `@core/*`)
  3. Relative imports
- Unused imports MUST be removed (enforced by `eslint-plugin-unused-imports`).

### 9.4 Pre-commit and Pre-push Hooks

- **Pre-commit** (Husky + lint-staged): ESLint fix + Prettier format on staged files.
- **Pre-push**: `pnpm format:check && pnpm lint && pnpm typecheck`.
- `--no-verify` bypass is FORBIDDEN. If used, reviewer MUST reject if CI fails.

### 9.5 Environment Variables

- All environment variables MUST be defined in `environment.ts` / `environment.prod.ts`.
- Hardcoded values for environment-specific config are FORBIDDEN.
- New environment variables MUST be added to `.env.example` with a description.

### 9.6 Console Output

- `console.log` in production or test code is FORBIDDEN. Use `LoggerService`.
- `console.error` during tests MUST be investigated — not silently ignored.
- If a test intentionally triggers an error, suppress with `vi.spyOn(console, 'error').mockImplementation(() => {})` and restore in `afterEach`.

---

## 10. PERFORMANCE AND CLEAN CODE RULES

### 10.1 Change Detection

- `ChangeDetectionStrategy.OnPush` is REQUIRED on every component (see §4.3).
- Objects/arrays created inline in templates are FORBIDDEN if they cause unnecessary re-evaluation.
- Use `computed()` to memoize all derived data in the component class.

**GOOD:**
```typescript
protected filteredMembers = computed(() =>
  this.members()?.filter((m) => m.name.includes(this.searchTerm())) ?? []
);
```

**BAD:**
```html
<!-- FORBIDDEN: filter expression recalculated on every render -->
@for (member of (members() | filterPipe: searchTerm()); track member.id) { }
```

### 10.2 Memoization Rules

| When to Use `computed()` | When NOT to Memoize |
|--------------------------|---------------------|
| Derived data from list signals | Simple boolean inversions (`!isLoading()`) |
| Expensive filtering / sorting | Trivial single-signal derivations |
| Values passed as inputs to child components | Values that always change with parent |

### 10.3 `@for` Track Expression

- `@for` MUST always include `track` using a stable, unique identifier.
- `$index` as `track` is FORBIDDEN on dynamic, reorderable lists.

**GOOD:** `@for (item of items(); track item.id)`
**BAD:** `@for (item of items(); track $index)` — FORBIDDEN on dynamic lists

### 10.4 Pipe Rules

- Pure pipes are preferred for template transformations (they memoize automatically).
- Impure pipes (`pure: false`) are FORBIDDEN unless explicitly justified in a comment.
- Heavy transformations MUST be done in `computed()` in the component class, not in pipes.

### 10.5 Class Merging

- All dynamic class composition MUST use a `computed()` returning an object for `[ngClass]`, or compose Tailwind strings in the component class.
- String concatenation for class names directly in templates is FORBIDDEN.

### 10.6 Dead Code

- Dead code, commented-out blocks, and unused imports MUST be removed before PR.
- `TODO` comments MUST include a ticket reference: `// TODO(APP-1234): description`.
- `FIXME` comments MUST be resolved before merging to `main`.

### 10.7 Signal vs Observable Decision Guide

```
Is this state derived from other signals?
├─ YES → Use computed()
└─ NO
    │
    Is this an event stream (user interactions, WebSocket, etc.)?
    ├─ YES → Use Observable + toSignal() or takeUntilDestroyed()
    └─ NO
        │
        Is this server state?
        ├─ YES → Use TanStack Angular Query (injectQuery / injectMutation)
        └─ NO → Use signal() for local UI state
```

---

## 11. REVIEWER CHECKLIST

Use this checklist for every pull request review. If any item fails, the PR MUST be returned for revision.

### Architecture

- [ ] Import boundaries respected (no cross-feature imports, no upward imports)
- [ ] New files placed in the correct directory per folder structure rules
- [ ] Path aliases used (no deep relative imports `../../..`)
- [ ] Feature module structure followed for new features
- [ ] All components are `standalone: true`
- [ ] No `NgModule` in new code

### Naming

- [ ] Files follow naming conventions (PascalCase components, kebab-case non-components)
- [ ] Boolean signals use `is`/`has`/`should`/`can` prefix
- [ ] Constants are `UPPER_SNAKE_CASE`
- [ ] Component selectors use correct prefix (`app-` or `feat-`)
- [ ] `input()` / `input.required()` used instead of `@Input()` decorator
- [ ] `output()` used instead of `@Output() new EventEmitter()`
- [ ] Commit messages follow conventional commits format

### Component Rules

- [ ] `ChangeDetectionStrategy.OnPush` on every component
- [ ] Control flow uses `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`)
- [ ] `@for` has a `track` expression using a unique identifier
- [ ] No complex expressions in templates — extracted to `computed()`
- [ ] Smart/dumb component separation respected
- [ ] Page components lazy-loaded via `loadComponent` / `loadChildren`

### Logic Separation

- [ ] No business logic inside UI components
- [ ] Data transformations in utility functions, not in component class or templates
- [ ] API calls via TanStack Angular Query — no direct `HttpClient` in components
- [ ] Signals used for local state (not `BehaviorSubject` or plain properties)

### State Management

- [ ] Server state via TanStack Angular Query (not duplicated in SignalStore)
- [ ] Feature client state in SignalStore, not in component
- [ ] No RxJS where signals/computed suffice
- [ ] Subscriptions use `takeUntilDestroyed()` or `toSignal()` — no memory leaks

### Types

- [ ] No `any` types without justification
- [ ] No `@ts-ignore` without a ticket reference
- [ ] Proper TypeScript types for all inputs, outputs, API responses
- [ ] `strict: true` compatibility maintained
- [ ] Mutation payload types explicitly defined (not reusing full entity types)
- [ ] Components construct only required payload fields — no entity spreading

### Forms

- [ ] Reactive Forms used (no template-driven forms)
- [ ] Zod schema defined for form validation
- [ ] Form errors displayed per field
- [ ] Form invalid check before submission
- [ ] Loading state shown during mutation

### Testing

- [ ] Tests follow AAA pattern
- [ ] Tests use `customRender` / `render` with proper providers
- [ ] Tests use `screen` for queries (no destructured queries)
- [ ] Tests prefer `findBy*` for async queries
- [ ] No snapshot tests for components
- [ ] No implementation detail assertions
- [ ] All async operations are awaited
- [ ] No real HTTP calls (MSW intercepts all)
- [ ] No internal values exported solely for test access

### Timer Safety

- [ ] `vi.useFakeTimers({ shouldAdvanceTime: true })` in `beforeEach` when applicable
- [ ] `vi.runOnlyPendingTimers()` (not `runAllTimers()`) in `afterEach`
- [ ] `vi.clearAllTimers()` and `vi.useRealTimers()` called in `afterEach`
- [ ] No arbitrary `setTimeout` waits in tests

### Error Handling

- [ ] All mutations have `onError` handlers
- [ ] User-facing error feedback provided (toast, inline error)
- [ ] No silently swallowed errors
- [ ] No `console.log` / `console.error` in code

### Clean Code

- [ ] No dead code or commented-out blocks
- [ ] No `TODO`/`FIXME` without ticket reference
- [ ] No magic numbers or hardcoded strings
- [ ] Function and component size within limits
- [ ] No duplicate constant definitions across files

### Performance

- [ ] `computed()` used for derived data (not recalculated in templates)
- [ ] `@for` tracks by unique ID (not `$index` on dynamic lists)
- [ ] No inline object/array creation in template bindings
- [ ] No impure pipes without justification

### CI Safety

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm format:check` passes
- [ ] `pnpm test` passes
- [ ] No new env variables without `.env.example` update

### Cache & Mutation Logic (TanStack Angular Query)

- [ ] Mutations use EITHER optimistic updates OR `invalidateQueries`, not both
- [ ] `setQueryData` only spreads server-confirmed fields
- [ ] No `variables` fallback used as cache update source
- [ ] Cache read/write uses exact query key (including params)
- [ ] Bare query keys only used with prefix-matching methods

### Routing

- [ ] All page routes use `loadComponent` or `loadChildren` (lazy-loaded)
- [ ] Guards use functional `CanActivateFn` pattern (no class-based guards)
- [ ] Route params accessed via `input()` with `withComponentInputBinding()`

---

> **This document is enforceable. Non-compliance is grounds for PR rejection.**
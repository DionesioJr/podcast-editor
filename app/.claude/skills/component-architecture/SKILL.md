---
name: component-architecture
description: React Native component architecture standard for this project. Use when creating, refactoring, or reviewing components, enforces single responsibility, Container+View pattern, domain-oriented structure, and hooks-as-logic-units.
when_to_use: Activate when the user asks how to structure a component, where to put logic, how to split a screen, how to organize files, or when reviewing/creating any component, hook, or module in React Native.
---

# React Native Component Architecture

## Purpose

Define a clear, scalable, and maintainable standard for building React Native components, ensuring high cohesion, low coupling, and long-term evolution of the codebase.

This skill enforces a philosophy similar to Vue.js: each component must have a single, well-defined responsibility.

---

### Principles

#### 1. Single Responsibility

Each component MUST have one clear responsibility.

- A component should be explainable in one sentence
- If it does more than one thing, it MUST be split

Examples:

GOOD:

- `PostHeader` → displays post metadata
- `PostContent` → handles content editing

BAD:

- `PostScreen` → handles UI, API, validation, navigation

---

#### 2. Separation of Concerns

Components MUST NOT mix responsibilities.

Split into:

- UI (rendering)
- State (local state)
- Business logic
- Side effects (API, storage, analytics)

---

#### 3. Container + View Pattern

Every complex component SHOULD follow:

- Container → logic, orchestration
- View → pure UI

Example:

```
PostEditor.tsx        // Container
PostEditor.view.tsx   // UI
```

Rules:

- View MUST be stateless (or minimal state)
- Container MUST NOT contain JSX complexity

---

#### 4. Hooks as Logic Units

All reusable or complex logic MUST be extracted into hooks.

Hooks are equivalent to Vue composables.

Examples:

- `usePostEditor`
- `useSchedulePost`
- `useSocialConnection`

Rules:

- Hooks MUST NOT render UI
- Hooks MUST encapsulate logic and state

---

#### 5. UI Composition by Intent

Components MUST be split by UI meaning, not by technical detail.

GOOD:

- `PostHeader`
- `PostContent`
- `PostActions`

BAD:

- `LeftButton`
- `Wrapper`
- `ContainerBox`

---

#### 6. Domain-Oriented Structure

Files MUST be organized by feature/domain, not by type.

GOOD:

```
PostEditor/
  PostEditor.tsx
  PostEditor.view.tsx
  usePostEditor.ts
  components/
    PostHeader.tsx
    PostContent.tsx
    PostActions.tsx
```

BAD:

```
components/
hooks/
utils/
screens/
```

---

#### 7. Avoid Over-Fragmentation

Components SHOULD NOT be split unnecessarily.

DO NOT split when:

- Logic is simple
- Component is still readable
- No clear responsibility boundary exists

---

#### 8. Extract Business Rules

Business logic MUST NOT live inside UI components.

Move to:

- hooks
- domain functions
- use cases

Example:

```
validatePost.ts
createPost.ts
```

---

#### 9. Side Effects Isolation

All side effects MUST be isolated.

Includes:

- API calls
- Async operations
- Storage access
- Analytics

Preferred location:

- hooks

---

#### 10. Readability Over Abstraction

Prefer clear and explicit code over clever abstractions.

- Avoid premature patterns
- Avoid unnecessary indirection
- Optimize for future developers

---

### Anti-Patterns

The following are NOT allowed:

- Components with 300+ lines mixing UI and logic
- Massive prop drilling with unrelated data
- Generic components without clear intent
- Hooks that depend on UI structure
- Files organized only by technical type

---

### Decision Rules

When in doubt:

1. Can I describe this component in one sentence?
   - If NO → split

2. Does this logic belong to UI?
   - If NO → move to hook or domain

3. Is this reusable or complex?
   - If YES → extract

4. Will this improve clarity?
   - If NO → do not split

---

### Expected Outcomes

By following this skill, the system will achieve:

- High maintainability
- Predictable structure
- Faster onboarding
- Better scalability
- Easier AI-assisted development

---

### Summary

- One component = one responsibility
- Logic lives in hooks
- UI is declarative and clean
- Structure follows domain
- Clarity is prioritized over abstraction

This is the standard for all React Native components in this project.

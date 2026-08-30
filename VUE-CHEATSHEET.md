# Vue 3 `<script setup>` reference

Every construct available in an SFC, with no names filled in. Copy the shape,
rename to taste. Vue 3.5 / TypeScript.

---

## The whole file

```vue
<template>
  <!-- markup -->
</template>

<script setup lang="ts">
// everything below
</script>

<style scoped>
/* styles */
</style>
```

`setup` = top-level bindings are automatically available to the template.
Without it you need an explicit `export default { setup() { return {...} } }`.
`scoped` = styles apply only to this component's elements.

---

## Imports

```ts
import { ref, reactive, computed, watch, watchEffect, onMounted } from 'vue'
import { useStore } from '@/store'
import SomeChild from '@/components/SomeChild.vue'
import type { SomeType } from '@/types'
```

Components just need importing — no `components: {}` registration under `setup`.

---

## Props

```ts
// with types only
const props = defineProps<{
  someRequired: string
  someOptional?: number
}>()

// with defaults
const props = withDefaults(defineProps<{
  someOptional?: number
}>(), {
  someOptional: 0,
})
```

Props are **readonly**. Never assign to `props.x` — emit an event instead.
`defineProps` is a compiler macro: no import, only valid at the top level.

---

## Emits

```ts
const emit = defineEmits<{
  someEvent: [payloadA: string, payloadB: number]
  anotherEvent: []
}>()

emit('someEvent', 'a', 1)
```

Parent listens with `@some-event="handler"`.

---

## Two-way binding (replaces the props+emit dance)

```ts
const someModel = defineModel<string>()
const otherModel = defineModel<number>('namedProp', { default: 0 })
```

Parent uses `v-model` / `v-model:namedProp`. Read and write it like a ref.

---

## Reactive state

```ts
// primitives, and anything you reassign wholesale — needs .value in script
const someRef = ref<string>('')
const someList = ref<SomeType[]>([])
someRef.value = 'new'

// objects whose properties you mutate — no .value, cannot be reassigned
const someObject = reactive({ a: 1, b: 2 })
someObject.a = 3

// non-reactive: large/frozen data you never mutate
const someStatic = shallowRef<SomeType[]>([])
```

**Default to `ref`.** `reactive` breaks if you reassign the whole object, and
destructuring it loses reactivity. Templates unwrap `.value` automatically —
you only write `.value` inside `<script>`.

---

## Computed — read-only

```ts
const someDerived = computed(() => someRef.value * 2)
```

Cached; re-evaluates only when a dependency changes. **Must be pure — no side
effects, no async.** Same rule as a Vuex getter.

---

## Computed — writable (getter + setter)

```ts
const someWritable = computed({
  get: () => someRef.value,
  set: (newValue: string) => { someRef.value = newValue },
})
```

For when a value derives from state but also needs to be assignable —
`v-model` on a derived value, or a prop-backed local value.

---

## Watchers — side effects on change

```ts
// one source
watch(someRef, (newValue, oldValue) => { /* ... */ })

// a getter, when watching a nested value or a store path
watch(() => someObject.a, (newValue, oldValue) => { /* ... */ })

// several sources
watch([someRefA, someRefB], ([newA, newB], [oldA, oldB]) => { /* ... */ })

// options
watch(someRef, handler, {
  immediate: true,  // run once on setup instead of waiting for a change
  deep: true,       // fire on nested mutations (expensive)
  flush: 'post',    // run after the DOM updates
})

// cleanup — runs before the next fire and on unmount
watch(someRef, (newValue, oldValue, onCleanup) => {
  const id = setInterval(() => {}, 1000)
  onCleanup(() => clearInterval(id))
})

// stop it manually
const stop = watch(someRef, handler)
stop()
```

**If you're assigning to a ref inside a watch, you probably wanted `computed`.**
Watch is for side effects: timers, fetches, logging, DOM work.

---

## watchEffect — auto-tracked

```ts
watchEffect((onCleanup) => {
  console.log(someRef.value)     // dependencies collected automatically
  onCleanup(() => { /* ... */ })
})
```

Runs immediately and re-runs when anything it read changes. Convenient, but you
can't see the dependency list — prefer `watch` when it matters.

---

## Lifecycle hooks

```ts
onBeforeMount(() => {})
onMounted(() => {})           // DOM exists; fetch, measure, attach listeners
onBeforeUpdate(() => {})
onUpdated(() => {})
onBeforeUnmount(() => {})     // cancel timers, remove listeners
onUnmounted(() => {})
onErrorCaptured((err, instance, info) => { return false })
onActivated(() => {})         // <KeepAlive> only
onDeactivated(() => {})
```

Anything started in `onMounted` should be torn down in `onBeforeUnmount`.
Timers and listeners that outlive a component are a top memory-leak source.

---

## Template refs

```vue
<template>
  <div ref="someElement" />
</template>

<script setup lang="ts">
const someElement = ref<HTMLDivElement | null>(null)
onMounted(() => { someElement.value?.focus() })
</script>
```

Name the ref exactly as the attribute. It's `null` until mounted.

---

## Methods

```ts
function someHandler(someArg: string): void { /* ... */ }
async function someAsyncHandler(): Promise<void> { await something() }
```

Plain functions. No `methods: {}` block, no `this`.

---

## Store access

```ts
const store = useStore()

const someState   = computed(() => store.state.someModule.someField)
const someGetter  = computed(() => store.getters['someModule/someGetter'])
const someParam   = computed(() => store.getters['someModule/someGetter'](arg))

function someDispatch() { return store.dispatch('someModule/someAction', payload) }
function someCommit()   { store.commit('someModule/SOME_MUTATION', payload) }
```

Always wrap store reads in `computed`, or they won't update.

---

## Exposing to a parent

```ts
defineExpose({ someMethod, someValue })
```

`<script setup>` components are closed by default; a parent's template ref sees
only what you expose.

---

## Component options that have no macro

```ts
defineOptions({ name: 'SomeName', inheritAttrs: false })
```

---

## Template directives

```vue
{{ someExpression }}                     <!-- interpolation -->
<div v-text="x" />                       <!-- textContent -->
<div v-html="x" />                       <!-- XSS risk: never on user input -->

<div v-if="a" /><div v-else-if="b" /><div v-else />   <!-- must be siblings -->
<div v-show="a" />                       <!-- toggles CSS display only -->

<li v-for="(item, index) in list" :key="item.id" />   <!-- key = stable id -->
<li v-for="(value, key) in object" :key="key" />

<input v-model="x" />
<input v-model.trim="x" />
<input v-model.number="x" />
<input v-model.lazy="x" />               <!-- on change, not input -->

<button @click="handler" />
<button @click.prevent.stop="handler" />
<input  @keyup.enter="handler" />
<div    @click.self="handler" />         <!-- only if target is this element -->
<div    @click.once="handler" />

<img :src="x" :alt="y" />
<div :class="{ active: isActive }" :style="{ color: c }" />
<div v-bind="someObjectOfAttrs" />

<slot name="someName" :some-prop="x" />
<template #someName="{ someProp }" />

<component :is="someComponent" />
<Suspense><template #default /><template #fallback /></Suspense>
<Teleport to="body" />
<KeepAlive />
<Transition name="fade" />
```

---

## Quick decision table

| Need | Reach for |
|---|---|
| A value that changes | `ref` |
| A value derived from other values | `computed` |
| A derived value that's also assignable | `computed({ get, set })` |
| A side effect when something changes | `watch` |
| A side effect with implicit dependencies | `watchEffect` |
| Something on first render | `onMounted` |
| To undo that | `onBeforeUnmount` |
| Data from a parent | `defineProps` |
| To tell a parent something | `defineEmits` |
| Two-way with a parent | `defineModel` |
| Shared state across components | the store |

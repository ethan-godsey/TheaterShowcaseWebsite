<template>
  <section id="contact" class="section section--tint">
    <div class="container container--narrow">
      <p class="eyebrow" v-reveal>Contact</p>
      <h2 class="section-title" v-reveal.mask>Get in touch</h2>

      <p v-if="submitted" class="contact__thanks">
        Thank you — your message is on its way. Ellie will be in touch soon.
      </p>

      <form v-else class="contact__form" v-reveal.stagger novalidate @submit.prevent="onSubmit">
        <div class="field">
          <label for="contact-name">Name</label>
          <input id="contact-name" v-model.trim="name" type="text" required autocomplete="name" />
        </div>

        <div class="field">
          <label for="contact-email">Email</label>
          <input id="contact-email" v-model.trim="email" type="email" required autocomplete="email" />
        </div>

        <div class="field">
          <label for="contact-message">Message</label>
          <textarea id="contact-message" v-model.trim="message" rows="6" required />
        </div>

        <!--
          Honeypot. Real people never see this; bots fill every field they find.
          aria-hidden + tabindex keeps it away from screen readers and keyboards.
        -->
        <div class="visually-hidden" aria-hidden="true">
          <label for="contact-company">Company</label>
          <input id="contact-company" v-model="company" type="text" tabindex="-1" autocomplete="off" />
        </div>

        <p v-if="error" class="state state--error">{{ error }}</p>

        <button class="btn" type="submit" :disabled="submitting || !isValid">
          {{ submitting ? 'Sending…' : 'Send message' }}
        </button>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
/* ── 1. Imports ─────────────────────────────────────────────────────── */
import { ref, computed } from 'vue'
import { useStore } from '@/store'

/* ── 4. Store ───────────────────────────────────────────────────────── */
const store = useStore()

/* ── 5. Local state ─────────────────────────────────────────────────────
   Form fields are component state, not store state — nothing else in the
   app needs a half-typed message. Only the submission goes to the store. */
const name = ref('')
const email = ref('')
const message = ref('')
const company = ref('') // honeypot; must stay empty

/* ── 6. Computed ────────────────────────────────────────────────────── */
const submitting = computed<boolean>(() => store.getters['contact/isLoading']('submit'))
const error = computed<string | null>(() => store.getters['contact/requestError']('submit'))
const submitted = computed<boolean>(() => store.getters['contact/wasSubmitted'])

const isValid = computed(
  () => name.value.length > 0 && email.value.includes('@') && message.value.length > 0,
)

/* ── 9. Handlers ────────────────────────────────────────────────────── */
function onSubmit(): void {
  // Bot filled the honeypot. Pretend it worked rather than telling them why.
  if (company.value !== '') return

  void store.dispatch('contact/submit', {
    name: name.value,
    email: email.value,
    message: message.value,
  })
}
</script>

<style scoped>
.contact__form {
  display: grid;
  gap: var(--space-sm);
  max-width: 34rem;
}

.field {
  display: grid;
  gap: 0.35rem;
}

.field label {
  font-size: var(--step--1);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-mute);
}

.field input,
.field textarea {
  border: 1px solid var(--rule);
  background: var(--paper);
  padding: 0.7rem 0.85rem;
  width: 100%;
}

.field textarea {
  resize: vertical;
}

.field input:focus,
.field textarea:focus {
  border-color: var(--accent);
}

.contact__thanks {
  font-family: var(--font-display);
  font-size: var(--step-1);
  color: var(--ink);
  border-left: 3px solid var(--accent);
  padding-left: var(--space-sm);
}

.btn {
  justify-self: start;
}
</style>

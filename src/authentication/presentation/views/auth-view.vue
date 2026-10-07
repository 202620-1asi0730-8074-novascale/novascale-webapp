<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UserAvatar from '../../../shared/presentation/components/user-avatar.vue'
import { useAuthenticationStore } from '../../application/authentication.store.js'
import { useI18n } from '../../../i18n.js'

const route = useRoute()
const router = useRouter()
const store = useAuthenticationStore()
const { locale, setLocale, t } = useI18n()

const signup = computed(() => route.name === 'signup')
const forgot = computed(() => route.name === 'forgot-password')
const form = reactive({ name: '', company: '', email: '', password: '' })
const errorMessage = ref('')
const busy = ref(false)
const recoveryEmail = ref('')
const recoveryRequested = ref(false)

async function submit() {
  errorMessage.value = ''
  busy.value = true
  try {
    if (signup.value) await store.signUp(form)
    else await store.signIn(form.email, form.password)
    await router.push('/dashboard')
  } catch (error) {
    errorMessage.value = error.response?.status === 401 ? t('invalidCredentials') : error.response?.status === 409 ? t('emailExists') : error.response?.status === 400 ? t('invalidRegistration') : t('apiError')
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div v-if="forgot" class="recovery-page">
    <router-link class="auth-back" to="/login"><span class="ui-icon" aria-hidden="true" :class="'icon-' + ('back')" :style="{ width: 17 + 'px', height: 17 + 'px' }"></span>{{ t('backLogin') }}</router-link>
    <section class="recovery-card">
      <img class="brand-image" src="/src/assets/novaleads-logo.svg" alt="NovaLeads" />
      <div class="recovery-icon"><span class="ui-icon" aria-hidden="true" :class="'icon-' + ('mail')" :style="{ width: 27 + 'px', height: 27 + 'px' }"></span></div>
      <h1>{{ t('recovery') }}</h1>
      <p>{{ t('recoveryIntro') }}</p>
      <form class="recovery-form form-stack" @submit.prevent="recoveryRequested = true">
        <label>{{ t('email') }}<input v-model="recoveryEmail" type="email" required placeholder="name@company.com" /></label>
        <button class="button primary full-width" type="submit">{{ t('requestReset') }}</button>
      </form>
      <p v-if="recoveryRequested" class="info-box" role="status">{{ t('recoveryBody') }}</p>
      <router-link class="text-link" to="/login">← {{ t('backLogin') }}</router-link>
    </section>
  </div>
  <div v-else class="auth-layout">
    <aside class="auth-story">
      <router-link to="/"><img class="brand-image" src="/src/assets/novaleads-logo-light.svg" alt="NovaLeads" /></router-link>
      <div class="auth-story-content">
        <span class="auth-story-label"><span class="status-dot"></span>{{ t('storyLabel') }}</span>
        <h2>{{ t(signup ? 'storySignup' : 'storyLogin') }}</h2>
        <blockquote>
          <p>“{{ t('storyQuote') }}”</p>
          <footer><UserAvatar name="Sarah Jenkins" /><span><strong>Sarah Jenkins</strong><small>{{ t('salesVP') }}</small></span></footer>
        </blockquote>
      </div>
    </aside>
    <main class="auth-main">
      <div class="auth-form-container">
        <div class="language-switch"><button type="button" :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button><button type="button" :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button></div>
        <h1>{{ t(signup ? 'createAccount' : 'welcome') }}</h1>
        <p class="auth-description">{{ t('authDescription') }}</p>
        <form class="form-stack" @submit.prevent="submit">
          <label v-if="signup">{{ t('name') }}<input v-model="form.name" required autocomplete="name" /></label>
          <label v-if="signup">{{ t('company') }}<input v-model="form.company" required autocomplete="organization" /></label>
          <label>{{ t('email') }}<input v-model="form.email" required type="email" autocomplete="email" /></label>
          <label>{{ t('password') }}<input v-model="form.password" required type="password" minlength="8" :autocomplete="signup ? 'new-password' : 'current-password'" :placeholder="signup ? t('passwordHint') : ''" /></label>
          <div v-if="!signup" class="auth-form-options"><router-link class="text-link" to="/forgot-password">{{ t('forgotPassword') }}</router-link></div>
          <p v-if="errorMessage" class="auth-error" role="alert">{{ errorMessage }}</p>
          <button class="button primary full-width" type="submit" :disabled="busy">{{ busy ? t('wait') : t(signup ? 'createSpace' : 'login') }}</button>
        </form>
        <p class="auth-switch">{{ t(signup ? 'haveAccount' : 'noAccount') }} <router-link :to="signup ? '/login' : '/signup'">{{ t(signup ? 'login' : 'register') }}</router-link></p>
      </div>
    </main>
  </div>
</template>

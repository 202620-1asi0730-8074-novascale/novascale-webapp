<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from '../../../i18n.js'
const router = useRouter()
const { t } = useI18n()
</script>
<template>
  <div class="not-found">
    <span class="ui-icon" aria-hidden="true" :class="'icon-' + ('search')" :style="{ width: 42 + 'px', height: 42 + 'px' }"></span>
    <span class="eyebrow">ERROR 404</span>
    <h1>{{ t('notFoundTitle') }}</h1>
    <p>{{ t('notFoundBody') }}</p>
    <button class="button primary" @click="router.push('/login')">{{ t('backLogin') }}</button>
  </div>
</template>

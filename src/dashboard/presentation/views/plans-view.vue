<script setup>
import { useI18n } from '../../../i18n.js'
const { locale, setLocale, t } = useI18n()
const plans = [
  { name: 'Starter', price: '$29', description: 'starterDescription', features: ['starterFeature1', 'starterFeature2', 'starterFeature3', 'starterFeature4'], action: 'getStarted' },
  { name: 'Professional', price: '$79', description: 'professionalDescription', features: ['professionalFeature1', 'professionalFeature2', 'professionalFeature3', 'professionalFeature4'], action: 'startTrial', featured: true },
  { name: 'Enterprise', price: null, description: 'enterpriseDescription', features: ['enterpriseFeature1', 'enterpriseFeature2', 'enterpriseFeature3', 'enterpriseFeature4'], action: 'contactSales' }
]
</script>
<template>
  <div class="plans-page">
    <header class="landing-header"><router-link to="/login"><img class="brand-image" src="/src/assets/novaleads-logo.svg" alt="NovaLeads" /></router-link><div class="landing-nav-actions"><div class="language-switch"><button :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button><button :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button></div><router-link class="text-link" to="/login">{{ t('backLogin') }}</router-link></div></header>
    <main class="plans-content"><span class="badge violet">{{ t('plans') }}</span><h1>{{ t('plansTitle') }}</h1><p>{{ t('plansBody') }}</p><div class="plans-grid"><article v-for="plan in plans" :key="plan.name" class="plan-card" :class="{ featured: plan.featured }"><div class="plan-card-heading"><h2>{{ plan.name }}</h2><span v-if="plan.featured" class="badge violet">{{ t('mostPopular') }}</span></div><div class="plan-price"><strong>{{ plan.price || t('customPrice') }}</strong><span v-if="plan.price">/{{ t('month') }}</span></div><p>{{ t(plan.description) }}</p><ul><li v-for="feature in plan.features" :key="feature">✓ <span>{{ t(feature) }}</span></li></ul><router-link class="button" :class="plan.featured ? 'primary' : 'secondary'" to="/signup">{{ t(plan.action) }}</router-link></article></div></main>
  </div>
</template>

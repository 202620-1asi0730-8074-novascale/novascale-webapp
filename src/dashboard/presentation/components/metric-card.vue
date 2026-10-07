<script setup>defineProps({ label: String, value: [String, Number], icon: String, caption: String, color: { type: String, default: 'violet' } })</script>
<template>
  <article class="metric-card">
    <div class="metric-top"><span>{{ label }}</span><span class="metric-icon" :class="color"><span class="ui-icon" aria-hidden="true" :class="'icon-' + (icon)" :style="{ width: 20 + 'px', height: 20 + 'px' }"></span></span></div>
    <strong class="metric-value">{{ value }}</strong>
    <p class="metric-caption"><span class="status-dot" :class="color"></span>{{ caption }}</p>
  </article>
</template>

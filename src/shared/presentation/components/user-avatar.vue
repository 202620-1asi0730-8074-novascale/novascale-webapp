<script setup>
import { computed } from 'vue'
const props = defineProps({ name: { type: String, default: '' }, size: { type: String, default: 'md' } })
const initials = computed(() => props.name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join(''))
const tone = computed(() => ['violet', 'blue', 'green', 'amber'][Array.from(props.name).reduce((a, c) => a + c.charCodeAt(0), 0) % 4])
</script>
<template><span class="avatar" :class="[tone, `avatar-${size}`]" aria-hidden="true">{{ initials }}</span></template>
<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useI18n } from '../../../i18n.js'
const { t } = useI18n()
defineProps({ title: String, wide: Boolean })
const emit = defineEmits(['close'])
const dialog = ref(null)
let previousFocus
function close(event) { event?.preventDefault(); emit('close') }
function backdrop(event) { if (event.target === dialog.value) { const rect = dialog.value.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close() } }
onMounted(() => { previousFocus = document.activeElement; dialog.value.showModal() })
onBeforeUnmount(() => { dialog.value?.close(); previousFocus?.focus() })
</script>
<template><dialog ref="dialog" class="modal" :class="{ 'modal-wide': wide }" aria-labelledby="modal-title" @cancel="close" @click="backdrop"><div class="modal-header"><div><span class="eyebrow">NOVALEADS</span><h2 id="modal-title">{{ title }}</h2></div><button class="icon-button" :aria-label="t('closeWindow')" @click="close"><span class="ui-icon" aria-hidden="true" :class="'icon-' + ('close')" :style="{ width: 20 + 'px', height: 20 + 'px' }"></span></button></div><slot /></dialog></template>

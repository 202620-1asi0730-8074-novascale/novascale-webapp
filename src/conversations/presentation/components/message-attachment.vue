<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from '../../../i18n.js'

const props = defineProps({ file: { type: Object, required: true } })
const emit = defineEmits(['loaded'])
const { t } = useI18n()
const failed = ref(false)
const isImage = computed(() => ['image/png', 'image/jpeg', 'image/webp'].includes(props.file.type)
  && typeof props.file.data === 'string' && props.file.data.startsWith(`data:${props.file.type};base64,`))
watch(() => props.file.data, () => { failed.value = false })
</script>

<template>
  <span class="chat-attachment">
    <a v-if="isImage && !failed" class="attachment-preview" :href="file.data" :download="file.name">
      <img :src="file.data" :alt="file.name" loading="lazy" decoding="async" @load="emit('loaded')" @error="failed = true" />
    </a>
    <span v-if="isImage && failed" class="attachment-error">{{ t('imagePreviewUnavailable') }}</span>
    <a class="attachment-download" :href="file.data" :download="file.name">📎 {{ file.name }}</a>
  </span>
</template>

<style scoped>
.chat-attachment { display: flex; flex-direction: column; gap: 6px; max-width: 100%; margin-top: 6px; }
.attachment-preview { display: block; width: fit-content; max-width: 100%; }
.attachment-preview img { display: block; width: auto; height: auto; max-width: min(300px, 100%); max-height: 260px; object-fit: contain; border-radius: 8px; background: #fff; }
.attachment-download { font-size: 12px; color: inherit; overflow-wrap: anywhere; }
.attachment-error { font-size: 12px; }
</style>

import { ref, reactive } from 'vue'

const store = (() => {
    const toast = ref('')
    let toastTimer
    function notify(message) {
        toast.value = message;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.value = '', 4500)
    }
    return reactive({ toast, notify });
})();

export function useUiStore() { return store; }
<template>
    <span
        class="stats-chip"
        :class="[variantClass, sizeClass, { bordered, pill }]"
        :title="computedTitle"
        role="group"
        :aria-label="computedAriaLabel"
    >
        <i v-if="iconClass" :class="iconClass" aria-hidden="true"></i>
        <span v-if="showLabel" class="label">{{ computedLabel }}</span>
        <span class="value">{{ value }}</span>
    </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    type: { type: String, default: 'goals' },
    value: { type: [Number, String], required: true },
    label: { type: String, default: '' },
    title: { type: String, default: '' },
    size: { type: String, default: 'md' },
    bordered: { type: Boolean, default: false },
    pill: { type: Boolean, default: true },
    showLabel: { type: Boolean, default: false },
    icon: { type: String, default: '' },
})

const TYPE_META = {
    goals: { icon: 'fas fa-futbol', label: 'G', variant: 'success' },
    yellow: { icon: 'fas fa-square yellow-card', label: 'YC', variant: 'warning' },
    red: { icon: 'fas fa-square red-card', label: 'RC', variant: 'danger' },
    pensScored: { icon: 'fas fa-check-circle', label: 'PS', variant: 'success' },
    pensMissed: { icon: 'fas fa-times-circle', label: 'PM', variant: 'muted' },
    apps: { icon: 'fas fa-stopwatch', label: 'Apps', variant: 'neutral' },
    custom: { icon: 'fas fa-chart-bar', label: 'Stat', variant: 'neutral' },
}

const meta = computed(() => TYPE_META[props.type] || TYPE_META.custom)
const iconClass = computed(() => props.icon || meta.value.icon)
const computedLabel = computed(() => props.label || meta.value.label)
const variantClass = computed(() => `variant-${meta.value.variant}`)
const sizeClass = computed(() => (props.size === 'sm' ? 'size-sm' : 'size-md'))
const computedTitle = computed(() => props.title || `${computedLabel.value}: ${props.value}`)
const computedAriaLabel = computed(() => computedTitle.value)
</script>

<style scoped>
.stats-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.28rem 0.55rem;
    border-radius: 9999px;
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1;
    user-select: none;
}
.stats-chip.size-sm {
    font-size: 0.75rem;
    padding: 0.18rem 0.45rem;
}
.stats-chip.bordered {
    border: 1px solid rgba(0, 0, 0, 0.06);
}
.stats-chip .label {
    opacity: 0.8;
}
.stats-chip .value {
    font-weight: 800;
}

.variant-neutral {
    background: #f1f3f5;
    color: #495057;
}
.variant-success {
    background: #e6f4ea;
    color: #146c43;
}
.variant-warning {
    background: #fff4d6;
    color: #7a5d00;
}
.variant-danger {
    background: #fde7e9;
    color: #b42318;
}
.variant-muted {
    background: #f3f4f6;
    color: #6b7280;
}

.yellow-card {
    color: #ffc107;
}
.red-card {
    color: #dc3545;
}

.stats-chip i {
    font-size: 0.9em;
    line-height: 1;
}
</style>

<template>
    <div
        class="star-rating"
        :class="[`size-${size}`, { readonly }]"
        v-bind="rootAria"
        :tabindex="readonly ? undefined : 0"
        @keydown="onKeydown"
    >
        <button
            v-for="n in max"
            :key="n"
            type="button"
            class="star-btn"
            :title="`${n} / ${max}`"
            :disabled="readonly"
            @mouseenter="onHover(n)"
            @mouseleave="onHover(0)"
            @focus="onHover(n)"
            @blur="onHover(0)"
            @click="set(n)"
        >
            <i :class="iconClass(n)" aria-hidden="true"></i>
        </button>

        <span v-if="showValue" class="value">{{ Number(displayValue).toFixed(1) }}</span>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
    modelValue: { type: Number, default: 0 },
    max: { type: Number, default: 5 },
    readonly: { type: Boolean, default: false },
    size: { type: String, default: 'md' },
    showValue: { type: Boolean, default: false },
    ariaLabel: { type: String, default: 'Rating' },
})

const emit = defineEmits(['update:modelValue'])

const hover = ref(0)

const displayValue = computed(() => hover.value || props.modelValue || 0)

const rootAria = computed(() => {
    if (props.readonly) {
        return {
            role: 'img',
            'aria-label': `${props.ariaLabel}: ${displayValue.value} of ${props.max}`,
        }
    }
    const now = Math.max(0, Math.min(props.max, Number(props.modelValue || 0)))
    return {
        role: 'slider',
        'aria-valuemin': 0,
        'aria-valuemax': props.max,
        'aria-valuenow': now,
        'aria-valuetext': `${now} of ${props.max}`,
        'aria-label': props.ariaLabel,
    }
})

function set(n) {
    if (props.readonly) return
    const clamped = Math.max(0, Math.min(props.max, Number(n)))
    emit('update:modelValue', clamped)
}

function onHover(n) {
    if (props.readonly) return
    hover.value = Number(n) || 0
}

function iconClass(n) {
    if (props.readonly && typeof props.modelValue === 'number') {
        const v = props.modelValue
        if (n <= Math.floor(v)) return 'fas fa-star'
        if (n === Math.floor(v) + 1 && v % 1 >= 0.5) return 'fas fa-star-half-stroke'
        return 'far fa-star'
    }
    const v = Number(displayValue.value) || 0
    return n <= v ? 'fas fa-star' : 'far fa-star'
}

function onKeydown(e) {
    if (props.readonly) return
    const cur = Number(props.modelValue || 0)
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault()
        emit('update:modelValue', Math.min(cur + 1, props.max))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault()
        emit('update:modelValue', Math.max(cur - 1, 0))
    } else if (e.key === 'Home') {
        e.preventDefault()
        emit('update:modelValue', 0)
    } else if (e.key === 'End') {
        e.preventDefault()
        emit('update:modelValue', props.max)
    } else if (e.key === 'Enter' || e.key === ' ') {
        if (hover.value) {
            e.preventDefault()
            set(hover.value)
        }
    }
}
</script>

<style scoped>
.star-rating {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}
.star-btn {
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    line-height: 1;
}
.star-rating.readonly .star-btn {
    cursor: default;
}
.star-btn i {
    font-size: 1.15rem;
}
.size-sm .star-btn i {
    font-size: 0.95rem;
}
.size-lg .star-btn i {
    font-size: 1.35rem;
}

.star-btn i.fas.fa-star,
.star-btn i.fas.fa-star-half-stroke {
    color: #f59e0b;
}
.star-btn i.far.fa-star {
    color: #d1d5db;
}
.value {
    font-weight: 700;
    color: #374151;
}
</style>

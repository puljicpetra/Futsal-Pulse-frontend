<template>
    <div
        class="star-rating"
        :class="[`size-${size}`, { readonly }]"
        role="slider"
        :aria-valuemin="1"
        :aria-valuemax="max"
        :aria-valuenow="displayValue"
        :aria-label="ariaLabel"
        tabindex="0"
        @keydown="onKeydown"
    >
        <button
            v-for="n in max"
            :key="n"
            type="button"
            class="star-btn"
            :title="`${n} / ${max}`"
            :disabled="readonly"
            @mouseenter="hover = n"
            @mouseleave="hover = 0"
            @focus="hover = n"
            @blur="hover = 0"
            @click="set(n)"
        >
            <i :class="iconClass(n)"></i>
        </button>

        <span v-if="showValue" class="value">{{ displayValue.toFixed(1) }}</span>
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

const displayValue = computed(() => {
    return hover.value || props.modelValue || 0
})

function set(n) {
    if (props.readonly) return
    emit('update:modelValue', n)
}

function iconClass(n) {
    if (props.readonly && typeof props.modelValue === 'number') {
        const v = props.modelValue
        if (n <= Math.floor(v)) return 'fas fa-star'
        if (n === Math.floor(v) + 1 && v % 1 >= 0.5) return 'fas fa-star-half-alt'
        return 'far fa-star'
    }

    const v = displayValue.value
    return n <= v ? 'fas fa-star' : 'far fa-star'
}

function onKeydown(e) {
    if (props.readonly) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault()
        emit('update:modelValue', Math.min((props.modelValue || 0) + 1, props.max))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault()
        emit('update:modelValue', Math.max((props.modelValue || 0) - 1, 1))
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
.star-btn i.fas.fa-star-half-alt {
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

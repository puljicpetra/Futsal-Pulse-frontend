export function totalScore(m) {
    if (!m) return { a: '-', b: '-' }
    const regA = m?.score?.teamA ?? 0
    const regB = m?.score?.teamB ?? 0
    const otA = m?.overtime_score?.teamA ?? 0
    const otB = m?.overtime_score?.teamB ?? 0
    return { a: regA + otA, b: regB + otB }
}

export function resultSuffix(m) {
    if (!m) return ''

    const pens = m?.penalty_shootout
    if (pens && typeof pens.teamA_goals === 'number' && typeof pens.teamB_goals === 'number') {
        return `P ${pens.teamA_goals}–${pens.teamB_goals}`
    }
    if (m?.result_type === 'penalties') return 'P'

    const otA = m?.overtime_score?.teamA ?? 0
    const otB = m?.overtime_score?.teamB ?? 0
    const hasOTEvents = Array.isArray(m?.events) && m.events.some((e) => (e.minute ?? 0) > 40)
    if (m?.result_type === 'overtime' || otA + otB > 0 || hasOTEvents) {
        return 'AET'
    }

    return ''
}

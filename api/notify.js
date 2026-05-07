import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.VITE_TELEGRAM_CHAT_ID

// "HH:MM" 문자열을 분(minutes) 단위로 변환
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

// 한국 시간(UTC+9) 기준으로 날짜+시간 적용
function applyTime(date, timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(date)
  const year = d.getUTCFullYear()
  const month = d.getUTCMonth()
  const day = d.getUTCDate()
  return new Date(Date.UTC(year, month, day, h - 9, m, 0))
}

// 한국 시간 기준 요일 계산
function toWeekday(date) {
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  const d = kstDate.getUTCDay()
  return d === 0 ? 7 : d
}

// 다음 오픈일 계산
function getNextOpenDate(rule) {
  const { type, config } = rule
  const now = new Date()

  if (type === 'monthly_fixed') {
    const { days, open_time } = config
    let year = now.getFullYear()
    let month = now.getMonth()
    for (let i = 0; i < 13; i++) {
      for (const day of [...days].sort((a, b) => a - b)) {
        const openDate = applyTime(new Date(Date.UTC(year, month, day)), open_time)
        if (openDate > now) return openDate
      }
      month++
      if (month > 11) { month = 0; year++ }
    }
  }

  if (type === 'nth_weekday') {
    const { nth, weekday, open_time } = config
    let year = now.getFullYear()
    let month = now.getMonth()
    for (let i = 0; i < 13; i++) {
      let count = 0
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(Date.UTC(year, month, d))
        if (toWeekday(date) === weekday) {
          count++
          if (count === nth) {
            const openDate = applyTime(date, open_time)
            if (openDate > now) return openDate
            break
          }
        }
      }
      month++
      if (month > 11) { month = 0; year++ }
    }
  }

  if (type === 'weekly') {
    const { weekday, open_time } = config
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    for (let i = 0; i < 14; i++) {
      if (toWeekday(d) === weekday) {
        const openDate = applyTime(d, open_time)
        if (openDate > now) return openDate
      }
      d.setDate(d.getDate() + 1)
    }
  }

  if (type === 'daily_fixed') {
    const { open_time } = config
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    for (let i = 0; i < 3; i++) {
      const openDate = applyTime(d, open_time)
      if (openDate > now) return openDate
      d.setDate(d.getDate() + 1)
    }
  }

  return null
}

// 텔레그램 메시지 발송
async function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
  })
  return res.ok
}

// 알림 이미 보냈는지 확인
async function alreadySent(courseId, timingLabel, scheduledAt) {
  const start = new Date(scheduledAt.getTime() - 5 * 60 * 1000).toISOString()
  const end = new Date(scheduledAt.getTime() + 5 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('notifications')
    .select('id')
    .eq('course_id', courseId)
    .eq('timing_label', timingLabel)
    .gte('scheduled_at', start)
    .lte('scheduled_at', end)
    .eq('status', 'sent')
  return data && data.length > 0
}

// 알림 이력 저장
async function saveNotification(courseId, timingLabel, scheduledAt, status) {
  await supabase.from('notifications').insert({
    course_id: courseId,
    timing_label: timingLabel,
    scheduled_at: scheduledAt.toISOString(),
    status,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
  })
}

export default async function handler(req, res) {
  try {
    // 구장 + 규칙 가져오기
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*, rules(*)')
      .eq('is_active', true)

    if (error) throw error

    const now = new Date()
    const sent = []

    for (const course of courses) {
      const rule = course.rules?.[0]
      if (!rule) continue

      // 알림 꺼진 경우 스킵
      if (rule.notify_1h_before === false && rule.notify_10m_before === false) continue

      const nextOpen = getNextOpenDate(rule)
      if (!nextOpen) continue

      const eveningTime = rule.notify_evening || '20:00'

      // 하루 전 저녁 알림
      const dayBefore = new Date(nextOpen)
      dayBefore.setDate(dayBefore.getDate() - 1)
      const eveningNotify = applyTime(dayBefore, eveningTime)

      // 1시간 전 알림
      const oneHourBefore = new Date(nextOpen.getTime() - 60 * 60 * 1000)

      // 10분 전 알림
      const tenMinBefore = new Date(nextOpen.getTime() - 10 * 60 * 1000)

      const checks = [
        { time: eveningNotify, label: 'evening', enabled: true, text: `🌙 내일 예약 오픈 알림\n\n⛳ <b>${course.name}</b>\n📅 오픈 시각: ${new Date(nextOpen.getTime() + 9*60*60*1000).toLocaleString('ko-KR', {timeZone: 'UTC'})}` },
        { time: oneHourBefore, label: '1h_before', enabled: rule.notify_1h_before !== false, text: `⏰ 1시간 후 예약 오픈!\n\n⛳ <b>${course.name}</b>\n📅 오픈 시각: ${new Date(nextOpen.getTime() + 9*60*60*1000).toLocaleString('ko-KR', {timeZone: 'UTC'})}` },
        { time: tenMinBefore, label: '10m_before', enabled: rule.notify_10m_before !== false, text: `🚨 10분 후 예약 오픈!\n\n⛳ <b>${course.name}</b>\n📅 오픈 시각: ${new Date(nextOpen.getTime() + 9*60*60*1000).toLocaleString('ko-KR', {timeZone: 'UTC'})}` },
      ]

      for (const { time, label, enabled, text } of checks) {
        if (!enabled) continue
        const diff = Math.abs(now - time) / 1000 / 60 // 분 단위 차이
        if (diff > 10) continue // 10분 이내인 것만 발송

        const already = await alreadySent(course.id, label, time)
        if (already) continue

        const ok = await sendTelegram(text)
        await saveNotification(course.id, label, time, ok ? 'sent' : 'failed')
        if (ok) sent.push(`${course.name} - ${label}`)
      }
    }

    res.status(200).json({ ok: true, sent })
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, error: err.message })
  }
}

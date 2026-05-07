/**
 * 예약 규칙 엔진
 * 4가지 패턴의 다음 예약 오픈일을 계산한다.
 *
 * weekday 기준: 1=월 2=화 3=수 4=목 5=금 6=토 7=일
 */

// JS Date의 getDay()를 1(월)~7(일) 형식으로 변환 (한국 시간 기준)
function toWeekday(date) {
  // 한국 시간 기준 요일 계산
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  const d = kstDate.getUTCDay()
  return d === 0 ? 7 : d
}

// "HH:MM" 문자열을 분(minutes) 단위로 변환
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

// 한국 시간(UTC+9) 기준으로 날짜+시간 적용 (새 Date 반환)
function applyTime(date, timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  // 한국 시간 기준으로 UTC 변환 (UTC+9 = -9시간)
  const KST_OFFSET = 9 * 60 // 분 단위
  const d = new Date(date)
  // 해당 날짜의 한국 자정(UTC 기준 전날 15:00)을 기준으로 시간 적용
  const year = d.getFullYear()
  const month = d.getMonth()
  const day = d.getDate()
  // UTC로 한국 시간 표현: KST h:m = UTC h-9:m
  return new Date(Date.UTC(year, month, day, h - KST_OFFSET / 60, m, 0))
}

/**
 * 주어진 규칙(rule)에서 오늘 이후의 다음 예약 오픈 날짜 목록을 반환
 * @param {object} rule - rules 테이블의 규칙 row
 * @param {Date} from - 기준 날짜 (기본: 지금)
 * @param {number} count - 몇 개까지 반환할지 (기본: 3)
 * @returns {Date[]} 다음 오픈 시각 배열
 */
export function getNextOpenDates(rule, from = new Date(), count = 3) {
  const { type, config } = rule
  const results = []

  // 기준 시각 (현재 시각 기준으로 이미 지난 오픈은 제외)
  const now = from

  if (type === 'monthly_fixed') {
    // 매월 특정 날짜들
    // config: { days: [10, 25], open_time: "13:00" }
    const { days, open_time } = config
    let year = now.getFullYear()
    let month = now.getMonth()

    while (results.length < count) {
      for (const day of [...days].sort((a, b) => a - b)) {
        const candidate = new Date(Date.UTC(year, month, day))
        const openDate = applyTime(candidate, open_time)
        if (openDate > now) {
          results.push(openDate)
          if (results.length >= count) break
        }
      }
      month++
      if (month > 11) { month = 0; year++ }
      if (year > now.getFullYear() + 2) break // 무한루프 방지
    }

  } else if (type === 'nth_weekday') {
    // 매월 N번째 특정 요일
    // config: { nth: 2, weekday: 5, open_time: "10:00" }
    const { nth, weekday, open_time } = config
    let year = now.getFullYear()
    let month = now.getMonth()

    while (results.length < count) {
      // 해당 월의 nth번째 weekday 찾기
      let count_wd = 0
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(Date.UTC(year, month, d))
        if (toWeekday(date) === weekday) {
          count_wd++
          if (count_wd === nth) {
            const openDate = applyTime(date, open_time)
            if (openDate > now) results.push(openDate)
            break
          }
        }
      }
      month++
      if (month > 11) { month = 0; year++ }
      if (year > now.getFullYear() + 2) break
    }

  } else if (type === 'weekly') {
    // 매주 특정 요일
    // config: { weekday: 4, open_time: "09:00" }
    const { weekday, open_time } = config
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)

    while (results.length < count) {
      if (toWeekday(d) === weekday) {
        const openDate = applyTime(d, open_time)
        if (openDate > now) results.push(openDate)
      }
      d.setDate(d.getDate() + 1)
      if (d.getFullYear() > now.getFullYear() + 1) break
    }

  } else if (type === 'daily_fixed') {
    // 매일 특정 시간
    // config: { open_time: "10:00" }
    const { open_time } = config
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)

    while (results.length < count) {
      const openDate = applyTime(d, open_time)
      if (openDate > now) results.push(openDate)
      d.setDate(d.getDate() + 1)
      if (results.length >= count) break
    }
  }

  return results.slice(0, count)
}

/**
 * 다음 오픈일 하나만 반환 (홈화면 D-day 배너용)
 */
export function getNextOpenDate(rule, from = new Date()) {
  const dates = getNextOpenDates(rule, from, 1)
  return dates[0] || null
}

/**
 * D-day 텍스트 반환
 * 오늘: "오늘", 내일: "내일", 이후: "D-N"
 */
export function getDdayText(openDate, from = new Date()) {
  if (!openDate) return '-'
  // 한국 시간 기준으로 날짜 비교
  const kstOffset = 9 * 60 * 60 * 1000
  const today = new Date(from.getTime() + kstOffset)
  today.setUTCHours(0, 0, 0, 0)
  const target = new Date(openDate.getTime() + kstOffset)
  target.setUTCHours(0, 0, 0, 0)
  const diff = Math.round((target - today) / 86400000)

  if (diff === 0) return '오늘'
  if (diff === 1) return '내일'
  if (diff < 0) return '지남'
  return `D-${diff}`
}

/**
 * 알림 발송 시각 3개 계산
 * - 하루 전 저녁 (notify_evening, 기본 20:00)
 * - 오픈 1시간 전
 * - 오픈 10분 전
 */
export function getNotifyTimes(openDate, rule) {
  const evening = rule.notify_evening || '20:00'

  // 하루 전 저녁
  const dayBefore = new Date(openDate)
  dayBefore.setDate(dayBefore.getDate() - 1)
  const eveningNotify = applyTime(dayBefore, evening)

  // 1시간 전
  const oneHourBefore = new Date(openDate.getTime() - 60 * 60 * 1000)

  // 10분 전
  const tenMinBefore = new Date(openDate.getTime() - 10 * 60 * 1000)

  return {
    evening: eveningNotify,
    oneHour: oneHourBefore,
    tenMin: tenMinBefore,
  }
}

/**
 * 날짜를 한국어로 포맷
 * ex) "5월 10일 (토) 오후 1시"
 */
export function formatKoreanDate(date) {
  if (!date) return '-'
  // 한국 시간 기준으로 포맷
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  const month = kst.getUTCMonth() + 1
  const day = kst.getUTCDate()
  const dowNames = ['일', '월', '화', '수', '목', '금', '토']
  const dow = dowNames[kst.getUTCDay()]
  const h = kst.getUTCHours()
  const m = kst.getUTCMinutes()
  const ampm = h < 12 ? '오전' : '오후'
  const hour = h % 12 === 0 ? 12 : h % 12
  const minStr = m > 0 ? ` ${m}분` : ''
  return `${month}월 ${day}일 (${dow}) ${ampm} ${hour}시${minStr}`
}
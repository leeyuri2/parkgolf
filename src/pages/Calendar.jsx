import { useState } from 'react'
import { useCourses } from '../hooks/useCourses'
import { getNextOpenDates, getDdayText } from '../lib/ruleEngine'

const DOW_LABELS = ['월', '화', '수', '목', '금', '토', '일']
const COURSE_COLORS = [
  '#534AB7', '#0F6E56', '#854F0B', '#993556',
  '#1A6B8A', '#5C4033', '#2E7D32', '#6A1B9A',
  '#C62828', '#00695C',
]

function openReservation(url) {
  const isPWA = window.navigator.standalone === true
  if (isPWA) {
    window.location.href = url
  } else {
    window.open(url, '_blank')
  }
}

export default function Calendar({ onNavigate }) {
  const { courses } = useCourses()
  const today = new Date()

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState(null)

  // 경기장 + 색상 매핑
  const coursesWithColor = courses
    .filter(c => c.rules?.length > 0)
    .map((c, i) => ({ ...c, color: COURSE_COLORS[i % COURSE_COLORS.length] }))

  // 이번 달 전체 오픈 이벤트 계산
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)

  const eventMap = {} // { 'YYYY-MM-DD': [course, ...] }
  coursesWithColor.forEach(course => {
    const rule = course.rules[0]
    // 이번 달 범위에서 오픈일 계산 (최대 60개)
    const openDates = getNextOpenDates(rule, new Date(year, month, 1, 0, 0, 0), 60)
    openDates.forEach(d => {
      if (d > lastOfMonth) return
      const key = d.toDateString()
      if (!eventMap[key]) eventMap[key] = []
      eventMap[key].push({ ...course, openDate: d })
    })
  })

  // 달력 그리드
  const firstDow = firstOfMonth.getDay() // 0=일
  const startOffset = firstDow === 0 ? 6 : firstDow - 1
  const daysInMonth = lastOfMonth.getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const cells = []
  // 이전 달 빈칸
  for (let i = 0; i < startOffset; i++) {
    cells.push({ day: prevMonthDays - startOffset + 1 + i, type: 'prev' })
  }
  // 이번 달
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, type: 'current' })
  }
  // 다음 달 빈칸
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, type: 'next' })
  }

  // 선택된 날짜의 이벤트
  const selectedEvents = selectedDay
    ? (eventMap[new Date(year, month, selectedDay).toDateString()] || [])
    : []

  // 이번 달 전체 이벤트 (리스트용, 날짜순)
  const now = new Date()
    const allMonthEvents = Object.entries(eventMap)
    .flatMap(([, evs]) => evs)
    .filter(ev => ev.openDate >= now)
    .sort((a, b) => a.openDate - b.openDate)

  const displayEvents = selectedDay ? selectedEvents : allMonthEvents

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  const todayStr = today.toDateString()

  return (
    <div className="px-4 pb-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between py-4 mb-2">
        <button
          onClick={prevMonth}
          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 text-lg"
        >
          ‹
        </button>
        <h1 className="text-base font-medium text-gray-900">
          {year}년 {month + 1}월
        </h1>
        <button
          onClick={nextMonth}
          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 text-lg"
        >
          ›
        </button>
      </div>

      {/* 달력 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm mb-4">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-1">
          {DOW_LABELS.map(d => (
            <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (cell.type !== 'current') {
              return (
                <div key={i} className="aspect-square flex items-center justify-center">
                  <span className="text-xs text-gray-300">{cell.day}</span>
                </div>
              )
            }

            const dateObj = new Date(year, month, cell.day)
            const key = dateObj.toDateString()
            const events = eventMap[key] || []
            const isToday = key === todayStr
            const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate())
            const isSelected = selectedDay === cell.day

            return (
              <div
                key={i}
                onClick={() => setSelectedDay(isSelected ? null : cell.day)}
                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer gap-0.5
                  ${isToday ? 'bg-indigo-100' : events.length > 0 ? 'bg-emerald-50' : 'bg-gray-50'}
                  ${isPast && !isToday ? 'opacity-40' : ''}
                  ${isSelected ? 'ring-2 ring-indigo-400' : ''}
                `}
              >
                <span className={`text-xs font-medium
                  ${isToday ? 'text-indigo-700' : events.length > 0 ? 'text-emerald-800' : 'text-gray-500'}
                `}>
                  {cell.day}
                </span>
                {events.length > 0 && (
                  <div className="flex gap-0.5">
                    {events.slice(0, 3).map((ev, j) => (
                      <div
                        key={j}
                        className="w-1 h-1 rounded-full"
                        style={{ background: ev.color }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 이벤트 리스트 */}
      <div className="text-xs text-gray-400 font-medium mb-2">
        {selectedDay ? `${month + 1}월 ${selectedDay}일 예약 오픈` : `${month + 1}월 남은 예약`}      </div>

      {displayEvents.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          {selectedDay ? '이 날은 예약 오픈이 없어' : '이번 달 예약 오픈이 없어'}
        </div>
      )}

      {displayEvents.map((ev, i) => {
        const d = ev.openDate
        const month2 = d.getMonth() + 1
        const day2 = d.getDate()
        const h = d.getHours()
        const m = d.getMinutes()
        const ampm = h < 12 ? '오전' : '오후'
        const hour = h % 12 === 0 ? 12 : h % 12
        const timeStr = `${ampm} ${hour}시${m > 0 ? ` ${m}분` : ''}`
        const ddayText = getDdayText(d)
        const ddayColor = ddayText === '오늘' || ddayText === '내일' ? '#E24B4A' : ev.color

        return (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-2xl px-4 py-3 mb-2 flex items-center gap-3 shadow-sm cursor-pointer"
            onClick={() => onNavigate('detail', { course: ev, color: ev.color })}
          >
            <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: ev.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{ev.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{month2}월 {day2}일 · {timeStr} 오픈</div>
            </div>
            <div className="text-sm font-medium flex-shrink-0" style={{ color: ddayColor }}>
              {ddayText}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); openReservation(ev.url) }}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ background: ev.color + '20', color: ev.color }}
            >
              예약
            </button>
          </div>
        )
      })}
    </div>
  )
}

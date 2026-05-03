import { getNextOpenDates } from '../lib/ruleEngine'

const DOW_LABELS = ['월', '화', '수', '목', '금', '토', '일']

export default function WeekCalendar({ courses }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 이번 주 월요일 구하기
  const dayOfWeek = today.getDay() // 0=일, 1=월 ...
  const monday = new Date(today)
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  monday.setDate(today.getDate() + offset)

  // 14일치 날짜 배열
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  // 각 날짜에 어떤 경기장 오픈인지 매핑
  const eventMap = {}
  courses.forEach(course => {
    if (!course.rule) return
    const openDates = getNextOpenDates(course.rule, today, 10)
    openDates.forEach(openDate => {
      const key = openDate.toDateString()
      if (!eventMap[key]) eventMap[key] = []
      eventMap[key].push(course)
    })
  })

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {DOW_LABELS.map(d => (
          <div
            key={d}
            className="text-center text-xs text-gray-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 2줄 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const key = day.toDateString()
          const events = eventMap[key] || []
          const isToday = day.getTime() === today.getTime()
          const isPast = day < today

          return (
            <div
              key={i}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center
                ${isToday ? 'bg-indigo-100' : events.length > 0 ? 'bg-emerald-50' : 'bg-gray-50'}
                ${isPast ? 'opacity-40' : ''}
              `}
            >
              <span
                className={`text-xs font-medium
                  ${isToday ? 'text-indigo-700' : events.length > 0 ? 'text-emerald-800' : 'text-gray-500'}
                `}
              >
                {day.getDate()}
              </span>

              {/* 경기장 색상 도트 */}
              {events.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {events.slice(0, 3).map((c, j) => (
                    <div
                      key={j}
                      className="w-1 h-1 rounded-full"
                      style={{ background: c.color }}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

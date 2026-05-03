import { useCourses } from '../hooks/useCourses'
import { getNextOpenDate, getDdayText } from '../lib/ruleEngine'

const COURSE_COLORS = [
  '#534AB7', '#0F6E56', '#854F0B', '#993556',
  '#1A6B8A', '#5C4033', '#2E7D32', '#6A1B9A',
  '#C62828', '#00695C',
]

function getRuleLabel(rule) {
  if (!rule) return ''
  const { type, config } = rule
  if (type === 'monthly_fixed') return `매월 ${config.days.join('·')}일 ${config.open_time}`
  if (type === 'nth_weekday') {
    const nth = ['','첫','둘째','셋째','넷째'][config.nth] || `${config.nth}번째`
    const wd = ['','월','화','수','목','금','토','일'][config.weekday]
    return `매월 ${nth} ${wd}요일 ${config.open_time}`
  }
  if (type === 'weekly') {
    const wd = ['','월','화','수','목','금','토','일'][config.weekday]
    return `매주 ${wd}요일 ${config.open_time}`
  }
  if (type === 'daily_fixed') return `매일 ${config.open_time}`
  return ''
}

export default function Courses({ onNavigate }) {
  const { courses, loading } = useCourses()

  const coursesWithColor = courses
    .filter(c => c.rules?.length > 0)
    .map((c, i) => ({ ...c, color: COURSE_COLORS[i % COURSE_COLORS.length] }))
    .map(c => ({ ...c, _nextOpen: getNextOpenDate(c.rules[0]) }))
    .sort((a, b) => {
      if (!a._nextOpen) return 1
      if (!b._nextOpen) return -1
      return a._nextOpen - b._nextOpen
    })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400 text-sm">불러오는 중...</div>
    </div>
  )

  return (
    <div className="px-4 pb-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between py-4 mb-2">
        <h1 className="text-lg font-medium text-gray-900">구장</h1>
        <button
          onClick={() => onNavigate('add')}
          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500"
        >
          +
        </button>
      </div>

      {/* 경기장 없을 때 */}
      {coursesWithColor.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">⛳</div>
          <div className="text-gray-500 text-sm mb-4">등록된 구장이 없어</div>
          <button
            onClick={() => onNavigate('add')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
          >
            첫 구장 추가하기
          </button>
        </div>
      )}

      {/* 구장 리스트 */}
      <div className="space-y-2">
        {coursesWithColor.map(course => {
          const rule = course.rules[0]
          const nextOpen = getNextOpenDate(rule)
          const ddayText = getDdayText(nextOpen)
          const ddayColor = ddayText === '오늘' || ddayText === '내일' ? '#E24B4A' : course.color
          const month = nextOpen ? nextOpen.getMonth() + 1 : null
          const day = nextOpen ? nextOpen.getDate() : null

          return (
            <div
              key={course.id}
              className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm cursor-pointer"
              onClick={() => onNavigate('detail', { course, color: course.color })}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: course.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{course.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{getRuleLabel(rule)}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-medium" style={{ color: ddayColor }}>{ddayText}</div>
                {month && day && (
                  <div className="text-xs text-gray-400">{month}월 {day}일</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 추가 버튼 */}
      {coursesWithColor.length > 0 && (
        <button
          onClick={() => onNavigate('add')}
          className="w-full mt-3 py-3 border border-dashed border-gray-300 rounded-2xl text-sm text-gray-400"
        >
          + 구장 추가
        </button>
      )}
    </div>
  )
}

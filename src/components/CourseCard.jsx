import { getDdayText, formatKoreanDate } from '../lib/ruleEngine'

export default function CourseCard({ course, onOpen, onEdit }) {
  const { rule, nextOpen, color } = course
  const ddayText = getDdayText(nextOpen)
  const ddayColor =
    ddayText === '오늘' || ddayText === '내일' ? '#E24B4A' : color

  const month = nextOpen ? nextOpen.getMonth() + 1 : null
  const day = nextOpen ? nextOpen.getDate() : null

  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl px-4 py-3 mb-2 flex items-center gap-3 shadow-sm"
      onClick={onEdit}
    >
      {/* 색상 도트 */}
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: color }}
      />

      {/* 경기장 정보 */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {course.name}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {getRuleLabel(rule)}
        </div>
      </div>

      {/* D-day */}
      <div className="text-right flex-shrink-0">
        <div className="text-base font-medium" style={{ color: ddayColor }}>
          {ddayText}
        </div>
        {month && day && (
          <div className="text-xs text-gray-400">
            {month}월 {day}일
          </div>
        )}
      </div>

      {/* 바로가기 버튼 */}
      <button
        onClick={e => {
          e.stopPropagation()
          onOpen()
        }}
        className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium"
        style={{ background: color + '20', color }}
      >
        예약
      </button>
    </div>
  )
}

function getRuleLabel(rule) {
  if (!rule) return ''
  const { type, config } = rule
  if (type === 'monthly_fixed') {
    return `매월 ${config.days.join('·')}일 ${config.open_time} 오픈`
  } else if (type === 'nth_weekday') {
    const nth = ['', '첫', '둘째', '셋째', '넷째', '다섯째'][config.nth] || `${config.nth}번째`
    const wd = ['', '월', '화', '수', '목', '금', '토', '일'][config.weekday]
    return `매월 ${nth} ${wd}요일 ${config.open_time} 오픈`
  } else if (type === 'weekly') {
    const wd = ['', '월', '화', '수', '목', '금', '토', '일'][config.weekday]
    return `매주 ${wd}요일 ${config.open_time} 오픈`
  } else if (type === 'daily_fixed') {
    return `매일 ${config.open_time} 오픈`
  }
  return ''
}

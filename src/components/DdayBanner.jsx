import { getNextOpenDate, getDdayText, formatKoreanDate, getNotifyTimes } from '../lib/ruleEngine'

export default function DdayBanner({ course, onOpen }) {
  const { rule, nextOpen, color } = course

  if (!rule) return null

  const ddayText = getDdayText(nextOpen)
  const openDateStr = formatKoreanDate(nextOpen)
  const notifyTimes = nextOpen && rule ? getNotifyTimes(nextOpen, rule) : null

  function formatTime(date) {
    if (!date) return ''
    const h = date.getHours()
    const m = date.getMinutes()
    const ampm = h < 12 ? '오전' : '오후'
    const hour = h % 12 === 0 ? 12 : h % 12
    const minStr = m > 0 ? ` ${m}분` : ''
    return `${ampm} ${hour}시${minStr}`
  }

  const ddayNum = ddayText.startsWith('D-')
    ? parseInt(ddayText.replace('D-', ''))
    : null

  const ddayColor =
    ddayText === '오늘' || ddayText === '내일' ? '#E24B4A' : color

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      {/* 상단: 경기장 이름 + 규칙 배지 */}
      <div className="flex justify-between items-start mb-3">
        <div className="font-medium text-gray-900 text-sm">{course.name}</div>
        <div
          className="text-xs rounded-full px-3 py-1"
          style={{ background: color + '20', color }}
        >
          {getRuleLabel(rule)}
        </div>
      </div>

      {/* D-day 숫자 */}
      <div
        className="text-4xl font-medium leading-none mb-1"
        style={{ color: ddayColor }}
      >
        {ddayText}
      </div>
      <div className="text-xs text-gray-500 mt-1">{openDateStr} 오픈</div>

      {/* 알림 예정 */}
      {notifyTimes && (() => {
        const labels = [
          rule.notify_1h_before !== false && `오픈 1시간 전`,
          rule.notify_10m_before !== false && `오픈 10분 전`,
        ].filter(Boolean)
        if (labels.length === 0) return null
        return (
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
            알림 예정: {labels.join(' · ')}
          </div>
        )
      })()}

      {/* 바로가기 버튼 */}
      <button
        onClick={onOpen}
        className="w-full mt-3 py-2 rounded-xl text-sm font-medium"
        style={{ background: color + '20', color }}
      >
        예약 사이트 바로 가기 →
      </button>
    </div>
  )
}

function getRuleLabel(rule) {
  if (!rule) return ''
  const { type, config } = rule
  if (type === 'monthly_fixed') {
    return `매월 ${config.days.join('·')}일`
  } else if (type === 'nth_weekday') {
    const nth = ['', '첫', '둘째', '셋째', '넷째', '다섯째'][config.nth] || `${config.nth}번째`
    const wd = ['', '월', '화', '수', '목', '금', '토', '일'][config.weekday]
    return `매월 ${nth} ${wd}요일`
  } else if (type === 'weekly') {
    const wd = ['', '월', '화', '수', '목', '금', '토', '일'][config.weekday]
    return `매주 ${wd}요일`
  } else if (type === 'daily_fixed') {
    return `매일 ${config.open_time}`
  }
  return ''
}

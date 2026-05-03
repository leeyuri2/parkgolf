import { getNextOpenDate, getDdayText, formatKoreanDate } from '../lib/ruleEngine'

const RULE_TYPE_LABELS = {
  monthly_fixed: '매월 특정 날짜',
  nth_weekday: '매월 N번째 요일',
  weekly: '매주 특정 요일',
  daily_fixed: '매일 특정 시간',
}

function getRuleDetail(rule) {
  if (!rule) return '-'
  const { type, config } = rule
  if (type === 'monthly_fixed') {
    return `매월 ${config.days.join('일, ')}일 ${config.open_time} 오픈`
  }
  if (type === 'nth_weekday') {
    const nth = ['', '첫째', '둘째', '셋째', '넷째'][config.nth] || `${config.nth}번째`
    const wd = ['', '월', '화', '수', '목', '금', '토', '일'][config.weekday]
    return `매월 ${nth} ${wd}요일 ${config.open_time} 오픈`
  }
  if (type === 'weekly') {
    const wd = ['', '월', '화', '수', '목', '금', '토', '일'][config.weekday]
    return `매주 ${wd}요일 ${config.open_time} 오픈`
  }
  if (type === 'daily_fixed') {
    return `매일 ${config.open_time} 오픈`
  }
  return '-'
}

function openReservation(url) {
  const isPWA = window.navigator.standalone === true
  if (isPWA) { window.location.href = url }
  else { window.open(url, '_blank') }
}

export default function CourseDetail({ course, color, onBack, onEdit }) {
  const rule = course.rules?.[0]
  const nextOpen = rule ? getNextOpenDate(rule) : null
  const ddayText = getDdayText(nextOpen)
  const openDateStr = formatKoreanDate(nextOpen)
  const ddayColor = ddayText === '오늘' || ddayText === '내일' ? '#E24B4A' : color

  return (
    <div className="px-4 pb-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between py-4 mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 text-lg"
          >
            ‹
          </button>
          <h1 className="text-lg font-medium text-gray-900">{course.name}</h1>
        </div>
        <button
          onClick={onEdit}
          className="text-sm px-3 py-1.5 rounded-full border border-gray-200 text-gray-500"
        >
          수정
        </button>
      </div>

      {/* D-day 카드 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4">
        <div className="text-xs text-gray-400 mb-2">다음 예약 오픈</div>
        <div className="text-4xl font-medium mb-1" style={{ color: ddayColor }}>
          {ddayText}
        </div>
        <div className="text-sm text-gray-500">{openDateStr}</div>

        {/* 알림 예정 */}
        {rule && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
            알림 예정: 하루 전 저녁 · 오픈 1시간 전 · 오픈 10분 전
          </div>
        )}

        {/* 예약 바로가기 */}
        <button
          onClick={() => openReservation(course.url)}
          className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: color + '20', color }}
        >
          예약 사이트 바로 가기 →
        </button>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4">
        <div className="text-xs text-gray-400 font-medium mb-3">기본 정보</div>

        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">예약 사이트 URL</div>
          <div
            className="text-sm text-indigo-600 break-all cursor-pointer"
            onClick={() => openReservation(course.url)}
          >
            {course.url}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-1">예약 규칙</div>
          <div className="text-sm text-gray-700">{getRuleDetail(rule)}</div>
        </div>
      </div>

      {/* 메모 */}
      {course.memo && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4">
          <div className="text-xs text-gray-400 font-medium mb-2">메모</div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {course.memo}
          </div>
        </div>
      )}

      {/* 수정 버튼 (하단) */}
      <button
        onClick={onEdit}
        className="w-full py-3.5 border border-gray-200 rounded-2xl text-sm text-gray-600 font-medium"
      >
        경기장 정보 수정
      </button>
    </div>
  )
}

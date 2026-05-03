import { useState } from 'react'
import { useCourses } from '../hooks/useCourses'

const RULE_TYPES = [
  { value: 'monthly_fixed', label: '매월 특정 날짜' },
  { value: 'nth_weekday',   label: '매월 N번째 요일' },
  { value: 'weekly',        label: '매주 특정 요일' },
  { value: 'daily_fixed',   label: '매일 특정 시간' },
]

const WEEKDAYS = [
  { value: 1, label: '월요일' },
  { value: 2, label: '화요일' },
  { value: 3, label: '수요일' },
  { value: 4, label: '목요일' },
  { value: 5, label: '금요일' },
  { value: 6, label: '토요일' },
  { value: 7, label: '일요일' },
]

const NTH_OPTIONS = [
  { value: 1, label: '첫째' },
  { value: 2, label: '둘째' },
  { value: 3, label: '셋째' },
  { value: 4, label: '넷째' },
]

export default function CourseForm({ course, onBack }) {
  const isEdit = !!course
  const { addCourse, updateCourse, deleteCourse } = useCourses()

  // 경기장 기본 정보
  const [name, setName] = useState(course?.name || '')
  const [url, setUrl] = useState(course?.url || '')
  const [memo, setMemo] = useState(course?.memo || '')

  // 예약 규칙
  const existingRule = course?.rules?.[0]
  const [ruleType, setRuleType] = useState(existingRule?.type || 'monthly_fixed')

  // monthly_fixed
  const [monthlyDays, setMonthlyDays] = useState(
    existingRule?.config?.days?.join(', ') || ''
  )
  const [monthlyTime, setMonthlyTime] = useState(
    existingRule?.config?.open_time || '10:00'
  )

  // nth_weekday
  const [nth, setNth] = useState(existingRule?.config?.nth || 2)
  const [nthWeekday, setNthWeekday] = useState(existingRule?.config?.weekday || 5)
  const [nthTime, setNthTime] = useState(existingRule?.config?.open_time || '10:00')

  // weekly
  const [weeklyWeekday, setWeeklyWeekday] = useState(existingRule?.config?.weekday || 4)
  const [weeklyTime, setWeeklyTime] = useState(existingRule?.config?.open_time || '10:00')

  // daily_fixed
  const [dailyTime, setDailyTime] = useState(existingRule?.config?.open_time || '10:00')

  // 알림 시간
  const [notifyEvening, setNotifyEvening] = useState(
    existingRule?.notify_evening && existingRule.notify_evening !== false
      ? existingRule.notify_evening.slice(0, 5)
      : '20:00'
  )

  const [notifyEnabled, setNotifyEnabled] = useState(
    existingRule?.notify_1h_before !== false
  )
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  function buildConfig() {
    if (ruleType === 'monthly_fixed') {
      const days = monthlyDays
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n) && n >= 1 && n <= 31)
      return { days, open_time: monthlyTime }
    }
    if (ruleType === 'nth_weekday') {
      return { nth: Number(nth), weekday: Number(nthWeekday), open_time: nthTime }
    }
    if (ruleType === 'weekly') {
      return { weekday: Number(weeklyWeekday), open_time: weeklyTime }
    }
    if (ruleType === 'daily_fixed') {
      return { open_time: dailyTime }
    }
  }

  function validate() {
    if (!name.trim()) return '경기장 이름을 입력해줘'
    if (!url.trim()) return 'URL을 입력해줘'
    if (!url.startsWith('http')) return 'URL은 http:// 또는 https://로 시작해야 해'
    if (ruleType === 'monthly_fixed') {
      const days = monthlyDays.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
      if (days.length === 0) return '날짜를 입력해줘 (예: 10, 25)'
    }
    return ''
  }

  async function handleSave() {
    const err = validate()
    if (err) { setError(err); return }

    setSaving(true)
    setError('')

    const courseData = { name: name.trim(), url: url.trim(), memo: memo.trim() }
    const ruleData = {
      type: ruleType,
      config: buildConfig(),
      notify_evening: notifyEnabled ? notifyEvening : '20:00',
      notify_1h_before: notifyEnabled,
      notify_10m_before: notifyEnabled,
    }

    const result = isEdit
      ? await updateCourse(course.id, courseData, ruleData)
      : await addCourse(courseData, ruleData)

    setSaving(false)

    if (result.success) {
      onBack()
    } else {
      setError(result.error || '저장 실패')
    }
  }

  async function handleDelete() {
    if (!window.confirm(`"${course.name}"을 삭제할까요?`)) return
    setDeleting(true)
    await deleteCourse(course.id)
    setDeleting(false)
    onBack()
  }

  return (
    <div className="px-4 pb-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 py-4 mb-2">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 text-lg"
        >
          ‹
        </button>
        <h1 className="text-lg font-medium text-gray-900">
          {isEdit ? '경기장 편집' : '경기장 추가'}
        </h1>
      </div>

      {/* 에러 */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 섹션: 기본 정보 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm">
        <div className="text-xs text-gray-400 font-medium mb-3">기본 정보</div>

        <label className="block mb-3">
          <span className="text-sm text-gray-600 mb-1 block">경기장 이름</span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="예: A 파크골프장"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400"
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm text-gray-600 mb-1 block">예약 사이트 URL</span>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400"
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-600 mb-1 block">메모 (선택)</span>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="예: 10일 예약 → 익월 1~15일 / 25일 예약 → 익월 16~31일"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 resize-none"
          />
        </label>
      </div>

      {/* 섹션: 예약 규칙 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm">
        <div className="text-xs text-gray-400 font-medium mb-3">예약 오픈 규칙</div>

        {/* 규칙 타입 선택 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {RULE_TYPES.map(rt => (
            <button
              key={rt.value}
              onClick={() => setRuleType(rt.value)}
              className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors ${
                ruleType === rt.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              {rt.label}
            </button>
          ))}
        </div>

        {/* monthly_fixed */}
        {ruleType === 'monthly_fixed' && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm text-gray-600 mb-1 block">오픈 날짜 (쉼표로 구분)</span>
              <input
                type="text"
                value={monthlyDays}
                onChange={e => setMonthlyDays(e.target.value)}
                placeholder="예: 10, 25"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600 mb-1 block">오픈 시간</span>
              <input
                type="time"
                value={monthlyTime}
                onChange={e => setMonthlyTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400"
              />
            </label>
          </div>
        )}

        {/* nth_weekday */}
        {ruleType === 'nth_weekday' && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm text-gray-600 mb-1 block">몇 번째</span>
              <select
                value={nth}
                onChange={e => setNth(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 bg-white"
              >
                {NTH_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-gray-600 mb-1 block">요일</span>
              <select
                value={nthWeekday}
                onChange={e => setNthWeekday(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 bg-white"
              >
                {WEEKDAYS.map(w => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-gray-600 mb-1 block">오픈 시간</span>
              <input
                type="time"
                value={nthTime}
                onChange={e => setNthTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400"
              />
            </label>
          </div>
        )}

        {/* weekly */}
        {ruleType === 'weekly' && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm text-gray-600 mb-1 block">요일</span>
              <select
                value={weeklyWeekday}
                onChange={e => setWeeklyWeekday(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 bg-white"
              >
                {WEEKDAYS.map(w => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-gray-600 mb-1 block">오픈 시간</span>
              <input
                type="time"
                value={weeklyTime}
                onChange={e => setWeeklyTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400"
              />
            </label>
          </div>
        )}

        {/* daily_fixed */}
        {ruleType === 'daily_fixed' && (
          <label className="block">
            <span className="text-sm text-gray-600 mb-1 block">오픈 시간</span>
            <input
              type="time"
              value={dailyTime}
              onChange={e => setDailyTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400"
            />
          </label>
        )}
      </div>

      {/* 섹션: 알림 설정 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-gray-400 font-medium">알림 설정</div>
          <button
            onClick={() => setNotifyEnabled(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              notifyEnabled ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                notifyEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {notifyEnabled ? (
          <>
            <div className="text-xs text-gray-500 mb-3">하루 전 저녁 알림 시각</div>
            <input
              type="time"
              value={notifyEvening}
              onChange={e => setNotifyEvening(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400"
            />
            <div className="mt-3 text-xs text-gray-400">
              오픈 1시간 전 · 10분 전 알림은 자동 적용돼
            </div>
          </>
        ) : (
          <div className="text-xs text-gray-400">이 경기장은 알림을 받지 않아</div>
        )}
      </div>

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-medium disabled:opacity-50"
      >
        {saving ? '저장 중...' : isEdit ? '수정 완료' : '경기장 추가'}
      </button>

      {/* 삭제 버튼 (편집 모드만) */}
      {isEdit && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-full mt-3 py-3 text-red-400 text-sm disabled:opacity-50"
        >
          {deleting ? '삭제 중...' : '이 경기장 삭제'}
        </button>
      )}
    </div>
  )
}

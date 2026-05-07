import { useState, useEffect } from 'react'

const MAX_MEMBERS = 8
const STORAGE_KEY = 'golf_party_members'

function loadMembers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return [
    { name: '김금옥', phone: '01053475250' },
    { name: '김미애', phone: '01050490521' },
    { name: '심원보', phone: '01088607459' },
    { name: '장정인', phone: '01034587170' },
  ]
}

export default function Party() {
  const [members, setMembers] = useState(loadMembers)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members))
  }, [members])

  function updateMember(i, field, value) {
    setMembers(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

  async function copyText(text, key) {
    if (!text.trim()) return
    try {
      await navigator.clipboard.writeText(text.trim())
    } catch {
      const el = document.createElement('textarea')
      el.value = text.trim()
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  function addMember() {
    if (members.length >= MAX_MEMBERS) return
    setMembers(prev => [...prev, { name: '', phone: '' }])
  }

  function removeMember(i) {
    if (members.length <= 1) return
    setMembers(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div className="px-4 pb-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between py-4 mb-1">
        <h1 className="text-lg font-medium text-gray-900">일행</h1>
        <button
          onClick={addMember}
          disabled={members.length >= MAX_MEMBERS}
          className="text-sm px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 disabled:opacity-30"
        >
          + 추가
        </button>
      </div>
      <div className="text-xs text-gray-400 mb-4">
        복사 버튼으로 예약 폼에 바로 붙여넣기
      </div>

      {/* 일행 목록 */}
      <div className="space-y-2">
        {members.map((member, i) => (
          <div key={i} className="flex items-center gap-1.5">

            {/* 삭제 버튼 */}
            <button
              onClick={() => removeMember(i)}
              disabled={members.length <= 1}
              className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs disabled:opacity-20"
            >
              ✕
            </button>

            {/* 이름 */}
            <input
              type="text"
              value={member.name}
              onChange={e => updateMember(i, 'name', e.target.value)}
              placeholder="이름"
              className="w-16 flex-shrink-0 px-2 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 text-center"
            />
            <button
              onClick={() => copyText(member.name, `name-${i}`)}
              disabled={!member.name.trim()}
              className={`flex-shrink-0 px-2 py-2 rounded-xl text-xs font-medium transition-colors ${
                copied === `name-${i}`
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-gray-100 text-gray-400 disabled:opacity-30'
              }`}
            >
              {copied === `name-${i}` ? '✓' : '복사'}
            </button>

            {/* 전화번호 */}
            <input
              type="tel"
              inputMode="numeric"
              value={member.phone}
              onChange={e => updateMember(i, 'phone', e.target.value.replace(/\D/g, ''))}
              placeholder="전화번호"
              className="w-0 flex-1 px-2 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400"
            />
            <button
              onClick={() => copyText(member.phone, `phone-${i}`)}
              disabled={!member.phone.trim()}
              className={`flex-shrink-0 px-2 py-2 rounded-xl text-xs font-medium transition-colors ${
                copied === `phone-${i}`
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-gray-100 text-gray-400 disabled:opacity-30'
              }`}
            >
              {copied === `phone-${i}` ? '✓' : '복사'}
            </button>

          </div>
        ))}
      </div>

      {members.length < MAX_MEMBERS && (
        <button
          onClick={addMember}
          className="w-full mt-4 py-3 border border-dashed border-gray-300 rounded-2xl text-sm text-gray-400"
        >
          + 일행 추가
        </button>
      )}

      <div className="mt-4 text-xs text-gray-300 text-center">
        입력한 정보는 이 기기에만 저장돼
      </div>
    </div>
  )
}

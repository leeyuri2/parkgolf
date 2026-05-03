import { useState } from 'react'
import Home from './pages/Home'
import CourseForm from './pages/CourseForm'
import CourseDetail from './pages/CourseDetail'
import Courses from './pages/Courses'
import Party from './pages/Party'

function HomeIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={active ? '#534AB7' : '#9ca3af'} strokeWidth="1.5">
      <path d="M3 10L10 3l7 7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 8v8h4v-4h2v4h4V8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CalendarIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={active ? '#534AB7' : '#9ca3af'} strokeWidth="1.5">
      <rect x="3" y="4" width="14" height="13" rx="2"/>
      <path d="M3 8h14M7 3v2M13 3v2" strokeLinecap="round"/>
    </svg>
  )
}

function PartyIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={active ? '#534AB7' : '#9ca3af'} strokeWidth="1.5">
      <circle cx="8" cy="6" r="2.5"/>
      <path d="M3 16c0-3 2-5 5-5h1" strokeLinecap="round"/>
      <circle cx="14" cy="11" r="2"/>
      <path d="M11 17c0-2 1.5-3 3-3s3 1 3 3" strokeLinecap="round"/>
    </svg>
  )
}

function SettingsIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={active ? '#534AB7' : '#9ca3af'} strokeWidth="1.5">
      <circle cx="10" cy="10" r="2.5"/>
      <path d="M10 3v1.5M10 15.5V17M3 10h1.5M15.5 10H17M5.1 5.1l1.1 1.1M13.8 13.8l1.1 1.1M5.1 14.9l1.1-1.1M13.8 6.2l1.1-1.1" strokeLinecap="round"/>
    </svg>
  )
}

const NAV_ITEMS = [
  { key: 'home', label: '홈', Icon: HomeIcon },
  { key: 'calendar', label: '구장', Icon: CalendarIcon },
  { key: 'notifications', label: '일행', Icon: PartyIcon },
  { key: 'settings', label: '설정', Icon: SettingsIcon },
]

export default function App() {
  const [tab, setTab] = useState('home')
  const [modal, setModal] = useState(null)

  function handleNavigate(type, data) {
    setModal({ type, data })
  }

  function handleBack() {
    setModal(null)
  }

  if (modal) {
    if (modal.type === 'detail') {
      return (
        <div className="min-h-screen bg-gray-50 overflow-y-auto">
          <CourseDetail
            course={modal.data.course}
            color={modal.data.color}
            onBack={handleBack}
            onEdit={() => setModal({ type: 'edit', data: modal.data.course })}
          />
        </div>
      )
    }
    return (
      <div className="min-h-screen bg-gray-50 overflow-y-auto">
        <CourseForm
          course={modal.type === 'edit' ? modal.data : null}
          onBack={handleBack}
        />
      </div>
    )
  }

  function renderTab() {
    switch (tab) {
      case 'home':
        return <Home onNavigate={handleNavigate} />
      case 'calendar':
        return <Courses onNavigate={handleNavigate} />
      case 'notifications':
        return <Party />
      case 'settings':
        return (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            설정 화면엔 무엇을 넣어야 할까?
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-y-auto pb-20">
        {renderTab()}
      </div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 flex justify-around px-2 py-2 z-50">
        {NAV_ITEMS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex flex-col items-center gap-1 px-4 py-1"
          >
            <Icon active={tab === key} />
            <span className="text-xs" style={{ color: tab === key ? '#534AB7' : '#9ca3af' }}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

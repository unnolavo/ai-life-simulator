import { useEffect, useRef } from 'react'

export default function EventLog({ events }) {
  const bodyRef = useRef(null)

  useEffect(() => {
    if (!bodyRef.current) return
    bodyRef.current.scrollTop = 0
  }, [events])

  return (
    <section className="panel log-panel">
      <h3>Live Events</h3>
      <div className="log-body" ref={bodyRef}>
        {events.length === 0 ? <p className="empty">Waiting for interactions...</p> : null}
        {events.map((event) => (
          <p key={event.id} className="log-line">{event.text}</p>
        ))}
      </div>
    </section>
  )
}

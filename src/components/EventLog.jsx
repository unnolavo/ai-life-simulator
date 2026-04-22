import { useEffect, useRef } from 'react';

function timeLabel(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function EventLog({ events }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollTop = 0;
  }, [events]);

  return (
    <section className="panel event-log">
      <h3>Live Event Log</h3>
      <div className="event-log-list" ref={ref}>
        {events.length === 0 ? (
          <p className="empty-text">Events will appear as agents interact.</p>
        ) : (
          events.map((event) => (
            <div className={`event-item event-${event.type}`} key={event.id}>
              <span>{event.text}</span>
              <time>{timeLabel(event.ts)}</time>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

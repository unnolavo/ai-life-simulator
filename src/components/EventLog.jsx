import { useEffect, useRef } from 'react';

function formatTime(seconds) {
  return `${seconds.toFixed(1)}s`;
}

export default function EventLog({ events }) {
  const logRef = useRef(null);

  useEffect(() => {
    const node = logRef.current;
    if (!node) return;
    node.scrollTop = 0;
  }, [events]);

  return (
    <section className="panel event-log">
      <h3>Event Log</h3>
      <div className="event-log-list" ref={logRef}>
        {events.length === 0 ? (
          <p className="empty">No events yet...</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="event-item">
              <span className="event-time">{formatTime(event.time)}</span>
              <span>{event.text}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

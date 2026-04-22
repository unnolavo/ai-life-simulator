import { useEffect, useRef } from 'react';

function timeAgo(timestamp) {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  return `${Math.floor(diffSec / 60)}m ago`;
}

export default function EventLog({ events }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = 0;
  }, [events]);

  return (
    <section className="panel event-log-panel">
      <h3>Event Feed</h3>
      <div className="event-log" ref={listRef}>
        {events.length === 0 ? (
          <p className="muted">No events yet…</p>
        ) : events.map((event) => (
          <article className={`event event-${event.kind}`} key={event.id}>
            <p>{event.text}</p>
            <time>{timeAgo(event.timestamp)}</time>
          </article>
        ))}
      </div>
    </section>
  );
}

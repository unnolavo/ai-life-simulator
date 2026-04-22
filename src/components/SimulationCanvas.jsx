import { useEffect, useRef } from 'react';
import { AGENT_RADIUS, WORLD_HEIGHT, WORLD_WIDTH } from '../simulation/constants';

function drawAgent(ctx, agent, selected) {
  const radius = selected ? AGENT_RADIUS + 2 : AGENT_RADIUS;
  const glow = selected ? 24 : 14;

  ctx.beginPath();
  ctx.arc(agent.x, agent.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = agent.color;
  ctx.shadowBlur = glow;
  ctx.shadowColor = agent.color;
  ctx.fill();
  ctx.shadowBlur = 0;
}

export default function SimulationCanvas({ engine, selectedAgentId }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const timeRef = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const render = (now) => {
      const delta = (now - timeRef.current) / 1000;
      timeRef.current = now;
      engine.update(delta);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      engine.agents.forEach((agent) => drawAgent(ctx, agent, agent.id === selectedAgentId));

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);

    return () => cancelAnimationFrame(frameRef.current);
  }, [engine, selectedAgentId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas.parentElement;

    const resize = () => {
      const width = Math.max(560, Math.min(WORLD_WIDTH, container.clientWidth - 4));
      canvas.width = width;
      canvas.height = WORLD_HEIGHT;
      engine.setSize(width, WORLD_HEIGHT);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [engine]);

  const handleClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let nearest = null;
    let nearestDist = Infinity;
    engine.agents.forEach((agent) => {
      const dist = Math.hypot(agent.x - x, agent.y - y);
      if (dist < nearestDist && dist < AGENT_RADIUS * 2.2) {
        nearest = agent;
        nearestDist = dist;
      }
    });

    if (nearest) engine.setSelectedAgent(nearest.id);
  };

  return (
    <div className="canvas-shell panel">
      <canvas ref={canvasRef} onClick={handleClick} />
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { AGENT_RADIUS } from '../simulation/constants';

export default function SimulationCanvas({ engine, paused, speed, selectedAgentId, onSelectAgent }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const lastTimeRef = useRef(null);

  useEffect(() => {
    engine.setSpeed(speed);
  }, [engine, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const { agents, world } = engine.getState();

      ctx.fillStyle = 'rgba(8, 14, 32, 0.28)';
      ctx.fillRect(0, 0, world.width, world.height);

      for (const agent of agents) {
        const pulse = Math.sin(agent.pulse) * 0.1 + 1;
        const radius = AGENT_RADIUS * pulse;

        ctx.beginPath();
        ctx.fillStyle = agent.color;
        ctx.shadowColor = agent.color;
        ctx.shadowBlur = 20;
        ctx.arc(agent.x, agent.y, radius, 0, Math.PI * 2);
        ctx.fill();

        if (agent.id === selectedAgentId) {
          ctx.beginPath();
          ctx.strokeStyle = '#f8fafc';
          ctx.shadowBlur = 0;
          ctx.lineWidth = 2;
          ctx.arc(agent.x, agent.y, radius + 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.shadowBlur = 0;
    };

    const loop = (time) => {
      if (lastTimeRef.current == null) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (!paused) {
        engine.tick(dt);
      }

      render();
      frameRef.current = requestAnimationFrame(loop);
    };

    ctx.fillStyle = '#080e20';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      lastTimeRef.current = null;
    };
  }, [engine, paused, selectedAgentId]);

  useEffect(() => {
    const canvas = canvasRef.current;

    function handleClick(event) {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

      const { agents } = engine.getState();
      const selected = agents.find((agent) => Math.hypot(agent.x - x, agent.y - y) <= AGENT_RADIUS + 4);
      onSelectAgent(selected?.id ?? null);
    }

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [engine, onSelectAgent]);

  return <canvas ref={canvasRef} className="sim-canvas" width={900} height={600} />;
}

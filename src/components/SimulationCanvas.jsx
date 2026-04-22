import { useEffect, useRef } from 'react';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../simulation/constants';

export default function SimulationCanvas({ engine, onSelectAgent }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const tick = (time) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      engine.update(dt);
      engine.draw(ctx);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [engine]);

  const onCanvasClick = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT;
    const selected = engine.pickAgentAt(x, y);
    onSelectAgent(selected?.id ?? null);
  };

  return (
    <div className="canvas-wrap panel">
      <canvas
        ref={canvasRef}
        width={WORLD_WIDTH}
        height={WORLD_HEIGHT}
        onClick={onCanvasClick}
        aria-label="Controlled Chaos simulation canvas"
      />
    </div>
  );
}

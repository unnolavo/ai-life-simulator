import { useEffect, useRef } from 'react'

const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1))

function drawBackground(ctx, width, height) {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.25)'
  ctx.fillRect(0, 0, width, height)
}

function drawAgent(ctx, agent, selected) {
  const glow = selected ? 17 : 10
  ctx.save()
  ctx.shadowColor = agent.color
  ctx.shadowBlur = glow
  ctx.fillStyle = agent.color
  ctx.beginPath()
  ctx.arc(agent.x, agent.y, selected ? 9.5 : 7.5, 0, Math.PI * 2)
  ctx.fill()

  if (selected) {
    ctx.shadowBlur = 0
    ctx.strokeStyle = '#f8fafc'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(agent.x, agent.y, 13, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.restore()
}

export default function SimulationCanvas({ engineRef, snapshot, onSelect }) {
  const canvasRef = useRef(null)
  const frameRef = useRef(0)
  const prevTsRef = useRef(performance.now())

  useEffect(() => {
    const canvas = canvasRef.current
    const engine = engineRef.current
    if (!canvas || !engine) return

    const ctx = canvas.getContext('2d')
    canvas.width = snapshot.world.width * DPR
    canvas.height = snapshot.world.height * DPR
    canvas.style.width = `${snapshot.world.width}px`
    canvas.style.height = `${snapshot.world.height}px`
    ctx.scale(DPR, DPR)

    const loop = (ts) => {
      const dt = (ts - prevTsRef.current) / 1000
      prevTsRef.current = ts
      engine.step(dt)

      drawBackground(ctx, snapshot.world.width, snapshot.world.height)
      for (const agent of engine.agents) {
        drawAgent(ctx, agent, snapshot.selectedAgent?.id === agent.id)
      }

      frameRef.current = requestAnimationFrame(loop)
    }

    frameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameRef.current)
  }, [engineRef, snapshot.world.width, snapshot.world.height, snapshot.selectedAgent?.id])

  function handleClick(event) {
    const canvas = canvasRef.current
    const engine = engineRef.current
    if (!canvas || !engine) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    let selected = null
    let minDist = 14
    for (const agent of engine.agents) {
      const d = Math.hypot(agent.x - x, agent.y - y)
      if (d < minDist) {
        selected = agent
        minDist = d
      }
    }

    onSelect(selected?.id ?? null)
  }

  return <canvas ref={canvasRef} className="sim-canvas" onClick={handleClick} />
}

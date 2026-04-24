import { describe, expect, it } from 'vitest';
import { createSimulationEngine, generateEventNarration } from './engine';

describe('simulation engine determinism', () => {
  it('creates deterministic starting positions for a fixed seed', () => {
    const engineA = createSimulationEngine({ seed: 12345, scenario: 'balanced' });
    const engineB = createSimulationEngine({ seed: 12345, scenario: 'balanced' });

    const pointsA = engineA.state.agents.map((a) => [Number(a.x.toFixed(3)), Number(a.y.toFixed(3))]);
    const pointsB = engineB.state.agents.map((a) => [Number(a.x.toFixed(3)), Number(a.y.toFixed(3))]);

    expect(pointsA).toEqual(pointsB);
    expect(engineA.state.agents).toHaveLength(15);
  });

  it('applies scenario presets', () => {
    const social = createSimulationEngine({ seed: 999, scenario: 'social' });
    const volatile = createSimulationEngine({ seed: 999, scenario: 'volatile' });

    const socialAvgMood = social.state.agents.reduce((sum, a) => sum + a.mood, 0) / social.state.agents.length;
    const volatileAvgMood = volatile.state.agents.reduce((sum, a) => sum + a.mood, 0) / volatile.state.agents.length;

    expect(socialAvgMood).toBeGreaterThan(volatileAvgMood);
  });
});

describe('generateEventNarration', () => {
  it('produces template output with names inserted', () => {
    const text = generateEventNarration({ kind: 'positive', actor: 'Nova', target: 'Ash' }, () => 0);
    expect(text).toContain('Nova');
    expect(text).toContain('Ash');
  });

  it('supports arc templates', () => {
    const text = generateEventNarration({ kind: 'arc', arcType: 'rivalry', actor: 'Milo', target: 'Zara' }, () => 0);
    expect(text).toContain('Milo');
    expect(text).toContain('Zara');
  });
});

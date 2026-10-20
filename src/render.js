// Converts a generated test suite into a Markdown report.

const PRICES_PER_MTOK = {
  'claude-opus-5-5': { input: 4, output: 20 },
  'claude-sonnet-5-5': { input: 2, output: 10 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5 },
};

export function estimateCost(model, usage) {
  const price = PRICES_PER_MTOK[model];
  if (!price || !usage) return null;
  return (usage.input_tokens * price.input + usage.output_tokens * price.output) / 1e6;
}

export function toMarkdown(suite) {
  const lines = [`# Test suite: ${suite.feature}`, ''];
  const counts = suite.test_cases.reduce((acc, tc) => ({ ...acc, [tc.type]: (acc[tc.type] || 0) + 1 }), {});
  lines.push(
    `${suite.test_cases.length} test cases: ` +
      ['positive', 'negative', 'edge'].map((t) => `${counts[t] || 0} ${t}`).join(', '),
    '',
  );

  for (const tc of suite.test_cases) {
    lines.push(`## ${tc.id} · ${tc.title}`, '', `**Type:** ${tc.type} · **Priority:** ${tc.priority}`, '');
    if (tc.preconditions.length) {
      lines.push('**Preconditions:**', ...tc.preconditions.map((p) => `- ${p}`), '');
    }
    lines.push('**Steps:**', ...tc.steps.map((s, i) => `${i + 1}. ${s}`), '');
    lines.push(`**Expected result:** ${tc.expected_result}`, '');
  }

  const cost = estimateCost(suite.model, suite.usage);
  if (cost !== null) {
    lines.push('---', '', `Generated with ${suite.model} · ${suite.usage.input_tokens} input / ` +
      `${suite.usage.output_tokens} output tokens · ~USD ${cost.toFixed(4)}`, '');
  }
  return lines.join('\n');
}

export function codeFileName(framework) {
  return framework === 'cypress' ? 'generated.cy.js' : 'generated.test.js';
}

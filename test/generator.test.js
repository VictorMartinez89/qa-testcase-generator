import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateTestSuite, TEST_SUITE_TOOL } from '../src/generator.js';
import { estimateCost, toMarkdown } from '../src/render.js';
import { createMockClient, SAMPLE_SUITE } from '../src/mock-client.js';

const STORY = 'As a registered user I want to log in with email and password so that I can see my dashboard.';

test('forces Claude to answer through the test-suite tool', async () => {
  const client = createMockClient();
  await generateTestSuite(STORY, { client });
  const [params] = client.calls;
  assert.deepEqual(params.tool_choice, { type: 'tool', name: TEST_SUITE_TOOL.name });
  assert.match(params.messages[0].content, /log in with email/);
});

test('asks for the requested framework', async () => {
  const client = createMockClient();
  await generateTestSuite(STORY, { client, framework: 'selenium' });
  assert.match(client.calls[0].system, /Selenium WebDriver/);
});

test('returns the suite with framework and model attached', async () => {
  const suite = await generateTestSuite(STORY, { client: createMockClient(), model: 'claude-haiku-5-5' });
  assert.equal(suite.feature, 'Login');
  assert.equal(suite.test_cases.length, 3);
  assert.equal(suite.model, 'claude-haiku-5-5');
});

test('rejects an empty story and an unknown framework', async () => {
  const client = createMockClient();
  await assert.rejects(generateTestSuite('   ', { client }), /empty/);
  await assert.rejects(generateTestSuite(STORY, { client, framework: 'playwright' }), /Unknown framework/);
});

test('fails clearly when Claude does not call the tool', async () => {
  const client = { messages: { create: async () => ({ stop_reason: 'end_turn', content: [], usage: {} }) } };
  await assert.rejects(generateTestSuite(STORY, { client }), /did not return a test suite/);
});

test('renders every test case and counts them by type', () => {
  const md = toMarkdown({ ...SAMPLE_SUITE, framework: 'cypress', model: 'claude-sonnet-5-5', usage: null });
  assert.match(md, /3 test cases: 1 positive, 1 negative, 1 edge/);
  for (const tc of SAMPLE_SUITE.test_cases) assert.ok(md.includes(tc.id));
});

test('estimates the cost from token usage', () => {
  // 2,000 input + 1,000 output tokens on Sonnet 5.5 = 0.004 + 0.010 USD
  assert.equal(estimateCost('claude-sonnet-5-5', { input_tokens: 2000, output_tokens: 1000 }), 0.014);
  assert.equal(estimateCost('unknown-model', { input_tokens: 1, output_tokens: 1 }), null);
});

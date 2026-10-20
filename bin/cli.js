#!/usr/bin/env node
// Usage: qa-gen <story.txt | "user story text"> [--framework cypress|selenium] [--model id] [--out dir] [--mock]

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import Anthropic from '@anthropic-ai/sdk';
import { DEFAULT_MODEL, generateTestSuite } from '../src/generator.js';
import { codeFileName, estimateCost, toMarkdown } from '../src/render.js';
import { createMockClient } from '../src/mock-client.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    framework: { type: 'string', default: 'cypress' },
    model: { type: 'string', default: DEFAULT_MODEL },
    out: { type: 'string', default: 'output' },
    mock: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (values.help || positionals.length === 0) {
  console.log('Usage: qa-gen <story.txt | "user story"> [--framework cypress|selenium] [--model id] [--out dir] [--mock]');
  process.exit(values.help ? 0 : 1);
}

const input = positionals.join(' ');
const story = existsSync(input) ? readFileSync(input, 'utf8') : input;

if (!values.mock && !process.env.ANTHROPIC_API_KEY) {
  console.error('Set ANTHROPIC_API_KEY, or run with --mock to try it without the API.');
  process.exit(1);
}
const client = values.mock ? createMockClient() : new Anthropic();

try {
  const suite = await generateTestSuite(story, { client, model: values.model, framework: values.framework });
  mkdirSync(values.out, { recursive: true });
  const report = join(values.out, 'test-cases.md');
  const code = join(values.out, codeFileName(suite.framework));
  writeFileSync(report, toMarkdown(suite));
  writeFileSync(code, suite.automation_code);
  writeFileSync(join(values.out, 'test-suite.json'), JSON.stringify(suite, null, 2));

  console.log(`✔ ${suite.test_cases.length} test cases for "${suite.feature}"`);
  console.log(`  ${report}\n  ${code}`);
  const cost = estimateCost(suite.model, suite.usage);
  if (cost !== null && !values.mock) console.log(`  ~USD ${cost.toFixed(4)}`);
} catch (err) {
  console.error(`✖ ${err.message}`);
  process.exit(1);
}

# QA Test Case Generator

Turn a **user story** into a structured **test suite** (positive, negative and edge cases) plus a ready-to-run
**Cypress** or **Selenium WebDriver** test file, using the Claude API.

Built by a QA automation engineer to speed up the most repetitive part of test design, while keeping ISTQB
techniques (equivalence partitioning, boundary values, error guessing) at the core of the prompt.

## How it works

1. The user story is sent to Claude with a QA-engineer system prompt.
2. Claude must answer through a **tool with a JSON schema** (`save_test_suite`), so the output is always
   structured: id, title, type, priority, preconditions, steps and expected result for every case.
3. The CLI writes three files:
   - `test-cases.md`: a readable report;
   - `generated.cy.js` (Cypress) or `generated.test.js` (Selenium + Mocha);
   - `test-suite.json`: the raw data, for importing into a test-management tool.
4. It prints the token usage and the estimated cost of the call.

## Quick start

```bash
npm install
npm run demo                      # offline demo, no API key needed
npm test                          # unit tests (Node test runner, mocked client)

export ANTHROPIC_API_KEY=sk-ant-...
node bin/cli.js examples/login.txt                       # Cypress, Claude Haiku 5.5
node bin/cli.js examples/login.txt --framework selenium  # Selenium WebDriver
node bin/cli.js "As a user I want to reset my password" --model claude-sonnet-5-5
```

| Option | Default | |
|---|---|---|
| `--framework` | `cypress` | `cypress` or `selenium` |
| `--model` | `claude-haiku-5-5` | any Claude model id |
| `--out` | `output` | folder for the generated files |
| `--mock` | off | run without calling the API |

## Cost

Haiku 5.5 is the default because it is fast and cheap: a typical story costs a fraction of a cent.
Switch to Sonnet 5.5 or Opus 5.5 for complex stories with many business rules.

## Tech

Node.js 20+, ES modules, [`@anthropic-ai/sdk`](https://www.npmjs.com/package/@anthropic-ai/sdk), `node:test`.

## Roadmap

- REST API with Express (`POST /api/test-suites`).
- GitHub Action that generates test cases when a story is added to a pull request.
- Playwright output.

## License

MIT

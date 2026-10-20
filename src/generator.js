// Turns a user story into structured test cases plus automation code, using Claude.

export const DEFAULT_MODEL = 'claude-haiku-5-5';
export const FRAMEWORKS = ['cypress', 'selenium'];

// Claude must answer by calling this tool, so the reply always has this shape.
export const TEST_SUITE_TOOL = {
  name: 'save_test_suite',
  description: 'Save the test cases and the automation code generated for a user story.',
  input_schema: {
    type: 'object',
    properties: {
      feature: { type: 'string', description: 'Short name of the feature under test.' },
      test_cases: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Identifier such as TC-01.' },
            title: { type: 'string' },
            type: { type: 'string', enum: ['positive', 'negative', 'edge'] },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            preconditions: { type: 'array', items: { type: 'string' } },
            steps: { type: 'array', items: { type: 'string' } },
            expected_result: { type: 'string' },
          },
          required: ['id', 'title', 'type', 'priority', 'preconditions', 'steps', 'expected_result'],
        },
      },
      automation_code: {
        type: 'string',
        description: 'A complete, runnable test file that automates the high-priority cases.',
      },
    },
    required: ['feature', 'test_cases', 'automation_code'],
  },
};

const FRAMEWORK_HINTS = {
  cypress: 'Cypress (JavaScript, describe/it, cy.get with data-testid selectors)',
  selenium: 'Selenium WebDriver for JavaScript (selenium-webdriver + Mocha, async/await, By.css selectors)',
};

export function buildSystemPrompt(framework) {
  return [
    'You are a senior QA automation engineer.',
    'Given a user story, design a concise but complete test suite using ISTQB techniques:',
    'equivalence partitioning, boundary value analysis and error guessing.',
    'Cover positive, negative and edge cases; avoid duplicates; keep steps short and concrete.',
    'Assume selectors are data-testid attributes named after the element, e.g. [data-testid="login-button"].',
    `Write the automation code for ${FRAMEWORK_HINTS[framework]}.`,
    'Answer only by calling the save_test_suite tool.',
  ].join('\n');
}

export async function generateTestSuite(story, { client, model = DEFAULT_MODEL, framework = 'cypress' } = {}) {
  if (!story || !story.trim()) throw new Error('The user story is empty.');
  if (!FRAMEWORKS.includes(framework)) {
    throw new Error(`Unknown framework "${framework}". Use one of: ${FRAMEWORKS.join(', ')}.`);
  }

  const response = await client.messages.create({
    model,
    max_tokens: 8000,
    system: buildSystemPrompt(framework),
    tools: [TEST_SUITE_TOOL],
    tool_choice: { type: 'tool', name: TEST_SUITE_TOOL.name },
    messages: [{ role: 'user', content: `User story:\n\n${story.trim()}` }],
  });

  const call = response.content.find((block) => block.type === 'tool_use');
  if (!call) throw new Error(`Claude did not return a test suite (stop_reason: ${response.stop_reason}).`);
  if (response.stop_reason === 'max_tokens') throw new Error('The answer was cut off; raise max_tokens.');

  return { ...call.input, framework, model, usage: response.usage };
}

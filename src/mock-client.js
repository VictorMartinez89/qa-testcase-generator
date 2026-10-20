// A stand-in for the Anthropic client: lets the tool run without API credits (--mock) and in tests.

export const SAMPLE_SUITE = {
  feature: 'Login',
  test_cases: [
    {
      id: 'TC-01',
      title: 'Login with valid credentials',
      type: 'positive',
      priority: 'high',
      preconditions: ['A registered user exists'],
      steps: ['Open /login', 'Enter a valid email and password', 'Click "Log in"'],
      expected_result: 'The user is redirected to the dashboard.',
    },
    {
      id: 'TC-02',
      title: 'Login with a wrong password',
      type: 'negative',
      priority: 'high',
      preconditions: ['A registered user exists'],
      steps: ['Open /login', 'Enter a valid email and a wrong password', 'Click "Log in"'],
      expected_result: 'An "Invalid credentials" error is shown and the user stays on /login.',
    },
    {
      id: 'TC-03',
      title: 'Password at the maximum allowed length',
      type: 'edge',
      priority: 'medium',
      preconditions: ['A user whose password has 64 characters'],
      steps: ['Open /login', 'Enter the email and the 64-character password', 'Click "Log in"'],
      expected_result: 'The user is logged in.',
    },
  ],
  automation_code: [
    "describe('Login', () => {",
    "  it('TC-01 logs in with valid credentials', () => {",
    "    cy.visit('/login');",
    "    cy.get('[data-testid=\"email-input\"]').type('user@example.com');",
    "    cy.get('[data-testid=\"password-input\"]').type('Secret123!');",
    "    cy.get('[data-testid=\"login-button\"]').click();",
    "    cy.url().should('include', '/dashboard');",
    '  });',
    '});',
    '',
  ].join('\n'),
};

export function createMockClient(suite = SAMPLE_SUITE) {
  const calls = [];
  return {
    calls,
    messages: {
      async create(params) {
        calls.push(params);
        return {
          stop_reason: 'tool_use',
          content: [{ type: 'tool_use', id: 'mock', name: 'save_test_suite', input: suite }],
          usage: { input_tokens: 0, output_tokens: 0 },
        };
      },
    },
  };
}

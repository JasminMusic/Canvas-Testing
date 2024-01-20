import { defineConfig, devices } from '@playwright/test';

export const domainToRunTestsAgainst =
  process.env['TESTING_DOMAIN'] || 'http://localhost:3000';

  function patchEnvVars() {
    if (
      process.argv.includes('--headed') ||
      process.argv.includes('--debug') ||
      process.argv.includes('--ui')
    ) {
      process.env['HEADED'] = 'true';
    }
  }
  
  patchEnvVars();

  export default defineConfig({
    timeout: 180000,
    expect: { timeout: 25000 },
    workers: '50%',
    fullyParallel: true,
    retries: 3,
    use: {
      headless: process.env['HEADED'] !== 'true',
      actionTimeout: 20000,
      screenshot: 'off', 
      video: 'on-first-retry', 
      trace: 'on-first-retry', 
      ignoreHTTPSErrors: true,
      baseURL: domainToRunTestsAgainst,
      channel: 'chrome',
      ...devices['Desktop Chrome'],
      viewport: { width: 1280, height: 720 },
      launchOptions: {
        args:
          process.env['HEADED'] === 'true'
            ? ['--auto-open-devtools-for-tabs']
            : ['--headless=new'],
      },
    },
    reporter: [
      process.env.CI ? ['github', 'list'] : ['list'],
      ['junit', { outputFile: 'junit-results.xml' }],
      ['json', { outputFile: 'json-results.json' }],
      ['html', { open: 'never' }],
    ],
  });
  
# Smoke Testing Guide for Kaiwa

This document explains how to use the smoke testing system in the Kaiwa project for both local development and production deployment.

## What are Smoke Tests?

Smoke tests are lightweight, fast tests that verify the most critical functionality of your application. They run quickly and catch major issues before more comprehensive testing.

## Quick Start

### Run All Smoke Tests
```bash
pnpm run smoke:test:all
```

### Run Specific Smoke Test Types
```bash
# Local development tests
pnpm run smoke:test

# Production environment tests
pnpm run smoke:test:prod

# Local tests with browser UI (for debugging)
pnpm run smoke:test:headed
```

## Smoke Test Scripts

The `scripts/run-smoke-tests.ts` script provides a comprehensive way to run smoke tests:

```bash
# Run all smoke test configurations
tsx scripts/run-smoke-tests.ts

# Run only local tests
tsx scripts/run-smoke-tests.ts --local

# Run only production tests
tsx scripts/run-smoke-tests.ts --prod

# Run only headed tests
tsx scripts/run-smoke-tests.ts --headed

# Show help
tsx scripts/run-smoke-tests.ts --help
```

## What Gets Tested

### Core Functionality
- ✅ Home page loads correctly
- ✅ Language selection modal opens
- ✅ Navigation to conversation page
- ✅ Conversation interface displays
- ✅ Basic recording interaction
- ✅ Authentication flow
- ✅ Pricing page accessibility
- ✅ Cross-page navigation
- ✅ Responsive design (mobile, tablet, desktop)

### Test Coverage
- **Critical User Paths**: Core user journeys that must work
- **UI Elements**: Essential components and navigation
- **Responsive Design**: Mobile and tablet compatibility
- **Page Accessibility**: Basic page structure verification

## CI/CD Integration

### GitHub Actions Workflow
The `.github/workflows/ci-cd.yml` file automatically runs smoke tests:

1. **On Every Push/PR**: Runs smoke tests and build verification
2. **On Main Branch Push**: Deploys to production after successful tests
3. **Post-Deployment**: Runs smoke tests against production

### Workflow Stages
1. **Smoke Tests** (10 min timeout)
2. **Build Verification** (15 min timeout)
3. **Deployment** (20 min timeout, main branch only)
4. **Post-Deployment Smoke Tests** (15 min timeout)

## Local Development

### Prerequisites
```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install --with-deps
```

### Running Tests
```bash
# Quick smoke test
pnpm run smoke:test

# With browser UI for debugging
pnpm run smoke:test:headed

# Full test suite
pnpm run test
```

## Production Testing

### Environment Variables
```bash
# Set production URL
export BASE_URL=https://kaiwa.fly.dev

# Run production smoke tests
pnpm run smoke:test:prod
```

### Health Checks
The smoke tests include production health checks:
- Verifies production environment is accessible
- Tests critical user flows
- Validates responsive design
- Checks page accessibility

## Test Utilities

### SmokeTestUtils Class
Located in `e2e/smoke-utils.ts`, this class provides:

- **Page Navigation**: Common navigation patterns
- **Element Verification**: Standard element checks
- **Responsive Testing**: Multi-viewport testing
- **API Mocking**: Test data setup
- **Accessibility Checks**: Page structure validation

### Usage Example
```typescript
import { SmokeTestUtils } from './smoke-utils';

test('example test', async ({ page }) => {
  const utils = new SmokeTestUtils(page);
  
  await utils.waitForPageLoad();
  await utils.checkMainButtonVisible();
  await utils.openLanguageSelector();
});
```

## Troubleshooting

### Common Issues

#### Tests Fail Locally
```bash
# Clear Playwright cache
rm -rf test-results/
rm -rf playwright-report/

# Reinstall browsers
pnpm exec playwright install --with-deps

# Check dependencies
pnpm install
```

#### Production Tests Fail
```bash
# Verify production URL is accessible
curl -I https://kaiwa.fly.dev

# Check environment variables
echo $BASE_URL

# Run with verbose output
DEBUG=pw:api pnpm run smoke:test:prod
```

#### Build Issues
```bash
# Clear build cache
rm -rf build/
rm -rf .svelte-kit/

# Reinstall dependencies
pnpm install

# Check TypeScript
pnpm run check
```

### Debug Mode
```bash
# Run with debug output
DEBUG=pw:api pnpm run smoke:test

# Run with headed browser
pnpm run smoke:test:headed

# Run specific test
pnpm exec playwright test --grep "should load home page" --headed
```

## Best Practices

### Writing Smoke Tests
1. **Keep Tests Fast**: Each test should complete in under 30 seconds
2. **Test Critical Paths**: Focus on user journeys that must work
3. **Use Utilities**: Leverage `SmokeTestUtils` for common operations
4. **Mock External APIs**: Avoid dependencies on external services
5. **Test Responsiveness**: Include mobile and tablet viewports

### Test Maintenance
1. **Update Selectors**: Keep element selectors current with UI changes
2. **Review Failures**: Investigate and fix test failures promptly
3. **Add New Tests**: Include tests for new critical functionality
4. **Performance**: Monitor test execution time

## Monitoring and Alerts

### GitHub Actions Notifications
- ✅ Success: Tests pass, deployment successful
- ❌ Failure: Tests fail, deployment blocked
- ⚠️ Warning: Tests pass but with warnings

### Test Results
- **Artifacts**: Test results stored for 7 days
- **Reports**: HTML reports generated for each run
- **Screenshots**: Failed test screenshots captured
- **Videos**: Failed test recordings saved

## Next Steps

1. **Run Smoke Tests**: Start with `pnpm run smoke:test:all`
2. **Review Results**: Check test output and fix any failures
3. **Customize Tests**: Add tests for your specific critical paths
4. **Set Up Monitoring**: Configure alerts for test failures
5. **Optimize Performance**: Reduce test execution time

## Support

For issues with smoke tests:
1. Check the troubleshooting section above
2. Review GitHub Actions logs
3. Check Playwright documentation
4. Review test utilities and examples

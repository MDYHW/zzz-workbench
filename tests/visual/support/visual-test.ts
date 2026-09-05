import { expect, test as base } from '@playwright/test'
import { trackRuntimeFailures } from './workbench-page'

export const test = base.extend<{ runtimeFailures: string[] }>({
  runtimeFailures: [async ({ page }, use) => {
    const failures = trackRuntimeFailures(page)
    await use(failures)
    expect(failures).toEqual([])
  }, { auto: true }],
})

export { expect }

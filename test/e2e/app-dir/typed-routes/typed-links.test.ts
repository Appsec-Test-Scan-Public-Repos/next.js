import { nextTestSetup } from 'e2e-utils'

describe('typed-links', () => {
  const { next } = nextTestSetup({
    files: __dirname,
  })

  it('should work with typed links using path and params', async () => {
    const $ = await next.render$('/blog/hello-world')

    // Check that the page renders correctly
    expect($('div').text()).toContain('Blog post: hello-world')

    // Check that the typed link exists
    const link = $('a[href="/login"]')
    expect(link.length).toBe(1)
    expect(link.text()).toBe('Hey')
  })

  it('should work with typed links using params', async () => {
    const $ = await next.render$('/login')

    // Check that the page renders correctly (there are two h2 elements - one from layout, one from page)
    expect($('main h2').text()).toBe('Login Page')

    // Check that the typed link with params exists
    const link = $('a[href="/blog/hello"]')
    expect(link.length).toBe(1)
    expect(link.text()).toBe('Shop')
  })

  it('should construct href correctly from path and params', async () => {
    // Use the existing demo page to test href construction
    const $ = await next.render$('/typed-links-demo')

    // Check that hrefs are constructed correctly
    expect($('a[href="/blog/my-first-post"]').length).toBe(1)
    expect($('a[href="/docs/getting-started"]').length).toBe(1)
    expect($('a[href="/shop/electronics/phones"]').length).toBe(1)
    expect($('a[href="/shop"]').length).toBe(1)
  })

  it('should work with searchParams', async () => {
    // Use the existing demo page to test searchParams
    const $ = await next.render$('/typed-links-demo')

    // Check that hrefs are constructed correctly with search params
    expect($('a[href="/blog/search-demo?utm_source=demo"]').length).toBe(1)
    expect($('a[href="/dashboard?tab=settings&view=grid"]').length).toBe(1)
  })

  it('should handle navigation correctly', async () => {
    // Test that clicking typed links actually navigates correctly
    const browser = await next.browser('/login')

    // Click the typed link
    await browser.elementByCss('a[href="/blog/hello"]').click()

    // Check that we navigated to the correct page
    await browser.waitForElementByCss('div:has-text("Blog post: hello")')

    // Verify the URL
    expect(await browser.url()).toMatch(/\/blog\/hello$/)
  })

  it('should work with regular href links alongside typed links', async () => {
    // Use the existing demo page to test mixed links
    const $ = await next.render$('/typed-links-demo')

    // Check that both types of links work
    expect($('a[href="/about"]').text()).toBe('About (href)')
    expect($('a[href="/blog/typed-links"]').text()).toBe(
      'Typed Links Post (path)'
    )
    expect($('a[href="https://nextjs.org"]').text()).toBe(
      'Next.js Website (external)'
    )
  })

  it('should generate correct TypeScript types for typed links', async () => {
    // Check that the generated route types file contains the necessary module augmentations
    const routeTypesContent = await next.readFile('.next/types/routes.d.ts')

    // Check for Link module augmentation
    expect(routeTypesContent).toContain("declare module 'next/link'")
    expect(routeTypesContent).toContain('LinkPropsWithHref')
    expect(routeTypesContent).toContain('LinkPropsWithPath')
    expect(routeTypesContent).toContain('export type LinkProps')

    // Check for proper generic type support
    expect(routeTypesContent).toContain('RouteType extends Routes')
  })
})

import { constructHref } from '../../packages/next/src/shared/lib/router/utils/construct-href'

describe('constructHref', () => {
  it('should handle static paths without params', () => {
    expect(constructHref('/')).toBe('/')
    expect(constructHref('/about')).toBe('/about')
    expect(constructHref('/dashboard/settings')).toBe('/dashboard/settings')
  })

  it('should handle dynamic segments with params', () => {
    expect(constructHref('/blog/[slug]', { slug: 'hello-world' })).toBe(
      '/blog/hello-world'
    )
    expect(constructHref('/users/[id]', { id: '123' })).toBe('/users/123')
    expect(
      constructHref('/posts/[id]/comments/[commentId]', {
        id: '456',
        commentId: '789',
      })
    ).toBe('/posts/456/comments/789')
  })

  it('should handle catch-all routes', () => {
    expect(
      constructHref('/docs/[...slug]', { slug: ['guide', 'getting-started'] })
    ).toBe('/docs/guide/getting-started')
    expect(
      constructHref('/api/[...path]', {
        path: ['users', 'profile', 'settings'],
      })
    ).toBe('/api/users/profile/settings')
    expect(
      constructHref('/files/[...path]', {
        path: ['folder', 'subfolder', 'file.txt'],
      })
    ).toBe('/files/folder/subfolder/file.txt')
  })

  it('should handle optional catch-all routes', () => {
    expect(
      constructHref('/shop/[[...category]]', {
        category: ['electronics', 'phones'],
      })
    ).toBe('/shop/electronics/phones')
    expect(
      constructHref('/shop/[[...category]]', { category: ['books'] })
    ).toBe('/shop/books')
    expect(constructHref('/shop/[[...category]]', {})).toBe('/shop')
    expect(constructHref('/shop/[[...category]]')).toBe('/shop')
  })

  it('should handle search params', () => {
    expect(constructHref('/search', undefined, { q: 'nextjs' })).toBe(
      '/search?q=nextjs'
    )
    expect(
      constructHref('/search', undefined, { q: 'nextjs', filter: 'latest' })
    ).toBe('/search?q=nextjs&filter=latest')
    expect(
      constructHref(
        '/blog/[slug]',
        { slug: 'test' },
        { utm_source: 'newsletter' }
      )
    ).toBe('/blog/test?utm_source=newsletter')
  })

  it('should handle search params with arrays', () => {
    expect(
      constructHref('/search', undefined, { tags: ['react', 'nextjs'] })
    ).toBe('/search?tags=react&tags=nextjs')
    expect(
      constructHref('/filter', undefined, {
        category: ['tech', 'web'],
        sort: 'date',
      })
    ).toBe('/filter?category=tech&category=web&sort=date')
  })

  it('should handle complex combinations', () => {
    expect(
      constructHref(
        '/docs/[...slug]',
        { slug: ['api', 'reference'] },
        { version: '13', tab: 'examples' }
      )
    ).toBe('/docs/api/reference?version=13&tab=examples')

    expect(
      constructHref(
        '/shop/[[...category]]',
        { category: ['electronics'] },
        { sort: 'price', filter: ['available', 'popular'] }
      )
    ).toBe('/shop/electronics?sort=price&filter=available&filter=popular')
  })

  it('should handle empty params correctly', () => {
    expect(constructHref('/blog/[slug]', {})).toBe('/blog/[slug]')
    expect(constructHref('/docs/[...slug]', {})).toBe('/docs/[...slug]')
    expect(constructHref('/shop/[[...category]]', {})).toBe('/shop')
  })

  it('should handle undefined params correctly', () => {
    expect(constructHref('/blog/[slug]')).toBe('/blog/[slug]')
    expect(constructHref('/docs/[...slug]')).toBe('/docs/[...slug]')
    expect(constructHref('/shop/[[...category]]')).toBe('/shop')
  })

  it('should handle special characters in params', () => {
    expect(constructHref('/blog/[slug]', { slug: 'hello-world-2023' })).toBe(
      '/blog/hello-world-2023'
    )
    expect(constructHref('/search', undefined, { q: 'react & nextjs' })).toBe(
      '/search?q=react+%26+nextjs'
    )
    expect(constructHref('/user/[id]', { id: 'user@example.com' })).toBe(
      '/user/user@example.com'
    )
  })

  it('should handle empty string params', () => {
    expect(constructHref('/blog/[slug]', { slug: '' })).toBe('/blog/')
    expect(constructHref('/docs/[...slug]', { slug: [''] })).toBe('/docs/')
    expect(constructHref('/shop/[[...category]]', { category: [''] })).toBe(
      '/shop/'
    )
  })
})

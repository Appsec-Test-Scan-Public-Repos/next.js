import Link from 'next/link'

export default function TypedLinksDemo() {
  return (
    <div>
      <h1>Typed Links Demo</h1>
      <p>This page demonstrates the typed links feature.</p>

      <h2>Basic Links</h2>
      <Link path="/">Home</Link>
      <Link path="/dashboard">Dashboard</Link>
      <Link path="/login">Login</Link>
      <Link href="/blog/my-slug">Dashboard</Link>

      <h2>Dynamic Links</h2>

      <Link path="/blog/[slug]" params={{ slug: 'my-first-post' }}>
        My First Post
      </Link>
      <Link path="/blog/[slug]" params={{ slug: 'nextjs-tutorial' }}>
        Next.js Tutorial
      </Link>
      <Link path="/gallery/photo/[id]" params={{ id: '123' }}>
        Photo 123
      </Link>

      <h2>Catch-all Links</h2>

      <Link path="/docs/[...slug]" params={{ slug: ['getting-started'] }}>
        Getting Started
      </Link>
      <Link path="/docs/[...slug]" params={{ slug: ['api', 'reference'] }}>
        API Reference
      </Link>
      <Link
        path="/docs/[...slug]"
        params={{ slug: ['guide', 'routing', 'dynamic'] }}
      >
        Dynamic Routing Guide
      </Link>

      <h2>Optional Catch-all Links</h2>
      <Link path="/shop/[[...category]]" params={{}}>
        Shop Home
      </Link>
      <Link path="/shop/[[...category]]" params={{ category: ['electronics'] }}>
        Electronics
      </Link>
      <Link
        path="/shop/[[...category]]"
        params={{ category: ['electronics', 'phones'] }}
      >
        Phones
      </Link>

      <h2>Links with Search Parameters</h2>
      <Link
        path="/blog/[slug]"
        params={{ slug: 'search-demo' }}
        searchParams={{ utm_source: 'demo' }}
      >
        Blog with UTM
      </Link>
      <Link path="/dashboard" searchParams={{ tab: 'settings', view: 'grid' }}>
        Dashboard Settings
      </Link>
      <Link
        path="/docs/[...slug]"
        params={{ slug: ['search'] }}
        searchParams={{ q: 'routing', filter: 'latest' }}
      >
        Search Docs
      </Link>

      <h2>Mixed with Traditional Links</h2>
      <Link href="/about">About (href)</Link>
      <Link href="https://nextjs.org">Next.js Website (external)</Link>
      <Link path="/blog/[slug]" params={{ slug: 'typed-links' }}>
        Typed Links Post (path)
      </Link>
    </div>
  )
}

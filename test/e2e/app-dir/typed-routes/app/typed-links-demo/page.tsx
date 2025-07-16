import Link from 'next/link'

export default function TypedLinksDemo() {
  return (
    <div>
      <h1>Typed Links Demo</h1>
      <p>This page demonstrates the typed links feature.</p>

      <h2>Basic Links</h2>
      <ul>
        <li>
          <Link path="/">Home</Link>
        </li>
        <li>
          <Link path="/dashboard">Dashboard</Link>
        </li>
        <li>
          <Link path="/login">Login</Link>
        </li>
      </ul>

      <h2>Dynamic Links</h2>
      <ul>
        <li>
          <Link path="/blog/[slug]" params={{ slug: 'my-first-post' }}>
            My First Post
          </Link>
        </li>
        <li>
          <Link path="/blog/[slug]" params={{ slug: 'nextjs-tutorial' }}>
            Next.js Tutorial
          </Link>
        </li>
        <li>
          <Link path="/gallery/photo/[id]" params={{ id: '123' }}>
            Photo 123
          </Link>
        </li>
      </ul>

      <h2>Catch-all Links</h2>
      <ul>
        <li>
          <Link path="/docs/[...slug]" params={{ slug: ['getting-started'] }}>
            Getting Started
          </Link>
        </li>
        <li>
          <Link path="/docs/[...slug]" params={{ slug: ['api', 'reference'] }}>
            API Reference
          </Link>
        </li>
        <li>
          <Link
            path="/docs/[...slug]"
            params={{ slug: ['guide', 'routing', 'dynamic'] }}
          >
            Dynamic Routing Guide
          </Link>
        </li>
      </ul>

      <h2>Optional Catch-all Links</h2>
      <ul>
        <li>
          <Link path="/shop/[[...category]]" params={{}}>
            Shop Home
          </Link>
        </li>
        <li>
          <Link
            path="/shop/[[...category]]"
            params={{ category: ['electronics'] }}
          >
            Electronics
          </Link>
        </li>
        <li>
          <Link
            path="/shop/[[...category]]"
            params={{ category: ['electronics', 'phones'] }}
          >
            Phones
          </Link>
        </li>
      </ul>

      <h2>Links with Search Parameters</h2>
      <ul>
        <li>
          <Link
            path="/blog/[slug]"
            params={{ slug: 'search-demo' }}
            searchParams={{ utm_source: 'demo' }}
          >
            Blog with UTM
          </Link>
        </li>
        <li>
          <Link
            path="/dashboard"
            searchParams={{ tab: 'settings', view: 'grid' }}
          >
            Dashboard Settings
          </Link>
        </li>
        <li>
          <Link
            path="/docs/[...slug]"
            params={{ slug: ['search'] }}
            searchParams={{ q: 'routing', filter: 'latest' }}
          >
            Search Docs
          </Link>
        </li>
      </ul>

      <h2>Mixed with Traditional Links</h2>
      <ul>
        <li>
          <Link href="/about">About (href)</Link>
        </li>
        <li>
          <Link href="https://nextjs.org">Next.js Website (external)</Link>
        </li>
        <li>
          <Link path="/blog/[slug]" params={{ slug: 'typed-links' }}>
            Typed Links Post (path)
          </Link>
        </li>
      </ul>
    </div>
  )
}

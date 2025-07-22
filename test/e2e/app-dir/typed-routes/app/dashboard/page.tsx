import Link from 'next/link'

export default function DashboardPage(props: PageProps<'/dashboard'>) {
  return (
    <div>
      <p>Dashboard Home</p>
      <Link href="/shop/testing/hello">Settings</Link>
      <Link href="/blog/hey">About</Link>
      <Link path="/blog/[slug]" params={{ slug: 'hey' }}>
        Hey
      </Link>
    </div>
  )
}

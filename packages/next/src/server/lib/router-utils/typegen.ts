import type { RouteTypesManifest } from './route-types-utils'
import { isDynamicRoute } from '../../../shared/lib/router/utils/is-dynamic'

function generateRouteTypes(routesManifest: RouteTypesManifest): string {
  const appRoutes = Object.keys(routesManifest.appRoutes).sort()
  const pageRoutes = Object.keys(routesManifest.pageRoutes).sort()
  const layoutRoutes = Object.keys(routesManifest.layoutRoutes).sort()
  const redirectRoutes = Object.keys(routesManifest.redirectRoutes).sort()
  const rewriteRoutes = Object.keys(routesManifest.rewriteRoutes).sort()

  let result = ''

  // Generate AppRoutes union type
  if (appRoutes.length > 0) {
    result += `type AppRoutes = ${appRoutes.map((route) => JSON.stringify(route)).join(' | ')}\n`
  } else {
    result += 'type AppRoutes = never\n'
  }

  // Generate PageRoutes union type
  if (pageRoutes.length > 0) {
    result += `type PageRoutes = ${pageRoutes.map((route) => JSON.stringify(route)).join(' | ')}\n`
  } else {
    result += 'type PageRoutes = never\n'
  }

  // Generate LayoutRoutes union type
  if (layoutRoutes.length > 0) {
    result += `type LayoutRoutes = ${layoutRoutes.map((route) => JSON.stringify(route)).join(' | ')}\n`
  } else {
    result += 'type LayoutRoutes = never\n'
  }

  // Generate RedirectRoutes union type
  if (redirectRoutes.length > 0) {
    result += `type RedirectRoutes = ${redirectRoutes
      .map((route) => JSON.stringify(route))
      .join(' | ')}\n`
  } else {
    result += 'type RedirectRoutes = never\n'
  }

  // Generate RewriteRoutes union type
  if (rewriteRoutes.length > 0) {
    result += `type RewriteRoutes = ${rewriteRoutes
      .map((route) => JSON.stringify(route))
      .join(' | ')}\n`
  } else {
    result += 'type RewriteRoutes = never\n'
  }

  result +=
    'type Routes = AppRoutes | PageRoutes | LayoutRoutes | RedirectRoutes | RewriteRoutes\n'

  return result
}

function generateParamTypes(routesManifest: RouteTypesManifest): string {
  const allRoutes = {
    ...routesManifest.appRoutes,
    ...routesManifest.pageRoutes,
    ...routesManifest.layoutRoutes,
    ...routesManifest.redirectRoutes,
    ...routesManifest.rewriteRoutes,
  }

  let paramTypes = 'interface ParamMap {\n'

  // Sort routes deterministically for consistent output
  const sortedRoutes = Object.entries(allRoutes).sort(([a], [b]) =>
    a.localeCompare(b)
  )

  for (const [route, routeInfo] of sortedRoutes) {
    const { groups } = routeInfo

    // For static routes (no dynamic segments), we can produce an empty parameter map.
    if (!isDynamicRoute(route) || Object.keys(groups ?? {}).length === 0) {
      paramTypes += `  ${JSON.stringify(route)}: {}\n`
      continue
    }

    let paramType = '{'

    // Process each group based on its properties
    for (const [key, group] of Object.entries(groups)) {
      const escapedKey = JSON.stringify(key)
      if (group.repeat) {
        // Catch-all parameters
        if (group.optional) {
          paramType += ` ${escapedKey}?: string[];`
        } else {
          paramType += ` ${escapedKey}: string[];`
        }
      } else {
        // Regular parameters
        if (group.optional) {
          paramType += ` ${escapedKey}?: string;`
        } else {
          paramType += ` ${escapedKey}: string;`
        }
      }
    }

    paramType += ' }'

    paramTypes += `  ${JSON.stringify(route)}: ${paramType}\n`
  }

  paramTypes += '}\n'
  return paramTypes
}

function generateLayoutSlotMap(routesManifest: RouteTypesManifest): string {
  let slotMap = 'interface LayoutSlotMap {\n'

  // Sort routes deterministically for consistent output
  const sortedLayoutRoutes = Object.entries(routesManifest.layoutRoutes).sort(
    ([a], [b]) => a.localeCompare(b)
  )

  for (const [route, routeInfo] of sortedLayoutRoutes) {
    if ('slots' in routeInfo) {
      const slots = routeInfo.slots.sort()
      if (slots.length > 0) {
        slotMap += `  ${JSON.stringify(route)}: ${slots.map((slot) => JSON.stringify(slot)).join(' | ')}\n`
      } else {
        slotMap += `  ${JSON.stringify(route)}: never\n`
      }
    } else {
      slotMap += `  ${JSON.stringify(route)}: never\n`
    }
  }

  slotMap += '}\n'
  return slotMap
}

function generateRouteValidationTypes(
  routesManifest: RouteTypesManifest
): string {
  const allRoutes = {
    ...routesManifest.appRoutes,
    ...routesManifest.pageRoutes,
    ...routesManifest.layoutRoutes,
  }

  // Separate static and dynamic routes
  const staticRoutes: string[] = []
  const dynamicRoutes: string[] = []

  for (const [route, routeInfo] of Object.entries(allRoutes)) {
    const { groups } = routeInfo
    const hasParams = Object.keys(groups).length > 0

    if (hasParams) {
      dynamicRoutes.push(route)
    } else {
      staticRoutes.push(route)
    }
  }

  // Sort routes for consistent output
  staticRoutes.sort()
  dynamicRoutes.sort()

  let result = `// Template literal types for route validation
type SearchOrHash = \`?\${string}\` | \`#\${string}\`
type WithProtocol = \`\${string}:\${string}\`
type Suffix = '' | SearchOrHash

type SafeSlug<S extends string> = S extends \`\${string}/\${string}\`
  ? never
  : S extends \`\${string}\${SearchOrHash}\`
  ? never
  : S extends ''
  ? never
  : S

type CatchAllSlug<S extends string> = S extends \`\${string}\${SearchOrHash}\`
  ? never
  : S extends ''
  ? never
  : S

type OptionalCatchAllSlug<S extends string> =
  S extends \`\${string}\${SearchOrHash}\` ? never : S

`

  // Generate StaticRoutes
  if (staticRoutes.length > 0) {
    result += `type StaticRoutes = ${staticRoutes.map((route) => `\`${route}\``).join(' | ')}\n\n`
  } else {
    result += 'type StaticRoutes = never\n\n'
  }

  // Generate DynamicRoutes template
  if (dynamicRoutes.length > 0) {
    result += 'type DynamicRoutes<T extends string = string> = '
    const dynamicTemplates: string[] = []

    for (const route of dynamicRoutes) {
      const routeInfo = allRoutes[route]
      const { groups } = routeInfo

      // Convert route pattern to template literal type
      let template = route
      for (const [key, group] of Object.entries(groups)) {
        if (group.repeat) {
          if (group.optional) {
            // Optional catch-all: [[...param]]
            template = template.replace(
              `[[...${key}]]`,
              `\${OptionalCatchAllSlug<T>}`
            )
          } else {
            // Catch-all: [...param]
            template = template.replace(`[...${key}]`, `\${CatchAllSlug<T>}`)
          }
        } else {
          if (group.optional) {
            // Optional param: [[param]]
            template = template.replace(`[[${key}]]`, `\${SafeSlug<T>}`)
          } else {
            // Regular param: [param]
            template = template.replace(`[${key}]`, `\${SafeSlug<T>}`)
          }
        }
      }
      dynamicTemplates.push(`\`${template}\``)
    }

    result += `${dynamicTemplates.join(' | ')}\n\n`
  } else {
    result += 'type DynamicRoutes<T extends string = string> = never\n\n'
  }

  result += `type ValidRoute<T extends string = string> = 
  | StaticRoutes
  | SearchOrHash
  | WithProtocol
  | \`\${StaticRoutes}\${SearchOrHash}\`
  | (T extends \`\${DynamicRoutes<infer _>}\${Suffix}\` ? T : never)

`

  return result
}

export function generateRouteTypesFile(
  routesManifest: RouteTypesManifest
): string {
  const routeTypes = generateRouteTypes(routesManifest)
  const paramTypes = generateParamTypes(routesManifest)
  const layoutSlotMap = generateLayoutSlotMap(routesManifest)
  const routeValidationTypes = generateRouteValidationTypes(routesManifest)

  return `// This file is generated automatically by Next.js
// Do not edit this file manually

${routeTypes}

${paramTypes}

export type ParamsOf<Route extends Routes> = ParamMap[Route]

${layoutSlotMap}

export type { AppRoutes, PageRoutes, LayoutRoutes, RedirectRoutes, RewriteRoutes }
${routeValidationTypes}

declare global {
  /**
   * Props for Next.js App Router page components
   * @example
   * \`\`\`tsx
   * export default function Page(props: PageProps<'/blog/[slug]'>) {
   *   const { slug } = await props.params
   *   return <div>Blog post: {slug}</div>
   * }
   * \`\`\`
   */
  interface PageProps<AppRoute extends AppRoutes> {
    params: Promise<ParamMap[AppRoute]>
    searchParams: Promise<Record<string, string | string[] | undefined>>
  }
  
  /**
   * Props for Next.js App Router layout components
   * @example
   * \`\`\`tsx
   * export default function Layout(props: LayoutProps<'/dashboard'>) {
   *   return <div>{props.children}</div>
   * }
   * \`\`\`
   */
  type LayoutProps<LayoutRoute extends LayoutRoutes> = {
    params: Promise<ParamMap[LayoutRoute]>
    children: React.ReactNode
  } & {
    [K in LayoutSlotMap[LayoutRoute]]: React.ReactNode
  }
}

import type { LinkProps as OriginalLinkProps } from 'next/dist/client/app-dir/link.js';
import type { UrlObject } from 'url';

type LinkRestProps = Omit<
  OriginalLinkProps,
  'href' | 'path' | 'params' | 'searchParams'
>;

/* helper — does this route need params? */
type NeedsParams<R extends Routes> =
  keyof ParamsOf<R> extends never ? false : true;

/**
 * Traditional \`href\` navigation with route validation.
 *
 * @example
 * \`\`\`tsx
 * <Link href="/about">About</Link>
 * <Link href="https://example.com">External</Link>
 * <Link href={{ pathname: '/about', query: { tab: 'contact' } }}>About</Link>
 * \`\`\`
 */
export type LinkPropsWithHref<RouteInferType = string> = LinkRestProps & {
  href: ValidRoute<RouteInferType> | UrlObject;
  path?: never;
  params?: never;
  searchParams?: never;
};

/**
 * Typed \`path\` navigation.
 *
 * * \`params\` is **required** for dynamic routes.  
 * * For static routes it can be omitted or \`{}\`.
 *
 * @example
 * \`\`\`tsx
 * // dynamic
 * <Link path="/blog/[slug]" params={{ slug: 'hello' }}>Post</Link>
 *
 * // static
 * <Link path="/" />
 * <Link path="/" params={{}} />
 * \`\`\`
 */
export type LinkPropsWithPath<T extends Routes> = LinkRestProps &
  (NeedsParams<T> extends true
    ? {
        /** Route template with dynamic segments. */
        path: T;
        /** Parameters matching the template. */
        params: ParamsOf<T>;
        searchParams?: Record<string, string | string[]>;
        href?: never;
      }
    : {
        /** Static route template. */
        path: T;
        /** Optional, may pass \`{}\` for symmetry. */
        params?: Record<never, never>;
        searchParams?: Record<string, string | string[]>;
        href?: never;
      });

export type LinkProps<RouteType extends string = string> =
  | LinkPropsWithHref<RouteType>
  | (RouteType extends Routes ? LinkPropsWithPath<RouteType> : never);

declare module 'next/link' {
  /**
   * A React component that extends the HTML \`<a>\` element to provide
   * [prefetching](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating#2-prefetching)
   * and client-side navigation. This is the primary way to navigate between routes in Next.js.
   *
   * @remarks
   * - Prefetching is only enabled in production.
   *
   * @see https://nextjs.org/docs/app/api-reference/components/link
   *
   * @example
   * \`\`\`tsx
   * // href mode with route validation
   * <Link href="/about">About</Link>
   * <Link href="/blog/my-post">Blog Post</Link>
   *
   * // path mode with typed params
   * <Link path="/blog/[slug]" params={{ slug: 'my-post' }}>
   *   Blog
   * </Link>
   * \`\`\`
   */
  export default function Link<RouteType extends string = string>(
    props: LinkProps<RouteType> & { children: React.ReactNode }
  ): JSX.Element;
}

declare module 'next/navigation' {
  export * from 'next/dist/client/components/navigation.js'

  import type { NavigateOptions, AppRouterInstance as OriginalAppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
  interface AppRouterInstance extends OriginalAppRouterInstance {
    /**
     * Navigate to the provided href.
     * Pushes a new history entry.
     */
    push<RouteType extends Routes = Routes>(href: ValidRoute<RouteType>, options?: NavigateOptions): void
    /**
     * Navigate to the provided href.
     * Replaces the current history entry.
     */
    replace<RouteType extends Routes = Routes>(href: ValidRoute<RouteType>, options?: NavigateOptions): void
    /**
     * Prefetch the provided href.
     */
    prefetch<RouteType extends Routes = Routes>(href: ValidRoute<RouteType>): void
  }

  export function useRouter(): AppRouterInstance;
}

declare module 'next/form' {
  import type { FormProps as OriginalFormProps } from 'next/dist/client/form.js'

  type FormRestProps = Omit<OriginalFormProps, 'action'>

  export type FormProps<RouteInferType = string> = {
    /**
     * \`action\` can be either a \`string\` or a function.
     * - If \`action\` is a string, it will be interpreted as a path or URL to navigate to when the form is submitted.
     *   The path will be prefetched when the form becomes visible.
     * - If \`action\` is a function, it will be called when the form is submitted. See the [React docs](https://react.dev/reference/react-dom/components/form#props) for more.
     */
    action: ValidRoute<RouteInferType> | ((formData: FormData) => void)
  } & FormRestProps

  export default function Form<RouteType = string>(props: FormProps<RouteType>): JSX.Element
}
`
}

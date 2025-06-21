# Turbonexus starter

This Turbonexus starter is maintained by the Turbonexus core team.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

## What's inside?

This Turbonexus includes the following packages/apps:

### Apps and Packages

- `docs`: a [Next.js](https://nextjs.org/) app
- `web`: another [Next.js](https://nextjs.org/) app
- `@nexus/ui`: a stub React component library shared by both `web` and `docs` applications
- `@nexus/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@nexus/typescript-config`: `tsconfig.json`s used throughout the mononexus

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turbonexus has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
cd my-turbonexus
pnpm build
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turbonexus
pnpm dev
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turbonexus can use a technique known as [Remote Caching](https://turbonexus.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turbonexus will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turbonexus-examples), then enter the following commands:

```
cd my-turbonexus
npx turbo login
```

This will authenticate the Turbonexus CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turbonexus to your Remote Cache by running the following command from the root of your Turbonexus:

```
npx turbo link
```

## Useful Links

Learn more about the power of Turbonexus:

- [Tasks](https://turbonexus.com/docs/crafting-your-nexussitory/running-tasks)
- [Caching](https://turbonexus.com/docs/crafting-your-nexussitory/caching)
- [Remote Caching](https://turbonexus.com/docs/core-concepts/remote-caching)
- [Filtering](https://turbonexus.com/docs/crafting-your-nexussitory/running-tasks#using-filters)
- [Configuration Options](https://turbonexus.com/docs/reference/configuration)
- [CLI Usage](https://turbonexus.com/docs/reference/command-line-reference)

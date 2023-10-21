# Astro-MDoc

## About Integration

Astro-MDoc integration allows you to use Markdoc files in your Astro project. This gives you the ability to write your documentation using Markdoc syntax, while also having the flexibility to use Astro components to add interactive elements, such as code blocks, sliders, and quizzes.

Astro-MDoc Integration is created for End-User's need of Server Side Rendering (SSR) the MarkDoc content dynamically at runtime instead of at build time (like `@astrojs/markdoc` package).

We would recommend using this Integration at your own risk, as it is currently under development and expected to have breaking changes until `V1.0.0`

This Project is inspired from MarkDoc's official NextJS plugin and for now has only supports few features MarkDoc NextJS plugin and in future versions of Astro-MDoc it is expected to share the same features as MarkDoc NextJS plugin.

Even though Astro-MDoc is created for SSR rendering it has a lot of feaures missing from `@astrojs/markdoc`.

## Installation 

```sh
# npm
npm astro add astro-mdoc
# yarn
yarn astro add astro-mdoc
# pnpm
pnpm astro add astro-mdoc
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/WYGIN/astro-mdoc/tree/main/sample/astro-mdoc)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/WYGIN/astro-mdoc/tree/main/sample/astro-mdoc)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/WYGIN/astro-mdoc?devcontainer_path=.devcontainer/minimal/devcontainer.json)

> 🧑‍🚀 **Integrate MarkDoc With Astro**. Have fun!

## Examples 

Examples are located under `/sample` or `/packages/app` folder

## Live Preview

You can test `/packages/app` inside your local machine or you can go to the following [live project](https://astro-mdoc-app.vercel.app/)

## 🚀 Project Structure

Inside of your Astro project, you'll need to have the following folders and files:

```text
/
├── public/
├── src/
│   └── markdoc/
│       └── nodes/
|       |   └── index.ts
│       └── tags/
|       |   └── index.ts
│       └── partials/
|       |   └── index.ts
│       └── functions/
|       |   └── index.ts
│       └── variables/
|           └── index.ts
└── package.json
```

Astro-MDoc Integration looks for `.ts` files in the [`src/markdoc/nodes/`, `src/markdoc/tags/`, `src/markdoc/partials/`, `src/markdoc/functions/`, `src/markdoc/variables/`] directory. Each file is exposed as a MarkDoc Config based on the named exports of `.ts` file.

## 📃 Documentation

As i mentioned above, every project should have `src/markdoc/nodes/`, `src/markdoc/tags/`, `src/markdoc/partials/`, `src/markdoc/functions/`, `src/markdoc/variables/` folders but are optional, and every folder must and should have all the exports from `index.ts` file

> ⚠ Note: We use a different approach from [MarkDoc NextJS plugin](https://github.com/markdoc/next.js) and [Astro MarkDoc Integration](https://github.com/withastro/astro/tree/main/packages/integrations/markdoc).
> 
> End-User must and should export a `index.ts` in `src/markdoc/[schema-type]/` folder, and any file with other extention is ignored even `.js` files are also ignored by Astro-MDoc Integration
> 
> The `index.ts` file must be under  `src/markdoc/nodes/`, `src/markdoc/tags/`, `src/markdoc/partials/`, `src/markdoc/functions/`, `src/markdoc/variables/` and any file with `src/markdoc/*.ts` is ignored

The Integration will accept the following options

```ts
allowHTML?: boolean; // currently as of version 0.0.2 allowHTML is not implemented and using it has no effect
markdocPath?: MarkdocPath; // defaults to `src/markdoc`
```

The markdocPath is used to customize the folder structure from where each Markdoc Config file should be scanned. `MarkdocPath` value should be a string or an object that satisfies `MarkdocPathObj` type.

If an End-User passes a string to the `MarkdocPath` the `nodes/index.ts` `tags/index.ts` `partials/index.ts` `variables/index.ts` `functions/index.ts` files are scanned inside the `MarkdocPath`

The `MarkdocPath` accepts an Object with the following structure
```ts
// should be ignored if you dont want to set a base path for all the configs, defaults to empty string

base?: string,

// should be used to set the folder from where `Astro-MDoc` Integration should scan the nodes, example: `src/markdoc/nodes` folder when `base` not specified and `nodes` when base specified

nodes?: string,

// should be used to set the folder from where `Astro-MDoc` Integration should scan tags, example: `src/markdoc/tags` folder when `base` not specified and `tags` when base specified 

tags?: string, 

// should be used to set the folder from where `Astro-MDoc` Integration should scan the variables, example: `src/markdoc/variables` folder when `base` not specified and `variables` when base specified

variables?: string,

// should be used to set the folder from where `Astro-MDoc` Integration should scan the functions, example: `src/markdoc/functions` folder when `base` not specified and `functions` when base specified

functions?: string,

// should be used to set the folder from where `Astro-MDoc` Integration should scan the partials, example: `src/markdoc/partials` folder when `base` not specified and `partials` when base specified

partials?: string,
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into Astro's [Discord server](https://astro.build/chat) for any doubts regarding Astro.

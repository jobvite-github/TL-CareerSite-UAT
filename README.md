# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

## GitHub UAT Board Setup Instructions

This guide walks you through configuring the UAT board to use GitHub for data storage with password protection.

## Prerequisites

- GitHub account
- This repository (user account data will be stored in the `VITE_GITHUB_BRANCH` secret, by default `data`, branch)
- Basic understanding of GitHub personal access tokens

## Step 1: Fork or clone this repository
[Forking](https://github.com/brettwbyron/ReviewAT/fork) - **Make sure to uncheck "Copy the main branch only"**. This sets you up with dummy data but, more importantly, removes the necessary step of creating a `data` branch to host your data (JSON) files.

Cloning - **Make sure to have a place to save your data.** Make sure you have a branch named "data" that contains a folder named "data"

If you rename the repo or the `data` branch, you will need to reflect that change in your `VITE_` secrets and `.env` file.

## Step 2: Create GitHub Personal Access Token

1. Go to **GitHub Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
2. Click **Generate new token**
3. Configure the token:
   - **Name**: UAT Board Data Access
   - **Expiration**: **No expiration** (recommended - see note below)
   - **Repository access**: Select "Only select repositories" and choose your UAT app repository
   - **Permissions**: 
     - Repository permissions → Contents: **Read and write**
4. Click **Generate token**
5. **IMPORTANT**: Copy the token immediately - you won't be able to see it again!

### Why "No expiration"?

Since the token is embedded in client-side code (visible in browser DevTools), token expiration provides **no security benefit** - anyone can extract the token regardless of when it expires.

**With expiration**: Every time the token expires, you must:
- Generate a new token
- Update `.env` 
- Rebuild the app
- Redeploy to GitHub Pages
- All accounts are affected simultaneously

**Without expiration**: The token works indefinitely with no maintenance required.

Token expiration is designed for **server-side secrets** where rotation adds security. For client-side tokens that are already exposed, expiration only creates unnecessary maintenance burden without improving security.

## Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_GITHUB_OWNER=your-github-username
VITE_GITHUB_REPO=uat-app
VITE_GITHUB_TOKEN=github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_GITHUB_BRANCH=data
VITE_ADMIN_PASSWORD=your-secure-admin-password
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv create --template minimal --types ts --install npm ./
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

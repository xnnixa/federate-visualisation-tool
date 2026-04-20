# GitHub Pages Setup for FEDERATE Visualisation Tool

This guide explains how to integrate and deploy the **FEDERATE visualisation tool** with **GitHub Pages**.

It is written for FEDERATE repository maintainers who need to connect the visualisation tool to another repository, such as the building blocks repository.

---
## About the FEDERATE Visualisation Tool

The **FEDERATE Visualisation Tool** is a prototype application for exploring the `CSA-FEDERATE/Proposed-BuildingBlocks` repository within the FEDERATE project.

It provides:

- an overview-based entry point
- a tree view for navigating the repository structure
- a detail panel for inspecting selected items


---


The main goal is to make the repository easier to understand, especially for new developers who do not already know the project structure.

**Live demo (preview version):**  
`https://xnnixa.github.io/federate-visualisation-tool/`

### Project Overview

FEDERATE Building Blocks are organised in a deep directory hierarchy. This tool presents that hierarchy in a more approachable interface so contributors can understand the structure and context more quickly.

### Why this tool exists

The repository can be difficult to navigate directly, especially for newcomers. This explorer helps to:

- lower the entry barrier for new contributors
- provide faster navigation across folders and files
- offer a simple way to inspect selected items
- make it easier to jump from the explorer to GitHub

### Current Features

- Overview view for high-level exploration
- Tree view for path-based navigation
- Detail panel for selected item information
- Search support for locating matching nodes
- Direct links from selected items to GitHub

For step-by-step usage instructions, see `docs/manual.md`.  
For Vite and template-level maintenance notes, see `docs/dev-notes.md`.

### Tech Stack

- React
- TypeScript
- Vite
- React Router
- GitHub Pages (current live deployment)

### Running the Project Locally

```bash
npm install
npm run dev
```
---
### Data Source

The explorer currently uses a JSON representation of the Building Blocks repository structure as its primary data source.

Main input file:

    src/assets/building-blocks_structure.json

JSON generation is supported through CI helper scripts in ci/.

Example workflow:

    bash ci/transform.sh /path/to/Proposed-BuildingBlocks building-blocks_structure.json

### Project Structure
    src/
        components/
        lib/
        pages/
        assets/
    ci/
    test/
    docs/



## Purpose

The FEDERATE visualisation tool can be added to another repository as a Git submodule and then deployed with GitHub Pages.

This setup gives you:

- automatic publishing of the visualisation site
- preview deployments for pull requests
- a simple way to keep the site connected to repository contents

---

## What This Setup Does

The setup has four main parts:

1. Add `federate-visualisation-tool` as a Git submodule
2. Create a `gh-pages` branch for published output
3. Configure GitHub repository settings correctly
4. Add or use GitHub Actions workflows for deployment and PR previews

---

## Prerequisites

Before starting, make sure you have:

- access to the target repository
- permission to change repository settings
- permission to push branches
- Git installed locally
- GitHub Actions enabled in the repository

---

## Repository Integration

### 1. Add the visualisation tool as a submodule

Run this inside the repository that will host the integration:

```bash
git submodule add https://github.com/xnnixa/federate-visualisation-tool.git federate-visualisation-tool
```
This creates:

- a .gitmodules file
- a federate-visualisation-tool/ folder linked as a submodule

After that, commit the change:
```bash
git add .gitmodules federate-visualisation-tool
git commit -m "Add federate-visualisation-tool as submodule"
```
### 2. Update submodules after clone

Anyone cloning the repository later should run:
```bash
git submodule update --init --recursive 
```


This ensures the visualisation tool is downloaded correctly.

# GitHub Pages Branch Setup
## 3. Create a gh-pages branch

The repository needs a gh-pages branch because GitHub Pages will publish from there.

#### If the branch does not already exist, create it:
```bash
git checkout --orphan gh-pages
git rm -rf .
echo "GitHub Pages branch" > README.md
git add README.md
git commit -m "Initialize gh-pages branch"
git push origin gh-pages
```

Then switch back to your working branch:

```bash 
git checkout master 
```

If your main branch is called main, use main instead of master.

# GitHub Repository Settings
## 4. Configure Actions permissions

Open the repository on GitHub and go to:

### Settings → Actions → General

Under Workflow permissions, select:

- Read and write permissions

Also enable:

- Allow GitHub Actions to create and approve pull requests

- Then click Save.

### Why this is needed ?

This allows GitHub Actions to:

- push built files to the gh-pages branch
- create preview comments when needed
- manage deployment-related updates

### Without this, deployment jobs may fail with permission errors such as 403 Forbidden.

## 5. Configure GitHub Pages

Go to:

### Settings → Pages

Set:
```bash
Source: Deploy from a branch
Branch: gh-pages
Folder: / (root)
```
Then click Save.

### Why this is needed

- This tells GitHub Pages to publish the site from the gh-pages branch.

# Deployment Workflow
## 6. Add a deployment workflow

The repository should contain a GitHub Actions workflow that:

- checks out the repository
- updates the visualisation submodule
- builds the site
- deploys the build output to gh-pages

You can use the example repository below as a reference:
```bash
https://github.com/samppanja/federate-visualisation-tool
```
### What the workflow should do ?

A typical deployment workflow should:

- Check out the repository
- Initialize submodules
- Build the visualisation tool
- Publish the built output to gh-pages

 #### Important note

#### The exact workflow file may vary by repository, but the required behavior is the same:

- build from current source
- publish fresh output
- overwrite old published output cleanly
- Pull Request Preview Deployments

## 7. Add PR preview support (optional but recommended)

Preview deployments for pull requests can be created using:

https://github.com/rossjrw/pr-preview-action

This action publishes a preview version of the site for each PR, usually under a path like:
```bash
gh-pages/pr-preview/<pr-number>/
```


### Benefits

PR previews make it easier to:

- review visual changes
- test builds before merge
- confirm deployment behavior

### Important limitation for forked pull requests

#### Preview deployments from forks may fail.

- This is expected because GitHub usually gives fork PR workflows a read-only token for security reasons.

#### Recommended approach

- For preview deployments, use branches pushed to the main repository instead of opening PRs directly from forks.

- This avoids permission issues during preview deployment.

### Workflow Permissions for PR Previews

If the repository uses a preview workflow, make sure the preview workflow includes:
```bash
permissions:
  contents: write
  pull-requests: write
```
### Why this is needed

This allows the preview workflow to:

- push preview output to gh-pages
- comment on pull requests with preview links

Without this, preview deployment may fail with permission errors.

### Triggering Preview Workflow Changes

If the preview workflow uses path filters, make sure workflow file changes also trigger the workflow.

For example, include:
```bash 
paths:
  - '.github/workflows/**'
  ```
### Why this is needed

Without this, editing the preview workflow itself may not trigger a new run, making it hard to test workflow fixes.




# Example Setup Summary

A complete working setup usually includes:

- federate-visualisation-tool added as a submodule
- a  gh-pages branch
- GitHub Actions permissions set to read/write
- GitHub Pages publishing from gh-pages
- a deploy workflow
- an optional preview workflow
- Recommended Setup Order

### Follow this order to avoid confusion:

1. Add the submodule
2. Commit and push the submodule change
3. Create the gh-pages branch
4. Configure GitHub Actions permissions
5. Configure GitHub Pages settings
6. Add deployment workflow
7. Add preview workflow if needed
8. Test deployment
9. Test preview deployment

# How to Verify the Setup
## 8. Verify production deployment

After the workflow is added:

- Push a change to the main branch
- Open the Actions tab
- Check that the deployment workflow runs successfully
- Confirm that gh-pages receives updated files
- Open the GitHub Pages URL and confirm the site loads
###  Expected result
- workflow run is green
- gh-pages branch is updated
- live site is accessible
## 9. Verify PR preview deployment
1. Open a pull request from a branch in the same repository
2. Open the Actions tab
3. Check the preview workflow run
4. Confirm the preview deployment succeeds
5. Look for a comment or link added to the pull request

### Expected result
- preview workflow is triggered
- no 403 Forbidden
- preview URL is posted or visible

## Troubleshooting
#### Deployment fails with 403 Forbidden

Possible cause

    GitHub Actions does not have write access.

### Check

Go to:

    Settings → Actions → General

Make sure:

    Read and write permissions is enabled

Also verify the workflow includes:
```bash
permissions:
  contents: write
  ```
### Preview workflow does not run
#### Possible cause

    The workflow path filters do not include the changed file.

Check

    If you changed a workflow file, ensure the preview workflow includes:

```bash
paths:
  - '.github/workflows/**'

  ```
#### Preview works for same-repo branches but fails for forks
Cause

    This is normal GitHub security behavior.

Explanation

    Fork PR workflows usually get a read-only token and cannot push to gh-pages.

Recommended handling

    Use branches in the main repository for preview deployments.


#### Submodule folder is empty after clone
    Fix

Run:
```bash
git submodule update --init --recursive 
```

### Maintenance Notes
Updating the visualisation tool submodule

When the visualisation tool needs to be updated:

```bash
cd federate-visualisation-tool
git pull origin master
cd ..
git add federate-visualisation-tool
git commit -m "Update visualisation tool submodule"
git push
```
Use main instead of master if the submodule uses main.

Keeping workflows readable

For maintainability:

- keep deployment workflows small
- avoid unrelated workflow edits
- document why permissions are needed
- keep preview setup separate from production deploy when possible


### Reference Links
Example repository
https://github.com/samppanja/federate-visualisation-tool

PR preview action
https://github.com/rossjrw/pr-preview-action

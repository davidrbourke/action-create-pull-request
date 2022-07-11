# create-pull-request

A custom gihub action to create a pull request from a source branch into a target branch

## Inputs

## `source_branch`

**Required** The source branch to pull the merge from. Default `"master"`.

## `target_branch`

**Required** The target branch to merge into. Default `"develop"`.

## `github_token`

**Required** A github token to connect to github API. A PAT can be used, or for limited usage, the auto-generated token: ${{ github.token }}

## `label`

A label to add to the pull request.

## `reviewers`

A comma separated string of github user names to added to the pull request as reviewers

## Outputs

## `pr_title`

The name of the created pull request.

## `html_url`

The html url of the created pull request.

## Example usage
```
uses: ./.github/actions/custom-create-pr # Uses an action in the root directory
  id: create_pr
  with:
    source_branch: 'main'
    target_branch: 'develop'
    github_token: ${{ github.token }}
    label: 'automerge'
    reviewers: 'login1,login2'
```
# Run unit tests
```
npm install
npm run test
```
# Run Linting
```
npm run lint
```
# Recompile changes
To avoid having to check node_modules into the repository changes made to the index.js file must be recompiled, run:
```
npm run prepare
```
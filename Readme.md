# General
A single-page application for a personal blog/notebook implemented, using Typescript & React + Redux.

Works in tandem with a [Python backend](https://github.com/gsoldatov/site_backend).

[Deployment](https://github.com/gsoldatov/site_deployment) repo contains a set of Ansible playbooks for deploying this repo and backend.


# Development
## Setup
0. Setup & start a [backend](https://github.com/gsoldatov/site_backend) instance, as specified in its Readme.md file.
1. Install dependencies:
    ```bash
    npm install 
    ```
2. Add a configuration file at `src/config.json` (see `src/config.json.sample`).

## Starting Development Server
```bash
npm start
```

## Running Tests
```bash
# Run all tests
npm test

# Run test files inside `tests` dir, which paths match the pattern "/objects/view"
npm test /objects/view
```

## Add a New Version
```bash
npm version [patch|minor|major] --force -m "Commit message"
```

## Show Lines of Code
```bash
npx sloc [<dir1> [... <din n>]]
```

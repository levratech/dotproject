# dotproject

A CLI tool to manage project metadata in a `.project` folder within a git repository.

## Installation

```bash
npm install -g dotproject
```

## Usage

### Initialize project

```bash
dot init
```

This command creates a `.project` folder in the repository root (if it doesn't exist), adds starter folders (`stories`, `epics`, `docs`), and writes a basic `.project/config.json` file with metadata.

### Create new story

```bash
dot story new
```

Prompts for story title, risk level, and associated epic, then creates a new file `.project/stories/ST-XXXX.json` with a unique ID, UUID, and timestamps.

## Commands

- `dot init`: Initialize the project structure
- `dot story new`: Create a new story

## Requirements

- Node.js 18+
- Git repository (to locate the project root)

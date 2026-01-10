# Visibl - AI-Native Engineering Design Notebook

A demo-ready single-page web UI that visualizes multi-agent reasoning and MongoDB-backed memory for engineering design artifacts.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

- **Design Artifact Editor**: Input engineering design documents
- **Tool Output**: Displays system reasoning over tool feedback
- **Agent Dialogue**: Visualizes multi-agent collaboration with role-based identification
- **Decision History**: Timeline of persistent decisions with expandable rationale

## Tech Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Fetch API

## API Contract

The UI expects a backend endpoint at `POST /api/analyze` with the contract defined in `types.ts`. The current implementation includes a mock API route for demo purposes.

## Demo Mode

- Click "Load Example" to populate the editor with a sample design artifact
- Click "Analyze" to trigger the multi-agent analysis workflow
- Observe agent dialogue, tool output, and decision history

## Customization

To connect to your actual backend, replace the mock implementation in `app/api/analyze/route.ts` with a call to your backend API.
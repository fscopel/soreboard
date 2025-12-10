---
name: Hackathon Scoreboard Init
overview: Initialize a Vite + React + TypeScript project with Tailwind CSS, designed for modular development. The system will use a registry-based architecture where teams build independent modules that are mapped to layout zones via a configuration file.
todos:
  - id: init-project
    content: Initialize Vite + React + TS project and clean up boilerplate
    status: completed
  - id: setup-tailwind
    content: Install and configure Tailwind CSS
    status: completed
  - id: create-registry
    content: Create module registry and types (Module interface)
    status: completed
  - id: implement-layouts
    content: Implement Layout System (Grid and Split layouts)
    status: completed
  - id: module-wrapper
    content: Create ModuleWrapper component
    status: completed
  - id: weather-module
    content: Implement Weather Module (sample)
    status: completed
  - id: sales-module
    content: Implement Sales Module (sample)
    status: completed
  - id: setup-app
    content: Setup main App to render layout based on config
    status: completed
---

# Hackathon Scoreboard Project Plan

## 1. Project Initialization

- Initialize a new Vite project with React and TypeScript.
- Install and configure Tailwind CSS.
- Set up project structure for modular development.

## 2. Core Architecture

- **Module Registry**: Create `src/modules/registry.ts` to export a dictionary of available modules. This allows teams to "register" their work by adding one line.
- **Layout System**: Create a `Layout` interface.
    - Implement `Grid Layout` (e.g., 3x3 or flexible grid).
    - Implement `Split Layout` (e.g., Sidebar + Main Content).
- **Configuration**: Create `src/config/scoreboard.ts` to define:
    - Active Layout.
    - Mapping of Layout Zones (e.g., "top-left", "sidebar") to Module Keys.

## 3. Implementation

- Create `components/ModuleWrapper.tsx`: A container component to handle standard styling/error boundaries for every module.
- Create `App.tsx`: The main entry point that reads the config and renders the correct Layout with the mapped Modules.

## 4. Sample Modules (Independent Data Fetching)

- **Weather Module**: Fetches/mocks weather data and displays it.
- **Sales Module**: specific mock data for restaurant sales.

## 5. File Structure

- `src/modules/`: Where teams will add their folders.
- `src/layouts/`: Layout components.
- `src/config/`: Configuration files.
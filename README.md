# Y-PoS UI

<img width="2752" height="1404" alt="shaishab316-YPoS-banner" src="https://github.com/user-attachments/assets/81b98844-1c51-4ea9-ba6a-839ee77242b3" />


A restaurant Point of Sale (POS) web application built with Next.js, React, TypeScript, Tailwind CSS, and Redux Toolkit.

Y-PoS UI provides the frontend for restaurant operations, including order management, menu configuration, inventory, production workflows, payments, reporting, table management, and staff administration.

The application communicates with the [Y-PoS](https://github.com/shaishab316/Y-PoS) backend through its REST API and Socket.IO for real-time updates.

---

## Overview

Y-PoS UI is designed as the primary interface for restaurant staff and customers interacting with the Y-PoS platform.

The application provides separate interfaces for authentication, restaurant administration, order management, production workflows, reporting, payment verification, and customer ordering.

The frontend uses:

* **Next.js** for the application framework and routing.
* **React** for building the user interface.
* **TypeScript** for type-safe application development.
* **Redux Toolkit** for global state and API data management.
* **Tailwind CSS** for styling.
* **shadcn/ui and Radix UI** for reusable UI components.
* **React Hook Form and Zod** for form handling and validation.
* **Socket.IO Client** for real-time communication.
* **next-intl** for internationalization.
* **Recharts** for dashboards and reporting visualizations.

---

## Features

### Authentication

* User sign-in
* OTP verification
* Forgot password flow
* Password reset
* Authentication state management
* Role-based access control
* Customer welcome and ordering flows

### Restaurant Operations

* Dashboard with restaurant statistics
* Menu management
* Menu section management
* Item management
* Configurable item packet choices
* Restaurant table management
* Order creation and management
* Order lifecycle tracking
* Collection management
* Operating hours configuration
* Shift management
* User and staff management

### Production

* Production dashboard
* Production station management
* Order production workflow
* Production performance tracking
* Preparation-time reporting
* Real-time order updates

### Payments

* Payment submission
* Payment verification
* Pending payment management
* Payment history
* Payment status tracking
* Payment mismatch handling
* Payment reports
* Receipt generation

### Inventory

* Inventory overview
* Inventory reports
* Stock adjustment
* Inventory activity tracking
* Item-level inventory information

### Reporting & Analytics

* Sales summaries
* Order statistics
* Order breakdowns
* Top-selling items
* Sales-over-time charts
* Orders-per-hour analytics
* Production performance reports
* Inventory reports
* Efficiency reports
* Exportable reports

### UI & Platform

* Responsive layouts
* Mobile-oriented admin and owner interfaces
* Internationalization
* Reusable UI components
* Toast notifications
* Loading and skeleton states
* Camera access for supported workflows
* Receipt and report PDF generation
* Real-time notifications and updates
* Sound notifications for supported workflows

---

## Tech Stack

| Category                | Technology          |
| ----------------------- | ------------------- |
| Framework               | Next.js 16          |
| UI Library              | React 19            |
| Language                | TypeScript          |
| Styling                 | Tailwind CSS 4      |
| Component System        | shadcn/ui, Radix UI |
| State Management        | Redux Toolkit       |
| API Client              | RTK Query           |
| Forms                   | React Hook Form     |
| Validation              | Zod                 |
| Internationalization    | next-intl           |
| Real-time Communication | Socket.IO Client    |
| Charts                  | Recharts            |
| Icons                   | Lucide React        |
| Notifications           | Sonner              |
| PDF Generation          | jsPDF               |
| Screenshot Generation   | html2canvas-pro     |
| Package Manager         | npm                 |

---

## Architecture

Y-PoS UI follows a feature-oriented Next.js application structure.

The application is organized around the Next.js App Router, with locale-aware routing and route groups used to separate authentication and application interfaces.

At a high level:

```text
                    Y-PoS UI
                       |
              Next.js App Router
                       |
          +------------+------------+
          |                         |
       Auth Routes             Application Routes
          |                         |
          |              +----------+----------+
          |              |          |          |
       Sign In         Orders      Menu      Reports
       OTP             Payments    Items     Analytics
       Password        Production  Tables    Inventory
                       |
                Shared Components
                       |
             +---------+---------+
             |                   |
          Redux/RTK Query    Providers
             |                   |
             |             Socket.IO / Sound
             |
          Y-PoS API
             |
       NestJS Backend
```

### Architectural principles

**Feature-oriented structure**

Pages and components are organized around the business functionality they support, such as orders, menu management, production, payments, and reporting.

**Separation of concerns**

Pages handle route-level composition while reusable UI, API logic, validation, state management, and utility functions remain separated.

**Centralized API state**

Backend communication is handled through Redux Toolkit and RTK Query. API endpoints and feature-specific types are grouped under `src/redux/features`.

**Reusable components**

Common UI elements and application-level components are kept separate from feature-specific implementations.

**Type safety**

TypeScript types are maintained alongside feature API definitions to keep frontend code aligned with backend contracts.

**Localization**

Application routes are locale-aware and translations are maintained separately from application logic.

---

## Getting Started

This section covers setting up the frontend for local development.

### Prerequisites

Make sure the following tools are installed:

* Node.js 20 or later
* npm
* Git
* Docker and Docker Compose, if using the containerized development setup

The Y-PoS backend must also be running if you want to use the application against a local API.

### 1. Clone the repository

```bash
git clone https://github.com/shaishab316/Y-PoS-UI.git

cd Y-PoS-UI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create the local environment file:

```bash
cp .env.example .env.local
```

Update the required frontend configuration.

Typical configuration includes:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

Use the actual API and Socket.IO URLs configured for your environment.

The exact environment variables required by the application are defined in the project's environment configuration.

> Never commit `.env.local`, credentials, API keys, or production secrets to version control.

### 4. Start the development server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

## Development

### Available scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the Next.js development server |
| `npm run build` | Build the production application     |
| `npm run start` | Start the production server          |
| `npm run lint`  | Run ESLint                           |

### Recommended workflow

When working on a feature or fixing a bug:

1. Create a feature branch.
2. Identify the relevant route or feature area.
3. Understand the existing component and state flow.
4. Update the required page, component, API endpoint, validation, or state logic.
5. Reuse existing shared components where possible.
6. Run linting and a production build before opening a pull request.
7. Review the final changes for unrelated modifications.

Follow the existing project structure and conventions. Avoid introducing new patterns when the current architecture already provides a suitable solution.

---

## Project Structure

The following is a high-level overview of the frontend:

```text
Y-PoS-UI/
├── public/                    # Static assets
├── messages/                  # Internationalization messages
│   ├── en.json
│   └── id.json
├── src/
│   ├── app/
│   │   └── [locale]/
│   │       ├── (app)/         # Protected application routes
│   │       ├── (auth)/        # Authentication routes
│   │       ├── layout.tsx
│   │       └── page.tsx
│   │
│   ├── assets/                # Application images and graphics
│   │
│   ├── components/
│   │   ├── modal/             # Feature-specific modal components
│   │   ├── shared/            # Reusable application components
│   │   ├── ui/                # Base UI components
│   │   └── wrapper/           # Application-level wrappers
│   │
│   ├── hooks/                 # Reusable React hooks
│   │
│   ├── i18n/                  # Internationalization configuration
│   │
│   ├── lib/                   # General-purpose utilities
│   │
│   ├── providers/             # React context providers
│   │
│   ├── redux/
│   │   ├── api/               # Base API configuration
│   │   ├── features/          # Feature-specific API and types
│   │   ├── hooks.ts
│   │   └── store.ts
│   │
│   ├── utils/                 # Application utilities
│   ├── validation/            # Zod validation schemas
│   └── middleware.ts
│
├── Dockerfile
├── docker-compose.yml
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

---

## Where to Start

If you're new to the codebase, start with these areas:

| Directory             | Purpose                                       |
| --------------------- | --------------------------------------------- |
| `src/app/[locale]/`   | Application routes and page-level composition |
| `src/components/`     | Reusable UI and application components        |
| `src/redux/features/` | API endpoints and feature-specific types      |
| `src/redux/api/`      | Base API configuration                        |
| `src/providers/`      | Socket and application-level providers        |
| `src/validation/`     | Form and request validation schemas           |
| `src/i18n/`           | Internationalization configuration            |
| `src/utils/`          | Authentication and RBAC utilities             |
| `messages/`           | Translation files                             |

A good starting point for a feature is its route under:

```text
src/app/[locale]/(app)/
```

Then follow the page into its components and the corresponding API implementation under:

```text
src/redux/features/
```

For example:

```text
Order Page
    |
    +-- Order Components
    |
    +-- Redux API
    |
    +-- Order Types
    |
    +-- Y-PoS Backend
```

---

## Routing

The application uses the Next.js App Router with locale-based routing.

Routes are organized under:

```text
src/app/[locale]/
```

Authentication pages are grouped under:

```text
src/app/[locale]/(auth)/
```

Main application pages are grouped under:

```text
src/app/[locale]/(app)/
```

The route groups allow authentication and application layouts to remain separated without affecting the public URL structure.

Examples of application areas include:

```text
dashboard
menu
menu-management
item
order
production
production-station
payment-verification
payments-history
inventory-report
efficiency-report
reports
manage-table
shift-workflow
profile
```

---

## State Management & API

Y-PoS UI uses Redux Toolkit with RTK Query for communication with the backend API.

The base API configuration is located at:

```text
src/redux/api/api.ts
```

Feature-specific API definitions are organized under:

```text
src/redux/features/
```

For example:

```text
src/redux/features/
├── auth/
├── collection/
├── dashboard/
├── menu/
├── order/
├── price/
├── production/
├── table/
└── workflow/
```

Each feature generally contains its API definition and related TypeScript types:

```text
feature/
├── feature.api.ts
└── feature.type.ts
```

This keeps backend communication close to the feature that consumes it while maintaining a centralized API configuration.

---

## Real-Time Communication

The application uses Socket.IO Client for real-time communication with the Y-PoS backend.

The Socket.IO provider is located at:

```text
src/providers/SocketProvider.tsx
```

Real-time communication is used for workflows where the UI needs to reflect backend changes without requiring a manual refresh.

The Socket.IO server URL is configured through the frontend environment configuration.

---

## Internationalization

Y-PoS UI uses `next-intl` for internationalization.

Translation files are stored under:

```text
messages/
├── en.json
└── id.json
```

Locale routing and request configuration are handled under:

```text
src/i18n/
├── request.ts
└── routing.ts
```

When adding user-facing text, prefer the existing translation system instead of hardcoding text directly into components.

---

## Forms & Validation

Forms are implemented using React Hook Form.

Zod is used for schema validation.

Validation schemas are organized under:

```text
src/validation/
```

Current validation areas include:

```text
auth.validation.ts
payment.validation.ts
settings.validation.ts
```

The general pattern is:

```text
Form Component
      |
      v
React Hook Form
      |
      v
Zod Schema
      |
      v
Validated Data
      |
      v
RTK Query API
```

Keep validation rules close to the feature they belong to and reuse existing schemas where appropriate.

---

## UI Components

The project uses a layered component structure.

### Base UI

Reusable low-level components are located under:

```text
src/components/ui/
```

Examples include:

* Button
* Input
* Dropdown Menu
* Sheet
* Sidebar
* Skeleton
* Tooltip
* Separator

### Shared Components

Application-wide reusable components are located under:

```text
src/components/shared/
```

These components are intended to be reused across multiple features.

### Feature Modals

Feature-specific modal workflows are located under:

```text
src/components/modal/
```

Examples include:

* Create order
* Edit order
* Add item
* Edit item
* Payment verification
* Order details
* Inventory logs
* Stock adjustment

When building a new feature, prefer existing UI primitives and shared components before creating another implementation of the same pattern.

---

## Authentication & RBAC

Authentication-related utilities are located under:

```text
src/utils/
├── auth.ts
└── rbac.ts
```

Authentication pages are located under:

```text
src/app/[locale]/(auth)/
```

The application also uses wrappers and middleware to control access to protected application routes.

Before adding a new protected route, make sure it follows the existing authentication and role-based access patterns.

---

## PDF & Report Generation

The frontend includes client-side PDF generation for supported reports and receipts.

The project uses:

* `jsPDF`
* `html2canvas-pro`

These libraries are used where the application needs to capture UI content and generate downloadable or printable documents.

Keep report generation logic close to the feature that owns the report while reusing existing utilities and components where possible.

---

## Docker

The repository includes Docker configuration for running the frontend in a containerized environment.

Build the image with:

```bash
docker compose build
```

Start the application:

```bash
docker compose up -d
```

View running containers:

```bash
docker compose ps
```

View application logs:

```bash
docker compose logs -f
```

Stop the application:

```bash
docker compose down
```

Make sure the required environment variables are available to Docker before starting the application.

---

## Production Build

Before deploying, verify that the application can be built successfully:

```bash
npm run build
```

Then start the production server:

```bash
npm run start
```

For containerized deployments, use the project's Docker configuration.

The production environment should use the correct backend API and Socket.IO URLs rather than local development endpoints.

---

## Backend Dependency

Y-PoS UI is a frontend client for the Y-PoS backend.

Backend repository:

**Y-PoS — Restaurant POS API**

The backend provides:

* Authentication
* Menu and item management
* Orders
* Payments
* Inventory
* Production workflows
* Reporting
* Database access
* Real-time communication

For backend architecture, database configuration, API documentation, migrations, and server-side development, refer to the backend repository.

---

## Development Guidelines

When contributing to the frontend:

* Keep components focused on a clear responsibility.
* Prefer reusable components over duplicated UI logic.
* Keep API calls inside the Redux/RTK Query layer.
* Keep validation schemas separate from UI components.
* Use existing UI primitives before introducing new dependencies.
* Follow the existing route and feature structure.
* Keep translations in `messages/`.
* Avoid unnecessary global state.
* Keep feature-specific logic close to its feature.
* Run linting and a production build before submitting changes.

For larger architectural changes, document the reasoning and impact before implementation.

---

## Version

Current version:

```text
1.0.1
```

---

## License

This project is maintained as part of the Y-PoS platform.

---

Built with **Next.js, React, and TypeScript** by [Shaishab Chandra Shil](https://github.com/shaishab316).

# SimpleStock Architecture Overview

## 1. Purpose
SimpleStock is a unified product for managing household and business essentials across two main workflows:
- Inventory management
- Rental and ledger management (KirayaBook)

The app is designed as one product with shared authentication, one common navigation model, and two feature areas that work together.

## 2. Product Scope
The application supports:
- user authentication and protected routes
- inventory item tracking
- item categorization and search
- rental creation and management
- customer tracking
- rental completion and balance handling
- notifications and alerts
- settings, language switching, and logout

## 3. Technology Stack
- Framework: Next.js 15 with App Router
- Language: TypeScript
- UI library: React 19
- Styling: Tailwind CSS
- UI primitives: shadcn/ui and Radix UI
- Backend services: Firebase Auth + Firestore
- Icons: lucide-react
- Date handling: date-fns
- Forms: React Hook Form + Zod

## 4. Application Architecture

### 4.1 App Shell
- The app uses a shared root layout for all pages.
- Global providers manage auth, alerts, language, and toast handling.
- The shell ensures that inventory and ledger modules feel like one unified product.

### 4.2 Feature Modules

#### Inventory Module
The inventory module manages:
- items and stock records
- categories such as groceries, medicines, vegetables, and kitchen items
- item search and filtering
- inventory-related actions such as add and view flows

Main route:
- /inventory

#### Ledger / KirayaBook Module
The ledger module manages:
- customers
- rentals
- rental dates and duration
- advance payments and balances
- rental completion and settlement status
- customer-related rental history

Main route:
- /kirayabook

#### Shared Pages
Shared screens are used across the application:
- / for the unified landing/home experience
- /login for authentication
- /settings for app preferences and account actions

## 5. Routing Model
The app organizes routes by feature area:
- / – home/dashboard
- /inventory – inventory workspace
- /kirayabook – ledger workspace
- /kirayabook/customers – customer list
- /kirayabook/rentals – rentals list
- /kirayabook/complete-rental/[id] – rental completion flow
- /settings – global settings
- /login – login screen

## 6. Folder Structure

```text
src/
  app/                  # route-based screens and pages
  components/           # reusable UI and app-specific UI blocks
  firebase/             # authentication and Firestore logic
  hooks/                # shared hooks for app state and UI behavior
  lib/                  # translations, utilities, and static assets
  types/                # shared TypeScript types
```

## 7. Design Architecture

### Visual direction
The UI follows a modern dark-theme experience with:
- navy background surfaces
- card-based layouts
- teal accent colors
- rounded containers
- compact spacing and strong contrast for readability

### Navigation design
The product uses a shared navigation model so users can transition between Inventory and Ledger without feeling like they are entering separate apps.
Common navigation actions include:
- switching between modules
- opening settings
- logging out

### Page experience
The UI is structured around:
- a central home/dashboard experience
- dedicated workspace pages for inventory and ledger
- consistent cards, forms, headers, and action buttons throughout the app

## 8. State and Data Flow
- Firebase Auth handles login, persistence, and protected access.
- Firestore stores inventory records, customer records, rental records, and related metadata.
- Pages fetch data through service functions and update state locally within the feature UI.
- Alerts and toast messages provide feedback for important actions.

## 9. Authentication and Security Model
- Protected routes rely on auth state.
- Auth is shared across the whole app.
- Logout and account-related actions are centralized through shared auth services.

## 10. Extensibility
The current architecture is built to support future growth by keeping:
- feature modules separate
- shared UI patterns consistent
- common auth and settings behavior centralized
- route structure organized by domain

## 11. Summary
SimpleStock is a single-product, multi-workspace web application that combines inventory and rental management into one unified experience. Its architecture is centered on shared navigation, shared auth, modular feature pages, and a modern dark UI system.

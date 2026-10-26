
# Reach.Online

**AI Agent API Governance Platform**

Understand dependencies. Govern changes. Build reliable agent systems.

> Reach.Online helps developers understand the impact of API and MCP tool contract changes before releasing them.

---

## 1. Project Overview

Reach.Online is a developer-focused platform that analyzes proposed API and MCP tool contract changes, identifies potentially affected AI agents, evaluates governance policies, and produces explainable release-readiness reports.

AI agents depend on APIs and tools to perform tasks. When these contracts change, agents may stop working correctly if they rely on removed, renamed, or modified fields.

Reach.Online provides a structured workflow to identify these changes, trace registered dependencies, evaluate governance requirements, and help developers make informed release decisions.

## 2. Problem Statement

Changes to APIs and MCP tool schemas can introduce compatibility issues for dependent AI agents.

Developers need to understand:

- What changed between the current and proposed contracts?
- Which registered agents and tools might be affected?
- Which changes may be breaking?
- Which governance policies require attention?
- Is the proposed change ready for review?

Reach.Online addresses these challenges through contract analysis, dependency impact assessment, and deterministic governance rules.

## 3. MVP Objectives

- Register AI agents, tools, APIs, and contract versions.
- Manage dependencies between registered components.
- Record explicit consumer expectations for relevant contract fields.
- Compare current and proposed OpenAPI contracts.
- Detect contract changes and potential breaking changes.
- Identify potentially affected agents and tools.
- Evaluate governance policies using deterministic rules.
- Generate release-readiness reports with explanations and required actions.
- Maintain contract-review history in PostgreSQL.
- Demonstrate the platform using a sample university-assistant system.
- Provide optional AI-generated explanations after the core analysis workflow is reliable.

## 4. Technology Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Flow for dependency visualization

### Backend
- Java
- Spring Boot
- Spring Validation
- Spring Data JPA
- REST APIs
- A modular-monolith architecture

### Database
- PostgreSQL
- Neon as the planned managed PostgreSQL provider

### Contract Analysis and Governance
- OpenAPI contract validation and comparison
- Deterministic Java rules
- Dependency impact analysis
- Configurable governance policies

### MCP Demonstration
- TypeScript
- Cloudflare Workers as the planned hosting platform
- MCP-compatible SDK and supported transport

### Optional AI
- An LLM API for explaining verified findings and suggesting remediation steps

### Development and Deployment
- Git and GitHub
- Vercel as the planned frontend hosting platform
- Render as the planned Spring Boot backend hosting platform
- Cloudflare Workers for the MCP demonstration server
- Neon for managed PostgreSQL

*Hosting choices are planned targets and will be validated during implementation.*

## 5. Architecture

```text
                  Developer
                      |
                      v
          +------------------------+
          | Reach.Online Frontend  |
          | Next.js + TypeScript   |
          +------------------------+
                      |
                  REST / HTTPS
                      |
                      v
          +------------------------+
          | Spring Boot Backend    |
          | Java Modular Monolith  |
          +------------------------+
                      |
          +-----------+------------+
          |           |            |
          v           v            v
    Contract      Dependency   Governance
    Analysis      Impact       Policy Engine
    Engine        Engine
          |           |            |
          +-----------+------------+
                      |
                      v
          +------------------------+
          | Neon PostgreSQL        |
          | Registry, Contracts,   |
          | Policies, Reviews      |
          +------------------------+


          MCP DEMONSTRATION ENVIRONMENT

          +------------------------+
          | Sample AI Client       |
          +------------------------+
                      |
                  MCP Transport
                      |
                      v
          +------------------------+
          | Cloudflare Worker      |
          | TypeScript MCP Server  |
          +------------------------+
                      |
                      v
          +------------------------+
          | Dummy University Data  |
          | Timetable and Courses  |
          +------------------------+
```

The contract-governance workflow and MCP runtime demonstration are separate but complementary parts of the project.

The main Spring Boot backend owns registry management, contract analysis, dependency impact, governance decisions, and release-review persistence.

The MCP server exposes demonstration tools. Its contracts and dependencies can be registered in Reach.Online, allowing proposed contract changes to be analyzed independently of the server's runtime execution.

WSO2 API Gateway integration is not part of version 1.

## 6. Core Processing Engines

### 6.1 Contract Analysis Engine

Responsibilities:

- Accept supported current and proposed OpenAPI contracts.
- Validate contract definitions.
- Compare contract versions.
- Detect added, removed, and modified elements.
- Identify potential compatibility issues.
- Produce structured findings for downstream processing.

### 6.2 Dependency Impact Engine

Responsibilities:

- Read registered agents, tools, APIs, and dependencies.
- Match contract changes against declared consumer expectations.
- Trace potentially affected downstream or upstream components.
- Explain why a component has been identified as potentially affected.

A dependency relationship alone does not prove that a consumer relies on a particular field. Relevant consumer expectations must be explicitly registered.

### 6.3 Governance Policy Engine

Responsibilities:

- Evaluate findings against configured policies.
- Identify required reviews and migration actions.
- Check mandatory release requirements.
- Produce a deterministic release-readiness status.

The engine must not depend on an LLM to make governance decisions.

### 6.4 Optional Explanation Engine

Responsibilities:

- Explain verified findings in understandable language.
- Suggest practical remediation steps.
- Summarize the results of contract and dependency analysis.

AI-generated explanations must not invent dependencies, independently determine compatibility, or override the deterministic governance result.

## 7. Sample Demonstration Scenario

Reach.Online will use a fictional university-assistant system.

| Component | Responsibility |
|---|---|
| Orchestrator Agent | Coordinates student requests |
| Timetable Agent | Retrieves timetable information |
| Course Agent | Retrieves course details |
| `get_timetable` | MCP timetable tool |
| `get_course_details` | MCP course-details tool |
| University APIs | Represent underlying data services |

### Example Contract Change

Current response:

```json
{
  "courseId": "SE301",
  "courseName": "Software Engineering",
  "startTime": "09:00"
}
```

Proposed response:

```json
{
  "courseCode": "SE301",
  "courseName": "Software Engineering",
  "startTime": "09:00"
}
```

Reach.Online should:

1. Detect that `courseId` was removed.
2. Detect that `courseCode` was added.
3. Identify registered consumers that expect `courseId`.
4. Trace potentially affected agents through their dependencies.
5. Evaluate applicable governance policies.
6. Generate a release-readiness report with findings and required actions.

The sample MCP server will use dummy university data rather than real institutional services.

## 8. Frontend Pages

### Page 1 — Overview Dashboard

- Registered agent, tool, and API summaries.
- Recent contract reviews.
- Governance findings.
- Interactive dependency graph.
- Recent activity and quick actions.

### Page 2 — Contract Release Review

- Current and proposed contract selection.
- Contract submission interface.
- Contract comparison and changed-field list.
- Potential breaking-change indicators.
- Affected-component dependency graph.
- Governance policy results.
- Release-readiness status.
- Explanation and remediation panel.

### Page 3 — Registry & Governance

- Agent registry.
- Tool and API registry.
- Contract version management.
- Dependency management.
- Consumer expectation management.
- Governance policy configuration.
- Review history.

Authentication is outside the initial local-demo scope.

## 9. Data Model

The planned PostgreSQL entities are:

| Entity | Purpose |
|---|---|
| `agents` | Registered AI agents |
| `tools` | Registered tools and MCP tool definitions |
| `apis` | Registered APIs |
| `api_contracts` | Contract definitions and versions |
| `dependencies` | Relationships between registered components |
| `consumer_expectations` | Fields and contract elements expected by consumers |
| `governance_policies` | Configurable governance rules |
| `release_reviews` | Contract-review requests and overall results |
| `review_findings` | Detected changes, severity, and potential impact |
| `audit_events` | Important actions and recorded review decisions |

The exact schema, constraints, indexes, and relationships will be defined before implementation.

The sample MCP server's university data can initially live in a local data file or a small TypeScript data module. Reach.Online's registry and review records remain in Neon PostgreSQL.

## 10. Development Roadmap

### Phase 0 — Project Foundation
- Finalize the repository structure and architecture decisions.
- Initialize Next.js and Spring Boot.
- Establish configuration and environment variables.
- Set up local development and database connectivity.
- Document the development workflow.

**Deliverable:** A runnable project foundation.

### Phase 1 — Database and Registry
- Design the PostgreSQL schema.
- Implement entities, repositories, and services.
- Build registry REST APIs.
- Add validation and persistence tests.

**Deliverable:** Persistent registry management.

### Phase 2 — Contract Analysis
- Support OpenAPI contract submission and validation.
- Compare current and proposed contract versions.
- Detect additions, removals, modifications, and potential breaking changes.
- Store review records and findings.

**Deliverable:** A working contract-comparison engine.

### Phase 3 — Dependency Impact
- Implement dependency registration.
- Record explicit consumer expectations.
- Trace potentially affected components.
- Test dependency-impact scenarios.

**Deliverable:** Explainable impact analysis.

### Phase 4 — Governance and Reports
- Implement configurable policy rules.
- Evaluate findings and required actions.
- Produce deterministic release-readiness statuses.
- Persist complete review results.

**Deliverable:** An end-to-end backend review workflow.

### Phase 5 — Frontend Integration
- Build the Overview Dashboard.
- Build Contract Release Review.
- Build Registry & Governance.
- Connect the pages to the backend.
- Display contract differences, dependency graphs, and reports.

**Deliverable:** A functional web console.

### Phase 6 — MCP Demonstration
- Implement the TypeScript MCP server.
- Expose `get_timetable` and `get_course_details`.
- Use dummy university data.
- Deploy the server to Cloudflare Workers if the selected SDK and transport are compatible.
- Document the relationship between runtime tool definitions and registered contract versions.

**Deliverable:** A working sample MCP environment.

### Phase 7 — Testing and Deployment
- Test contract comparison and governance rules.
- Add backend, frontend, and integration tests.
- Verify the complete contract-review workflow.
- Deploy the frontend, backend, database, and MCP demonstration.
- Prepare documentation and a demonstration scenario.

**Deliverable:** A portfolio-ready MVP.

### Optional Enhancement — AI Explanations
- Add an LLM-powered explanation layer after deterministic analysis works.
- Generate summaries and remediation suggestions from verified findings.
- Test outputs to ensure the LLM does not override governance decisions.

### Deferred Enhancement — WSO2
WSO2 API Manager or AI Gateway may be considered after the first version reaches a stable state. It is not a v1 dependency or acceptance requirement.

## 11. Engineering Principles

- Keep the Spring Boot backend as a modular monolith.
- Keep contract comparison and governance decisions deterministic.
- Use explicit contracts between frontend and backend.
- Treat dependency impact as potential unless runtime evidence proves otherwise.
- Validate incoming contracts and requests.
- Handle errors consistently.
- Keep secrets out of source control.
- Store persistent governance data in PostgreSQL.
- Test each phase before building dependent features.
- Keep the MCP server separate from the main Java backend.
- Avoid unnecessary infrastructure and premature microservices.

## 12. MVP Acceptance Criteria

The core MVP is complete when a developer can:

1. Open the Reach.Online web console.
2. Register the sample agents, tools, APIs, and dependencies.
3. Submit a proposed supported contract change.
4. View accurate contract differences.
5. Identify potentially affected consumers from registered expectations.
6. Inspect governance policy results and required actions.
7. Obtain a deterministic release-readiness report.
8. Reopen a saved review and inspect its findings.
9. Invoke the sample MCP tools using dummy university data.
10. Run the application using documented configuration and deployment steps.

## 13. Repository Structure

```text
Reach.online/
├── frontend/       # Next.js web console
├── backend/        # Spring Boot REST API
├── mcp-server/     # TypeScript MCP demonstration
├── docs/            # Architecture and technical documentation
├── README.md        # Project overview and roadmap
└── .gitignore
```

## Project Status

**Project:** Reach.Online  
**Version:** 1.0 — MVP  
**Status:** Planning and foundation  
**WSO2 integration:** Deferred

The central engineering goal is to help developers understand, evaluate, and govern changes to the APIs and tools their AI agents depend on.


## Local Development Setup

### Prerequisites

Ensure the following tools are installed:

- Node.js and npm
- Java 21 (JDK)
- Git
- A Neon PostgreSQL account for the cloud database

### Project Structure

```text
Reach.online/
├── frontend/                 # Next.js + TypeScript frontend
├── backend/                  # Spring Boot REST API
├── .gitignore
└── README.md
```

### 1. Configure the Backend

The backend uses Spring Boot, Java 21, Maven Wrapper, and PostgreSQL.

Create a `backend/.env` file with your Neon database credentials:

```properties
DATABASE_URL=jdbc:postgresql://YOUR_NEON_HOST/YOUR_DATABASE?sslmode=require
DATABASE_USERNAME=YOUR_NEON_USERNAME
DATABASE_PASSWORD=YOUR_NEON_PASSWORD
```

Replace the placeholders with your actual Neon connection details. Never commit real credentials to GitHub.

Start the backend:

```bash
cd backend
./mvnw spring-boot:run
```

The API runs on `http://localhost:8080` by default.

**Health endpoints:**

- `GET /api/health` — application health response
- `GET /actuator/health` — Spring Boot Actuator health status

### 2. Configure the Frontend

Create `frontend/.env.local`:

```properties
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Start the frontend in a separate terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

### 3. Run Tests and Build Checks

**Backend tests:**

```bash
cd backend
./mvnw test
```

**Frontend production build:**

```bash
cd frontend
npm run build
```

The backend tests use an in-memory H2 database where configured for tests. The application uses Neon PostgreSQL for its configured runtime database.

### Environment Variables and Security

- Keep `backend/.env` and `frontend/.env.local` out of version control.
- Use `.env.example` files to document required environment variable names without real credentials.
- Never expose database passwords, API keys, or other secrets in source code.
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser and must not contain secrets.

### Current Foundation Status

- [x] Next.js frontend initialized
- [x] Spring Boot backend initialized
- [x] Java 21 configured for backend development
- [x] Backend tests passing
- [x] Frontend production build passing
- [x] Neon PostgreSQL connection verified
- [x] Environment secrets excluded from Git
- [x] Initial foundation changes committed and pushed

### Next Development Phase

The next phase will establish the core application structure, API conventions, database migrations, and initial domain models for contract management, agent/tool registration, dependency tracking, and governance policies.


## Phase 1 — Core Backend Architecture

### Architecture

Reach.Online uses a modular-monolith architecture built with Java 21 and Spring Boot. Business responsibilities are separated into modules while running in a single backend application.

- `common/` — shared API responses and exception handling
- `contract/` — API contract storage and comparison foundations
- `registry/` — AI agent and tool registration
- `dependency/` — agent-to-tool relationships and consumer expectations
- `governance/` — governance policy foundations
- `review/` — release review foundations

### Database Migrations

Flyway manages the PostgreSQL schema. Versioned migration scripts are stored under:

`backend/src/main/resources/db/migration/`

The initial migration creates tables for agents, tools, contracts, agent-tool dependencies, governance policies, and release reviews.

Hibernate uses schema validation rather than automatically changing the database schema.

### Initial Registry API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/registry/agents` | List agents |
| POST | `/api/registry/agents` | Register an agent |
| GET | `/api/registry/tools` | List tools |
| POST | `/api/registry/tools` | Register a tool |

Successful registry responses contain `data` and `timestamp`. Errors contain a timestamp, HTTP status, message, request path, and optional validation details.

### Testing

Run backend tests:

```bash
cd backend
./mvnw test
```

The test environment uses an in-memory H2 database. Flyway applies the initial migration during test startup, and Hibernate validates the resulting schema.
# Reach.Online V2 configuration

## Clerk

The frontend uses `@clerk/nextjs` with Google sign-in configured in Clerk. Set
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in the frontend environment and keep
`CLERK_SECRET_KEY` server-side only if it is needed by deployment tooling.

Configure the Clerk session token template to include the public metadata role
as a top-level claim:

```json
{
  "role": "{{user.public_metadata.role}}"
}
```

The backend reads `role` and defaults to regular-user permissions when the
claim is missing or not equal to `admin`. Configure `CLERK_ISSUER_URI` to the
issuer shown by Clerk so Spring Security validates the JWT signature and
issuer. Do not copy development keys or issuer URLs into production.

## Profiles and workspaces

Profiles are owned by the verified Clerk subject. The owner can edit, publish,
or delete their own profile through `/api/profiles/me`. Authenticated users can
only read profiles that their owners have published through
`/api/profiles/public`; those responses do not include editing controls.

Personal workspace records use the verified Clerk subject as their owner.
Demo workspace writes require the administrator role from the verified Clerk
JWT, while personal workspace writes are limited to the authenticated owner.
The administrator profile remains separate from the shared demo workspace.

## Local development

Frontend:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<Clerk development publishable key>
```

Backend:

```text
DATABASE_URL=<Neon JDBC URL>
DATABASE_USERNAME=<Neon username>
DATABASE_PASSWORD=<Neon password>
CLERK_ISSUER_URI=<Clerk development issuer URL>
APP_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Production deployment

Set the production Clerk publishable key and issuer URL separately from
development. Set `NEXT_PUBLIC_API_BASE_URL` to the deployed Spring Boot API,
and set `APP_CORS_ALLOWED_ORIGINS` to the exact deployed Vercel origin. Add
both local and production URLs to the corresponding Clerk instance's allowed
origins and redirect URLs. Run the V3 Flyway migration against the existing
database; it preserves existing rows as the shared Demo workspace and assigns
new authenticated personal rows to the Clerk subject.

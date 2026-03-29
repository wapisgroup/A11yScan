# Mermaid Diagram Examples

This document demonstrates the Mermaid diagram support in the dev docs viewer.

## Flowchart Example

```mermaid
graph TD
    A[User Visits Site] --> B{Has Subscription?}
    B -->|Yes| C[Access Workspace]
    B -->|No| D[Show Onboarding]
    D --> E[Select Plan]
    E --> F[Create Trial]
    F --> C
    C --> G[Run Accessibility Scans]
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Stripe
    participant Database

    User->>Frontend: Click "Start Trial"
    Frontend->>API: POST /api/stripe/create-trial
    API->>Stripe: Create Customer
    Stripe-->>API: Customer ID
    API->>Stripe: Create Subscription
    Stripe-->>API: Subscription ID
    API->>Database: Save Subscription Data
    Database-->>API: Success
    API-->>Frontend: Trial Created
    Frontend-->>User: Redirect to Workspace
```

## Class Diagram

```mermaid
classDiagram
    class User {
        +String uid
        +String email
        +String displayName
        +createAccount()
        +login()
    }
    
    class Organization {
        +String id
        +String name
        +String stripeCustomerId
        +Array members
        +addMember()
        +removeMember()
    }
    
    class Subscription {
        +String id
        +String organizationId
        +String packageName
        +Date trialEnd
        +Boolean active
        +upgrade()
        +cancel()
    }
    
    class Project {
        +String id
        +String name
        +String url
        +runScan()
        +getResults()
    }
    
    User "1" --> "*" Organization : member of
    Organization "1" --> "1" Subscription : has
    Organization "1" --> "*" Project : owns
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Published: publish()
    Draft --> Archived: archive()
    Published --> Draft: unpublish()
    Published --> Archived: archive()
    Archived --> Draft: restore()
    Archived --> [*]
```

## Gantt Chart

```mermaid
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Planning
    Requirements       :2026-01-01, 14d
    Design            :2026-01-15, 7d
    section Development
    Backend Setup     :2026-01-22, 14d
    Frontend Setup    :2026-01-29, 14d
    Integration       :2026-02-12, 7d
    section Testing
    QA Testing        :2026-02-19, 7d
    UAT               :2026-02-26, 7d
    section Launch
    Production Deploy :2026-03-05, 2d
```

## Pie Chart

```mermaid
pie title Accessibility Issues by Severity
    "Critical" : 15
    "Serious" : 35
    "Moderate" : 45
    "Minor" : 30
```

## Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ ORGANIZATION : "member of"
    ORGANIZATION ||--|| SUBSCRIPTION : has
    ORGANIZATION ||--o{ PROJECT : owns
    PROJECT ||--o{ SCAN : generates
    SCAN ||--o{ ISSUE : contains
    
    USER {
        string uid PK
        string email
        string displayName
        timestamp createdAt
    }
    
    ORGANIZATION {
        string id PK
        string name
        string stripeCustomerId
        timestamp createdAt
    }
    
    SUBSCRIPTION {
        string id PK
        string organizationId FK
        string packageName
        date trialEnd
        boolean active
    }
    
    PROJECT {
        string id PK
        string organizationId FK
        string name
        string url
        timestamp lastScan
    }
    
    SCAN {
        string id PK
        string projectId FK
        timestamp createdAt
        string status
        int issueCount
    }
    
    ISSUE {
        string id PK
        string scanId FK
        string severity
        string wcagCriterion
        string description
    }
```

## Git Graph

```mermaid
gitGraph
    commit id: "Initial commit"
    commit id: "Add auth system"
    branch feature/subscriptions
    checkout feature/subscriptions
    commit id: "Setup Stripe"
    commit id: "Add subscription models"
    checkout main
    branch feature/scanning
    checkout feature/scanning
    commit id: "Add crawler"
    commit id: "Integrate axe-core"
    checkout main
    merge feature/subscriptions
    merge feature/scanning
    commit id: "Release v1.0"
```

## Usage

To add Mermaid diagrams to your documentation:

1. Create a code block with the language set to `mermaid`
2. Add your Mermaid diagram syntax inside the code block
3. The diagram will be automatically rendered when you view the document

Example:

\`\`\`mermaid
graph LR
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`

For more Mermaid syntax and examples, visit: https://mermaid.js.org/

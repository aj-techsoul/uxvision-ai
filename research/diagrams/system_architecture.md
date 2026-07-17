# System Architecture & Design Diagrams

This document contains visual diagrams for the UXVision AI research platform built using Mermaid syntax.

## 1. Use Case Diagram

```mermaid
usecaseDiagram
    actor User as "Client User (Web Developer)"
    actor Gemini as "Gemini API (GenAI Orchestrator)"
    actor Playwright as "Playwright Engine"
    
    rect "UXVision AI Platform" {
        usecase UC1 as "Trigger Website Crawl"
        usecase UC2 as "View Visual Audit Dashboard"
        usecase UC3 as "Interact with XAI Chat Assistant"
        usecase UC4 as "Apply CSS Layout Redesigns"
        usecase UC5 as "Evaluate Machine Learning Models"
        usecase UC6 as "Run OpenCV Computer Vision Filters"
    }

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5

    UC1 ..> Playwright : "Spawns browser"
    UC2 ..> UC6 : "Calculates Symmetry & Whitespace"
    UC3 ..> Gemini : "Explains scoring logic"
```

## 2. Level 1 Data Flow Diagram (DFD)

```mermaid
graph TD
    User([Developer / Auditor]) -- Input URL --> Dashboard[Next.js Dashboard UI]
    Dashboard -- Trigger Audit Request --> API[Next.js API Route /api/analyze]
    API -- Execute Browser Script --> Playwright[Playwright Capturer]
    
    Playwright -- Scrape Data & Screenshots --> API
    
    API -- Base64 Images --> OpenCV[OpenCV Python CV Service]
    OpenCV -- Symmetry & Whitespace Ratios --> API
    
    API -- 15-Feature Array --> Predictor[Python RandomForest Predictor]
    Predictor -- UX Rating & Confidence --> API
    
    API -- Issues Context --> Gemini[Gemini 1.5 Flash API]
    Gemini -- Code Corrections & Remedies --> API
    
    API -- Aggregated Audit Payload --> DB[(IndexedDB Storage)]
    DB -- Read Reports --> Dashboard
    Dashboard -- Render Cards --> User
```

## 3. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Web Developer
    participant Dashboard as Next.js Dashboard
    participant API as Next.js Audit API
    participant Capture as Playwright Capturer
    participant CV as Python OpenCV Engine
    participant Model as Python ML Service
    participant Gemini as Google Gemini API
    participant DB as IndexedDB

    User->>Dashboard: Input URL & Click Audit
    Dashboard->>API: POST /api/analyze { url }
    API->>Capture: captureWebsite(url)
    Capture->>Capture: Spawn Headless Chromium
    Capture-->>API: Bounding Boxes, CSS, Screenshots
    API->>CV: runOpenCVVisualAnalysis(screenshot)
    CV-->>API: Symmetry %, Whitespace %, Alignment %
    API->>Model: predictUIQuality(15-Feature Vector)
    Model-->>API: Rating (Excellent/Good/Poor), Confidence
    API->>Gemini: Request code fixes for detected issues
    Gemini-->>API: Corrected CSS/HTML templates
    API->>DB: Save complete AuditReport object
    DB-->>Dashboard: Return report instance
    Dashboard-->>User: Render visual scores, mockups, XAI panels
```

## 4. Logical Class Diagram

```mermaid
classDiagram
    class CapturedData {
        +String url
        +String html
        +String[] css
        +Object screenshots
        +Object layoutElements
        +Object metadata
    }

    class DOMGraphResult {
        +int totalElements
        +int maxDepth
        +int uniqueTags
        +double semanticCoverageScore
        +double elementDiversityScore
    }

    class CSSGraphResult {
        +int totalRules
        +int mediaQueryCount
        +int animationCount
        +double spacingConsistencyScore
        +double typographyScaleScore
    }

    class CVAnalysisResult {
        +String[] colorPalette
        +double visualHierarchyScore
        +double whitespaceScore
        +double gridScore
        +double typographyScore
        +Object imageMetrics
        +AuditIssue[] issues
    }

    class MLPrediction {
        +String rating
        +double confidence
        +Object[] features
        +Object validationMetrics
    }

    class AuditReport {
        +String id
        +String url
        +String timestamp
        +int overallScore
        +Object subScores
        +AuditIssue[] issues
        +Recommendation[] recommendations
        +MLPrediction mlResult
    }

    AuditReport *-- CapturedData
    AuditReport *-- DOMGraphResult
    AuditReport *-- CSSGraphResult
    AuditReport *-- CVAnalysisResult
    AuditReport *-- MLPrediction
```

## 5. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USER ||--o{ AUDIT_REPORT : requests
    AUDIT_REPORT ||--|{ PAGE_SCAN : contains
    PAGE_SCAN ||--o{ AUDIT_ISSUE : flags
    AUDIT_ISSUE ||--|| RECOMMENDATION : triggers

    USER {
        int id PK
        string email
        string name
        string createdAt
    }

    AUDIT_REPORT {
        string id PK
        string url
        string timestamp
        int overallScore
        string siteNiche
    }

    PAGE_SCAN {
        string url PK
        int score
        int tabsFound
        int hoverTransitions
    }

    AUDIT_ISSUE {
        string id PK
        string category
        string title
        string description
        string severity
        int scoreImpact
        string selector
        string actualValue
        string requiredValue
        string guideline
    }

    RECOMMENDATION {
        string id PK
        string issueId FK
        string problem
        string solution
        string expectedImprovement
        double confidence
        string confidenceLevel
    }
```

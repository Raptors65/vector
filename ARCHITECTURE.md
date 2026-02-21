# Architecture

## Overview

Vector is a two-tier application: a **Next.js frontend** and a **Convex backend**. Convex acts as both the database and the serverless compute layer — it runs the AI pipeline, stores all state, and pushes updates to the frontend in real time via WebSocket subscriptions.

```mermaid
graph TD
    Browser["Browser<br/>Next.js + React"]
    Convex["Convex<br/>DB + Serverless Actions"]
    MiniMax["MiniMax API<br/>MiniMax-M2.5"]
    Rtrvr["rtrvr.ai<br/>Web Research Agent"]

    Browser -- "useQuery (WebSocket)" --> Convex
    Browser -- "useAction (HTTP)" --> Convex
    Convex -- "Theme extraction<br/>Spec generation" --> MiniMax
    Convex -- "Market evidence<br/>(pre-demo)" --> Rtrvr
    Browser -- "CSV upload<br/>(client-side parse)" --> Browser
    Browser -- "ingestCSVData mutation" --> Convex
```

The frontend never calls external APIs directly. All LLM calls and web research go through Convex actions, which keeps API keys server-side and allows the frontend to react to state changes without polling.

---

## Data model

Five tables in Convex. No foreign key constraints — relationships are implicit.

```mermaid
erDiagram
    customers {
        string company
        string segment
        number arr
        boolean churned
        string churn_reason
    }

    support_tickets {
        string customer_id
        number arr
        string issue_text
    }

    usage_metrics {
        string feature_name
        number enterprise_adoption
        number smb_adoption
    }

    analyses {
        string status
        any themes
        any revenue_exposure
        string recommendation
        any spec
    }

    market_evidence {
        string company_name
        string finding
        string source
    }

    customers ||--o{ support_tickets : "customer_id (loose ref)"
```

`analyses` is written progressively — fields are added as each pipeline step completes. The frontend subscribes to `getLatest` and re-renders as new fields arrive.

---

## Analysis pipeline

The pipeline runs as a single Convex action (`runAnalysis`) that orchestrates three external calls and four database writes. Each write updates `status`, which the frontend observes in real time.

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Convex
    participant DB as Convex DB
    participant MiniMax
    participant Rtrvr as rtrvr.ai

    User->>Frontend: Click "Run Analysis"
    Frontend->>Convex: runAnalysis()

    Convex->>DB: create analysis {status: "extracting"}
    DB-->>Frontend: ⚡ status = "extracting"

    Convex->>DB: fetch customers + tickets + usage_metrics
    DB-->>Convex: raw data

    Note over Convex,MiniMax: Tool-use call forces structured JSON output
    Convex->>MiniMax: extract_themes (max_tokens: 4096)
    MiniMax-->>Convex: {top_theme, themes[], stop_building, reasoning}

    Convex->>DB: update {status: "researching", themes}
    DB-->>Frontend: ⚡ status = "researching"

    Note over Convex: Deterministic math — no LLM needed
    Convex->>Convex: computeRevenueExposure()

    Convex->>DB: update {status: "generating", revenue_exposure, recommendation}
    DB-->>Frontend: ⚡ status = "generating"

    Convex->>MiniMax: generate_spec (max_tokens: 16000)
    MiniMax-->>Convex: {schema_changes, api_endpoints, ui_updates, task_graph}

    Convex->>DB: update {status: "complete", spec}
    DB-->>Frontend: ⚡ status = "complete"
    Frontend->>Frontend: Fade animation → show results
```

### Why `max_tokens: 16000` for spec generation?

The spec includes a nested `task_graph` (epics → stories → subtasks). MiniMax serializes nested arrays as JSON strings inside tool_use output. At `4096` tokens the string gets truncated, causing a silent `JSON.parse` failure. `16000` gives enough headroom for a full spec.

---

## Analysis status state machine

```mermaid
stateDiagram-v2
    [*] --> idle : page load, no data
    idle --> extracting : runAnalysis() called
    extracting --> researching : themes extracted
    researching --> generating : revenue computed
    generating --> complete : spec generated
    complete --> extracting : Re-run Analysis
```

Frontend phase management mirrors this but adds a `done` buffer state — when the pipeline hits `complete`, the ASCII animation holds for 2 seconds before fading out to reveal the results panel.

```mermaid
stateDiagram-v2
    direction LR
    [*] --> idle
    idle --> running : isRunning = true
    running --> done : isComplete = true
    done --> content : 2s timeout
    content --> running : Re-run clicked
    idle --> content : page load with existing data
```

---

## Revenue exposure model

Revenue math is deterministic — no LLM involved. Computed synchronously inside the Convex action.

```mermaid
graph TD
    A["All churned customers"] --> B["Filter: churn_reason contains top theme"]
    B --> C["Sum ARR → arr_at_risk"]
    C --> D["Conservative: arr_at_risk × 0.4"]
    C --> E["Moderate: arr_at_risk × 0.6"]
    C --> F["Aggressive: arr_at_risk × 0.8"]
    G["All customers"] --> H["total_arr"]
    G --> I["churned.length / total → current_churn_rate"]
    D & E & F --> J["Right panel selector<br/>(client-side, no backend call)"]
```

The theme matching uses substring search on `churn_reason`, with special-cased synonyms for common patterns (e.g. `"sso"` also matches `"saml"`, `"single sign"`, `"security"`).

---

## Frontend component tree

```mermaid
graph TD
    Page["page.tsx"]

    Page --> Navbar
    Page --> UploadZone_Initial["UploadZone<br/>(initial overlay)"]
    Page --> UploadModal["UploadModal<br/>(navbar trigger)"]
    Page --> LeftPanel
    Page --> CenterPanel
    Page --> RightPanel

    LeftPanel --> SegmentSummary
    LeftPanel --> SignalFeed

    CenterPanel --> AnalysisAnimation["AnalysisAnimation<br/>(canvas, shown while running)"]
    CenterPanel --> RecommendationBanner["RecommendationBanner<br/>(shown when complete)"]
    CenterPanel --> ThemeTable["ThemeTable<br/>(shown when complete)"]
    CenterPanel --> EvidenceSection["EvidenceSection<br/>(shown when complete)"]
    CenterPanel --> SpecPreview["SpecPreview<br/>(shown when complete)"]

    UploadModal --> UploadZone_Modal["UploadZone<br/>(modal instance)"]
```

`CenterPanel` manages a `phase` state (`idle → running → done → content`) that determines which of `AnalysisAnimation` and the results stack is visible. Both are always mounted; opacity transitions between them.

---

## Data flow: CSV upload

CSV files are parsed entirely in the browser — no file is sent to any server. Only the parsed JSON rows are sent to Convex.

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Convex
    participant DB as Convex DB

    User->>Browser: Drop 3 CSV files
    Browser->>Browser: FileReader.readAsText()
    Browser->>Browser: identifyFile() — detect type by headers
    Browser->>Browser: parse rows → typed objects
    Browser->>Convex: ingestCSVData({customers, tickets, usageMetrics})
    Convex->>DB: DELETE all existing rows (3 tables)
    Convex->>DB: INSERT new rows
    DB-->>Browser: ⚡ useQuery(customers.list) fires
    Browser->>Browser: showWarRoom = true → fade transition
```

File type is detected by inspecting the CSV header row — no filename matching needed. This means files can be named anything as long as the columns are correct.

---

## Market evidence: live vs. cached

rtrvr.ai web research runs as a separate action (`refreshEvidence`) so it can be pre-cached with the freshest results before a session. This keeps the main analysis pipeline fast while ensuring the evidence cards always reflect up-to-date market data.

```mermaid
graph LR
    A["refreshEvidence action<br/>(run once before demo)"]
    B["rtrvr.ai /agent"]
    C["market_evidence table"]
    D["runAnalysis action<br/>(runs during demo)"]
    E["CenterPanel<br/>EvidenceSection"]

    A -- "topTheme query" --> B
    B -- "3 evidence cards" --> A
    A -- "marketEvidence.replace()" --> C
    D -- "does NOT call rtrvr.ai" --> D
    C -- "marketEvidence.list()" --> E

    style A fill:#27272a,stroke:#52525b,color:#fff
    style D fill:#27272a,stroke:#52525b,color:#fff
```

If `refreshEvidence` hasn't been run, the table falls back to seed data (Linear, Notion, Figma SAML SSO examples seeded by `seedMarketEvidence`).

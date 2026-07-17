// Browser IndexedDB wrapper for local-first persistent storage
export interface User {
  id?: number;
  email: string;
  name: string;
  password?: string;
  createdAt: string;
}

export interface AuditIssue {
  id: string;
  category: "accessibility" | "visual" | "nlp" | "heuristics" | "performance";
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  scoreImpact: number;
  selector?: string;
  codeSnippet?: string;
  remedy: {
    description: string;
    fixCode?: string;
    targetValue?: string;
    benefit: string;
  };
  resolved?: boolean;
  actualValue?: string;
  requiredValue?: string;
  guideline?: string;
  confidence?: number;
  confidenceLevel?: string;
  helpful?: boolean;
  ignored?: boolean;
}

export interface Recommendation {
  id: string;
  issueId: string;
  category: string;
  problem: string;
  reason: string;
  solution: string;
  expectedImprovement: string;
  impactScore: number;
  element?: string;
  actualValue?: string;
  requiredValue?: string;
  guideline?: string;
  confidence?: number;
  confidenceLevel?: string;
  severity?: string;
}

export interface CarouselSlide {
  title: string;
  subtitle: string;
  points: string[];
  type: "intro" | "issue" | "comparison" | "stats" | "outro";
  metric?: { label: string; value: string };
  beforeText?: string;
  afterText?: string;
}

export interface VideoScene {
  sceneId: number;
  title: string;
  durationSeconds: number;
  narration: string;
  visualCue: string;
  highlightedSection?: string;
}

export interface MLPrediction {
  rating: "Excellent" | "Good" | "Average" | "Poor" | "Bad";
  confidence: number;
  features: {
    name: string;
    value: number;
    weight: number;
  }[];
  validationMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: number[][];
  };
}

export interface PageScanResult {
  url: string;
  score: number;
  interactiveStatesScanned: {
    tabsFound: number;
    buttonsWithHoverTransitions: number;
  };
  screenshots: {
    desktop?: string;
    tablet?: string;
    mobile?: string;
  };
  subScores: {
    accessibility: number;
    visualDesign: number;
    navigation: number;
    typography: number;
    consistency: number;
    usability: number;
    color: number;
    mobile: number;
    performance: number;
  };
  issues: AuditIssue[];
  layoutElements?: any[];
}

export interface AuditReport {
  id: string;
  url: string;
  timestamp: string;
  overallScore: number;
  pagesScanned?: PageScanResult[];
  subScores: {
    accessibility: number;
    visualDesign: number;
    navigation: number;
    typography: number;
    consistency: number;
    usability: number;
    color: number;
    mobile: number;
    performance: number;
  };
  issues: AuditIssue[];
  recommendations: Recommendation[];
  mlResult: MLPrediction;
  carousel: CarouselSlide[];
  videoScript: {
    timeline: VideoScene[];
    voiceoverScript: string;
  };
  layoutElements?: any[];
  screenshots: {
    desktop?: string;
    tablet?: string;
    mobile?: string;
  };
  exploration?: ExplorationRun;
}

export interface ExplorationState {
  id: string;
  url: string;
  screenshot: string; // Base64 image
  scrollPosition: number;
  clickedElementSelector?: string;
  depth: number;
  timestamp: number;
  issuesCount: number;
  score: number;
}

export interface ExplorationRun {
  url: string;
  timestamp: number;
  states: ExplorationState[];
  transitions: { from: string; to: string; trigger: string }[];
  coverage: {
    navigation: number;
    interaction: number;
    clickable: number;
    forms: number;
    visual: number;
    accessibility: number;
    scroll: number;
    journey: number;
    state: number;
  };
  avgJourneyDepth: number;
  totalClicks: number;
  totalScrollEvents: number;
  durationMs: number;
  siteMapMermaid: string;
  journeys: { name: string; path: string[] }[];
  timeline: {
    timestamp: number;
    action: string;
    screenshot: string;
    stateId: string;
  }[];
}

const DB_NAME = "UXVisionDB";
const DB_VERSION = 1;

class UXVisionDB {
  private db: IDBDatabase | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === "undefined") {
      return Promise.reject("IndexedDB is only available in the browser.");
    }

    if (this.db) return Promise.resolve(this.db);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (e) => {
        console.error("Database open error:", e);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Users store for mock auth
        if (!db.objectStoreNames.contains("users")) {
          db.createObjectStore("users", { keyPath: "email" });
        }

        // Audit reports store
        if (!db.objectStoreNames.contains("reports")) {
          db.createObjectStore("reports", { keyPath: "id" });
        }
      };
    });
  }

  // MOCK AUTHENTICATION APIs
  async registerUser(user: User): Promise<User> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("users", "readwrite");
      const store = transaction.objectStore("users");

      // Check if user already exists
      const checkRequest = store.get(user.email);
      checkRequest.onsuccess = () => {
        if (checkRequest.result) {
          reject("User with this email already exists");
          return;
        }

        const addRequest = store.add(user);
        addRequest.onsuccess = () => resolve(user);
        addRequest.onerror = () => reject("Registration failed");
      };
    });
  }

  async loginUser(email: string, passwordSecret: string): Promise<Omit<User, "password">> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("users", "readonly");
      const store = transaction.objectStore("users");
      const request = store.get(email);

      request.onsuccess = () => {
        const user = request.result;
        if (!user || user.password !== passwordSecret) {
          reject("Invalid email or password");
          return;
        }
        const { password, ...safeUser } = user;
        resolve(safeUser);
      };
      request.onerror = () => reject("Authentication failed");
    });
  }

  async getUser(email: string): Promise<Omit<User, "password"> | null> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction("users", "readonly");
      const store = transaction.objectStore("users");
      const request = store.get(email);

      request.onsuccess = () => {
        if (!request.result) {
          resolve(null);
          return;
        }
        const { password, ...safeUser } = request.result;
        resolve(safeUser);
      };
      request.onerror = () => resolve(null);
    });
  }

  // AUDIT REPORT PERSISTENCE
  async saveReport(report: AuditReport): Promise<AuditReport> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("reports", "readwrite");
      const store = transaction.objectStore("reports");
      const request = store.put(report);

      request.onsuccess = () => resolve(report);
      request.onerror = () => reject("Failed to save report");
    });
  }

  async getReport(id: string): Promise<AuditReport | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("reports", "readonly");
      const store = transaction.objectStore("reports");
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject("Failed to retrieve report");
    });
  }

  async getAllReports(): Promise<AuditReport[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("reports", "readonly");
      const store = transaction.objectStore("reports");
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort reports by newest timestamp
        const reports = (request.result || []) as AuditReport[];
        reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(reports);
      };
      request.onerror = () => reject("Failed to retrieve report list");
    });
  }

  async deleteReport(id: string): Promise<string> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("reports", "readwrite");
      const store = transaction.objectStore("reports");
      const request = store.delete(id);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject("Failed to delete report");
    });
  }
}

export const db = new UXVisionDB();

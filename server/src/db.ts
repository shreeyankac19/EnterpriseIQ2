import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, '..');

export const DB_FILE = path.join(DATA_DIR, 'enterpriseiq.db');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const SEED_FILES_DIR = path.resolve(__dirname, '../seed-files');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Ensure seed files exist in uploads directory
if (fs.existsSync(SEED_FILES_DIR)) {
  try {
    const seedFiles = fs.readdirSync(SEED_FILES_DIR);
    for (const file of seedFiles) {
      const dest = path.join(UPLOADS_DIR, file);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(path.join(SEED_FILES_DIR, file), dest);
      }
    }
  } catch (err) {
    console.warn('Could not auto-copy seed files to uploads:', err);
  }
}

let db: Database;

export interface DBRow {
  [key: string]: any;
}

export function saveDatabase(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  }
}

export function queryAll<T = DBRow>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return rows;
}

export function queryGet<T = DBRow>(sql: string, params: any[] = []): T | undefined {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : undefined;
}

export function queryRun(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  db.run(sql, params);
  const rowId = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number || 0;
  saveDatabase();
  return { lastInsertRowid: rowId, changes: 1 };
}

export async function initDatabase(): Promise<Database> {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    const filebuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(filebuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      name TEXT,
      role TEXT,
      department TEXT,
      avatar_initial TEXT
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT,
      filename TEXT,
      file_type TEXT,
      department TEXT,
      confidentiality TEXT,
      file_size_bytes INTEGER,
      formatted_size TEXT,
      content_length_desc TEXT,
      uploaded_by TEXT,
      upload_date TEXT,
      file_path TEXT,
      raw_text TEXT
    );

    CREATE TABLE IF NOT EXISTS document_chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT,
      chunk_index INTEGER,
      content TEXT,
      page_number INTEGER,
      token_count INTEGER,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE,
      name TEXT,
      scope TEXT,
      department TEXT,
      status TEXT,
      progress INTEGER,
      budget REAL,
      actual_spent REAL,
      lead TEXT
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      title TEXT,
      user_id TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      sender TEXT,
      content TEXT,
      sources_json TEXT,
      created_at TEXT,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_name TEXT,
      action TEXT,
      details TEXT,
      created_at TEXT
    );
  `);

  await seedInitialData();
  saveDatabase();
  return db;
}

async function seedInitialData() {
  // Check if users seeded
  const userCount = queryGet<{ count: number }>('SELECT count(*) as count FROM users')?.count || 0;
  if (userCount === 0) {
    db.run(`
      INSERT INTO users (id, username, password, name, role, department, avatar_initial) VALUES
      ('usr-admin', 'admin', 'admin123', 'Eleanor Vance', 'admin', 'Executive', 'E'),
      ('usr-emp', 'employee', 'employee123', 'Alex Rivera', 'employee', 'Operations', 'A'),
      ('usr-sarah', 'sarah', 'sarah123', 'Sarah Jenkins', 'employee', 'Engineering', 'S');
    `);
  }

  // Check if projects seeded (exactly 16 projects matching screen4: 16 total, 6 active, 5 completed, 5 pending!)
  const projCount = queryGet<{ count: number }>('SELECT count(*) as count FROM projects')?.count || 0;
  if (projCount === 0) {
    db.run(`
      INSERT INTO projects (id, code, name, scope, department, status, progress, budget, actual_spent, lead) VALUES
      ('p-1', 'PROJ-CUSTPORTAL', 'Customer Portal', 'Secure self-service customer portal with authenticated billing, identity federation and real-time support ticketing', 'IT', 'Completed', 100, 150000, 142000, 'Marcus Sterling'),
      ('p-2', 'PROJ-SALESDASH', 'Sales Dashboard', 'Executive CRM and pipeline analytics dashboard aggregating conversion funnel, forecast modeling and sales KPIs', 'Sales', 'Pending', 15, 90000, 12000, 'Amanda Patel'),
      ('p-3', 'PROJ-HRAUTO', 'HR Automation', 'Automated onboarding workflows, electronic document signing, and centralized employee lifecycle portal', 'HR', 'Completed', 100, 110000, 108000, 'Carlos Gomez'),
      ('p-4', 'PROJ-INVENTORY', 'Inventory System', 'Real-time multi-warehouse inventory tracking and automated replenishment triggers across global supply nodes', 'Operations', 'Pending', 20, 180000, 24000, 'Alex Rivera'),
      ('p-5', 'PROJ-TITAN', 'Project Titan - Cloud Migration & Microservices', 'Multi-region cloud infrastructure refactoring, Kubernetes migration and distributed microservices deployment', 'Engineering', 'Active', 65, 450000, 310000, 'Sarah Jenkins'),
      ('p-6', 'PROJ-ZEROTRUST', 'Zero-Trust Enterprise Security Infrastructure', 'Hardened perimeter-less corporate network with mutual TLS, SSO identity governance and endpoint compliance verification', 'Engineering', 'Completed', 100, 320000, 312000, 'David Chen'),
      ('p-7', 'PROJ-AUDIT26', 'Fiscal Year 2026 Comprehensive Financial Audit', 'Enterprise-wide ledger reconciliation, tax compliance filing and financial balance sheet consolidation', 'Finance', 'Completed', 100, 180000, 175000, 'Eleanor Vance'),
      ('p-8', 'PROJ-TALENT', 'Global Remote Workforce & Benefits Modernization', 'Cross-border remote compensation matrix, health insurance restructuring and local tax statutory compliance', 'HR', 'Completed', 100, 105000, 99000, 'Carlos Gomez'),
      ('p-9', 'PROJ-SUPPLYAI', 'AI Supply Chain Forecast Optimizer', 'Predictive demand modeling using recurrent transformer models for tier-1 supplier lead time variance', 'Operations', 'Active', 55, 370000, 206000, 'Alex Rivera'),
      ('p-10', 'PROJ-FININTEL', 'Automated Treasury & Cash Flow Engine', 'Continuous liquidity management, multi-currency hedging analytics and automated sweep accounts', 'Finance', 'Active', 40, 150000, 74000, 'Eleanor Vance'),
      ('p-11', 'PROJ-LEGALGDPR', 'Enterprise Data Governance & GDPR Engine', 'Automated data retention enforcement, subject access request workflow and cross-border transfer compliance', 'Legal', 'Active', 70, 140000, 89000, 'Rachel Adams'),
      ('p-12', 'PROJ-DEVOPS2', 'CI/CD Platform Standardization & GitOps', 'Standardized internal developer platform with automated security SAST/DAST testing and zero-downtime rollouts', 'Engineering', 'Active', 50, 220000, 118000, 'Sarah Jenkins'),
      ('p-13', 'PROJ-CYBERSHIELD', 'NextGen SOC & Threat Intelligence System', 'Real-time SIEM event correlation, automated malware sandboxing and phishing quarantine automation', 'Engineering', 'Active', 80, 244000, 192000, 'David Chen'),
      ('p-14', 'PROJ-LEGALCONTRACT', 'Automated Vendor Contract Lifecycle Platform', 'AI contract extraction, clause risk scoring and electronic counterparty signature workflow', 'Legal', 'Pending', 10, 115000, 24000, 'Rachel Adams'),
      ('p-15', 'PROJ-MOBILEAPP', 'Field Service Mobile Application Suite', 'Offline-first React Native mobile app for regional field engineers with geo-tagged asset inspection', 'IT', 'Pending', 25, 130000, 31000, 'Marcus Sterling'),
      ('p-16', 'PROJ-MARKETPULSE', 'Brand Sentiment & Market Competitive Matrix', 'Multi-channel brand social listener, competitor feature gap analysis and marketing attribution pipeline', 'Sales', 'Pending', 30, 85000, 22000, 'Amanda Patel');
    `);
  }

  // Check if documents seeded (matches screen1 & screen_dash5: 7 indexed documents across CSV, XLSX, PDF, DOCX)
  const docCount = queryGet<{ count: number }>('SELECT count(*) as count FROM documents')?.count || 0;
  if (docCount === 0) {
    const docs = [
      {
        id: 'doc-1',
        title: 'Sales Summary Q3',
        filename: 'sales_summary_q3.csv',
        file_type: 'CSV',
        department: 'General',
        confidentiality: 'Internal',
        file_size_bytes: 53,
        formatted_size: '53 B',
        content_length_desc: '2 rows (1 chunks)',
        uploaded_by: 'Eleanor Vance',
        upload_date: 'Oct 27, 2026',
        raw_text: `Quarter,Region,Total_Revenue_USD,New_Enterprise_Deals,Net_Retention_Rate
Q3 2026,North America,14200000,24,118%
Q3 2026,EMEA,8900000,16,114%
Q3 2026,APAC,6400000,11,122%`
      },
      {
        id: 'doc-2',
        title: 'Customer Satisfaction (CSAT) Survey & Metrics Q3',
        filename: 'Customer_Satisfaction_and_Support_Metrics_Q3.csv',
        file_type: 'CSV',
        department: 'Operations',
        confidentiality: 'Internal',
        file_size_bytes: 1638,
        formatted_size: '1.6 KB',
        content_length_desc: '10 rows (1 chunks)',
        uploaded_by: 'Alex Rivera',
        upload_date: 'Oct 27, 2026',
        raw_text: `Month,Channel,CSAT_Score,Resolution_Time_Hours,Tickets_Resolved,Escalation_Rate
July,Enterprise Portal,94.2,2.4,1420,1.8%
July,Phone Support,91.8,4.1,890,3.2%
July,Email Support,88.5,8.2,3200,4.5%
August,Enterprise Portal,95.1,2.1,1540,1.4%
August,Phone Support,92.4,3.8,920,2.9%
August,Email Support,89.1,7.9,3310,4.1%
September,Enterprise Portal,96.3,1.9,1680,1.1%
September,Phone Support,93.0,3.5,950,2.5%
September,Email Support,90.4,7.2,3420,3.7%`
      },
      {
        id: 'doc-3',
        title: 'Global Procurement & Vendor Matrix',
        filename: 'Global_Procurement_and_Vendor_Contract_Matrix.xlsx',
        file_type: 'XLSX',
        department: 'Operations',
        confidentiality: 'Confidential',
        file_size_bytes: 6758,
        formatted_size: '6.6 KB',
        content_length_desc: '13 rows (2 chunks)',
        uploaded_by: 'Alex Rivera',
        upload_date: 'Oct 27, 2026',
        raw_text: `Vendor Name,Category,Annual Contract Value,Renewal Date,Clearance Required,Key Deliverable
Amazon Web Services,Cloud Infrastructure,$580,000,Dec 31, 2026,Confidential,Compute clusters & S3 data stores
Snowflake Inc.,Data Warehousing,$240,000,Nov 15, 2026,Confidential,Central enterprise analytical warehouse
Salesforce,CRM & Customer Success,$195,000,Jan 31, 2027,Internal,Global sales pipeline and account database
CrowdStrike,Cybersecurity & Endpoint,$145,000,Oct 30, 2026,Confidential,Falcon sensor real-time endpoint telemetry
Slack Technologies,Communications,$85,000,Feb 28, 2027,Internal,Enterprise Grid corporate workspace
Workday,Human Capital Management,$165,000,Mar 31, 2027,Confidential,Employee directory, payroll and benefits portal`
      },
      {
        id: 'doc-4',
        title: 'Project Titan Architecture Specification',
        filename: 'Project_Titan_Cloud_Architecture_Specification.pdf',
        file_type: 'PDF',
        department: 'Engineering',
        confidentiality: 'Internal',
        file_size_bytes: 2764,
        formatted_size: '2.7 KB',
        content_length_desc: '1 pages (3 chunks)',
        uploaded_by: 'Sarah Jenkins',
        upload_date: 'Oct 27, 2026',
        raw_text: `PROJECT TITAN ARCHITECTURE SPECIFICATION (PROJ-TITAN)
Lead Architect: Sarah Jenkins | Department: Engineering | Status: Active | Progress: 65%

1. Executive Architecture Summary
Project Titan transitions the legacy monolithic backend into a distributed event-driven microservices architecture hosted on multi-region AWS Kubernetes (EKS).

2. Core Architectural Pillars
- Event Bus: Apache Kafka with 99.999% availability SLA and transactional outbox pattern.
- Primary Database: PostgreSQL 16 with read replicas across us-east-1 and eu-central-1.
- In-Memory Cache: Redis 7.2 cluster for sub-millisecond session validation and hot RAG cache.
- Service Mesh: Istio with automated mutual TLS (mTLS) enforcement and zero-trust sidecar proxies.
- Zero Downtime: Blue/Green canary deployments via ArgoCD GitOps pipelines.

3. Milestone Status
- Milestone 1: VPC Peering and Multi-AZ Subnet configuration (Completed - Oct 10, 2026)
- Milestone 2: Microservice containerization and Helm chart standardization (Completed - Oct 22, 2026)
- Milestone 3: Production traffic shadow testing and failover verification (In Progress - Target: Nov 15, 2026)`
      },
      {
        id: 'doc-5',
        title: 'Global Employee Benefits & Workplace Guidelines',
        filename: 'Global_Employee_Benefits_and_Workplace_Guidelines.docx',
        file_type: 'DOCX',
        department: 'HR',
        confidentiality: 'Internal',
        file_size_bytes: 37478,
        formatted_size: '36.6 KB',
        content_length_desc: '10 pages (5 chunks)',
        uploaded_by: 'Sarah Jenkins',
        upload_date: 'Oct 27, 2026',
        raw_text: `GLOBAL EMPLOYEE BENEFITS & WORKPLACE GUIDELINES (HR-POL-2026)
Effective Date: Fiscal Year 2026 | Department: Human Resources | Clearance: Internal

1. Paid Time Off (PTO) Policy
Full-time regular employees accrue 25 business days of paid time off per calendar year. Up to 5 unused PTO days may roll over into Q1 of the following fiscal year. PTO requests exceeding 3 consecutive days must be submitted at least 14 days in advance via the HR Self-Service Portal.

2. Flexible & Remote Work Arrangement
Employees in eligible teams can work remotely up to 3 days per week with manager approval. All remote workers receive a one-time home office equipment stipend of $1,200 upon onboarding, and a monthly $100 internet and utilities reimbursement.

3. Health & Wellness Coverage
Comprehensive health, vision, and dental insurance premiums are 100% employer-covered for individual employees and 80% for dependents. Mental wellness subscriptions (Headspace/Calm) and an annual wellness bonus of $800 are provided.

4. Professional Learning & Development Stipend
Each full-time team member has an annual learning stipend of $2,500 for professional certifications, conferences, and technical books, subject to manager pre-approval.`
      },
      {
        id: 'doc-6',
        title: 'Q3 2026 Executive Financial Performance Audit',
        filename: 'Q3_2026_Executive_Financial_Audit.pdf',
        file_type: 'PDF',
        department: 'Finance',
        confidentiality: 'Confidential',
        file_size_bytes: 3072,
        formatted_size: '3 KB',
        content_length_desc: '1 pages (3 chunks)',
        uploaded_by: 'Eleanor Vance',
        upload_date: 'Oct 27, 2026',
        raw_text: `CONFIDENTIAL EXECUTIVE FINANCIAL PERFORMANCE AUDIT - Q3 2026
Auditor: Eleanor Vance, CFO | Clearance: Confidential (Executive & Finance Only)

1. Financial Overview
- Gross Enterprise Revenue: $29.5 Million (+18.4% YoY)
- Operating Margin: 31.2% (Target: 28.0%)
- Cash & Short-Term Liquid Equivalents: $44.8 Million
- Capital Expenditures: $4.2 Million (Primarily Project Titan infrastructure)

2. Cross-Departmental Budget Utilization
- Engineering: $814,000 spent out of $1,230,000 budget (66% utilized)
- Finance: $249,000 spent out of $330,000 budget (75% utilized)
- HR: $107,000 spent out of $215,000 budget (50% utilized)
- Legal: $113,000 spent out of $255,000 budget (44% utilized)
- Operations: $230,000 spent out of $550,000 budget (42% utilized)

3. Auditor Notes & Risk Assessment
All accounts are reconciled in accordance with GAAP standards. No material discrepancies detected.`
      },
      {
        id: 'doc-7',
        title: 'Enterprise Data Governance & Compliance Policy',
        filename: 'Enterprise_Data_Governance_Compliance_Policy.docx',
        file_type: 'DOCX',
        department: 'Legal',
        confidentiality: 'Confidential',
        file_size_bytes: 4096,
        formatted_size: '4.0 KB',
        content_length_desc: '2 pages (2 chunks)',
        uploaded_by: 'Eleanor Vance',
        upload_date: 'Oct 27, 2026',
        raw_text: `ENTERPRISE DATA GOVERNANCE & COMPLIANCE POLICY (LEG-GOV-2026)
Department: Legal & Compliance | Clearance: Confidential

1. Confidentiality Tiers & Access Controls
- Internal Tier: Accessible to all active corporate employees for business operations.
- Confidential Tier: Restricted to verified managers, executive personnel, and authorized audit team members.
- Restricted Tier: Strict least-privilege access governed by zero-trust identity checks and cryptographic keys.

2. Document Retention & Archival
All customer records and contractual agreements must be retained for 7 years in write-once-read-many (WORM) storage. Financial audit records are maintained indefinitely.`
      }
    ];

    for (const d of docs) {
      db.run(
        `INSERT INTO documents (id, title, filename, file_type, department, confidentiality, file_size_bytes, formatted_size, content_length_desc, uploaded_by, upload_date, file_path, raw_text)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [d.id, d.title, d.filename, d.file_type, d.department, d.confidentiality, d.file_size_bytes, d.formatted_size, d.content_length_desc, d.uploaded_by, d.upload_date, '', d.raw_text]
      );

      // Create chunks for document
      const chunks = splitTextIntoChunks(d.raw_text, 400);
      chunks.forEach((chunk, idx) => {
        db.run(
          `INSERT INTO document_chunks (id, document_id, chunk_index, content, page_number, token_count)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [`chk-${d.id}-${idx}`, d.id, idx + 1, chunk, Math.floor(idx / 2) + 1, chunk.split(/\s+/).length]
        );
      });
    }
  }

  // Check if chat sessions seeded (matches screen3: chat history entries)
  const chatCount = queryGet<{ count: number }>('SELECT count(*) as count FROM chat_sessions')?.count || 0;
  if (chatCount === 0) {
    db.run(`
      INSERT INTO chat_sessions (id, title, user_id, created_at, updated_at) VALUES
      ('chat-1', 'What is the secret recipe for Martian chocolate cookies?', 'usr-admin', '2026-10-28 20:50:00', '2026-10-28 20:52:00'),
      ('chat-2', 'What is the PTO policy and remote work guidelines?', 'usr-admin', '2026-10-28 20:30:00', '2026-10-28 20:31:00'),
      ('chat-3', 'How many projects are completed?', 'usr-admin', '2026-10-28 20:20:00', '2026-10-28 20:21:00'),
      ('chat-4', 'Project Titan architecture and tech stack overview', 'usr-admin', '2026-10-28 19:40:00', '2026-10-28 19:42:00');
    `);

    // Add messages to chat-1 (matches screen3 exactly!)
    const sourcesJson1 = JSON.stringify([]);
    const sourcesJson2 = JSON.stringify([
      {
        type: 'database',
        title: 'Database: projects table',
        detail: "Table: projects (status = 'Completed')",
        reference: "PROJ-CUSTPORTAL, PROJ-HRAUTO, PROJ-ZEROTRUST, PROJ-AUDIT26, PROJ-TALENT"
      }
    ]);

    db.run(
      `INSERT INTO chat_messages (id, session_id, sender, content, sources_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ['msg-1', 'chat-1', 'user', 'What is the secret recipe for Martian chocolate cookies?', sourcesJson1, '2026-10-28 20:50:10']
    );
    db.run(
      `INSERT INTO chat_messages (id, session_id, sender, content, sources_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ['msg-2', 'chat-1', 'assistant', 'I could not find information regarding this in the uploaded company documents and records. Please ensure that the relevant file has been uploaded to the Document Management section, or verify that your account has the appropriate confidentiality clearance.', sourcesJson1, '2026-10-28 20:50:12']
    );
    db.run(
      `INSERT INTO chat_messages (id, session_id, sender, content, sources_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ['msg-3', 'chat-1', 'user', 'HOW MANY PROJECTS ARE COMPLETED', sourcesJson1, '2026-10-28 20:51:30']
    );
    db.run(
      `INSERT INTO chat_messages (id, session_id, sender, content, sources_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ['msg-4', 'chat-1', 'assistant', 'According to the EnterpriseIQ database, there are currently **5 completed projects**.\n\nNotable completed projects include: Customer Portal (PROJ-CUSTPORTAL), HR Automation (PROJ-HRAUTO), Zero-Trust Enterprise Security Infrastructure (PROJ-ZEROTRUST), Fiscal Year 2026 Comprehensive Financial Audit (PROJ-AUDIT26), Global Remote Workforce & Benefits Modernization (PROJ-TALENT)..', sourcesJson2, '2026-10-28 20:51:32']
    );

    // Add messages to chat-2
    const ptoSources = JSON.stringify([
      {
        type: 'document',
        title: 'Document: Global_Employee_Benefits_and_Workplace_Guidelines.docx',
        detail: 'Department: HR | Clearance: Internal | Section 1 & 2',
        reference: 'Full-time employees accrue 25 business days of PTO per calendar year. Remote work allowed up to 3 days/week with $1,200 equipment stipend.'
      }
    ]);
    db.run(
      `INSERT INTO chat_messages (id, session_id, sender, content, sources_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ['msg-201', 'chat-2', 'user', 'What is the PTO policy and remote work guidelines?', sourcesJson1, '2026-10-28 20:30:10']
    );
    db.run(
      `INSERT INTO chat_messages (id, session_id, sender, content, sources_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ['msg-202', 'chat-2', 'assistant', 'According to the **Global Employee Benefits & Workplace Guidelines** document:\n\n- **Paid Time Off (PTO)**: Regular full-time employees accrue **25 business days** of paid time off per calendar year. Up to 5 unused PTO days can roll over into Q1 of the following year.\n- **Remote Work Guidelines**: Eligible employees may work remotely up to **3 days per week** with manager pre-approval.\n- **Equipment Stipend**: All remote employees receive a one-time **$1,200 home office equipment stipend** upon onboarding and a monthly **$100 internet/utilities reimbursement**.', ptoSources, '2026-10-28 20:30:13']
    );
  }
}

export function splitTextIntoChunks(text: string, chunkSize: number = 400): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + '\n\n' + para).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

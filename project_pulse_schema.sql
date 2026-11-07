BEGIN;
DO $$ BEGIN
    IF current_database() <> 'project_pulse' THEN
        RAISE EXCEPTION 'Connect to project_pulse before running this schema';
    END IF;
END $$;

-- Module 1: Users
CREATE TABLE roles (
    role_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    role_description VARCHAR(255)
);
CREATE TABLE users (
    user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(role_id),
    fname VARCHAR(100) NOT NULL,
    lname VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    account_status VARCHAR(20) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Module 2: Project setup
CREATE TABLE student_groups (
    group_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_name VARCHAR(150) NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE group_members (
    member_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES student_groups(group_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    role_in_group VARCHAR(50) NOT NULL DEFAULT 'Member',
    UNIQUE (group_id, user_id)
);

-- Module 2 additions (added 2026-11-02)
ALTER TABLE student_groups
    ADD COLUMN IF NOT EXISTS group_code VARCHAR(20) UNIQUE,
    ADD COLUMN IF NOT EXISTS course VARCHAR(20) NOT NULL DEFAULT 'BSIT',
    ADD COLUMN IF NOT EXISTS section VARCHAR(20) NOT NULL DEFAULT 'A',
    ADD COLUMN IF NOT EXISTS school_year VARCHAR(9) NOT NULL DEFAULT '2025-2026',
    ADD COLUMN IF NOT EXISTS semester VARCHAR(20) NOT NULL DEFAULT '1st Semester';

ALTER TABLE group_members
    ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP NULL;

CREATE TABLE projects (
    project_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id INTEGER NOT NULL UNIQUE REFERENCES student_groups(group_id),
    project_title VARCHAR(255),
    project_description TEXT,
    project_status VARCHAR(30) NOT NULL DEFAULT 'Ongoing',
    current_stage VARCHAR(30) NOT NULL DEFAULT 'Proposal',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE title_submissions (
    title_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    proposed_title VARCHAR(255) NOT NULL,
    project_description TEXT,
    technology_stack VARCHAR(255),
    title_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    review_remarks TEXT,
    reviewed_by INTEGER REFERENCES users(user_id),
    reviewed_at TIMESTAMP
);
CREATE TABLE adviser_assignments (
    assignment_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    adviser_id INTEGER NOT NULL REFERENCES users(user_id),
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    adviser_type VARCHAR(50) NOT NULL DEFAULT 'Adviser',
    UNIQUE (adviser_id, project_id, adviser_type)
);

-- Module 3: Documents
CREATE TABLE documents (
    document_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    submitted_by INTEGER NOT NULL REFERENCES users(user_id),
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_status VARCHAR(20) NOT NULL DEFAULT 'Submitted',
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE document_versions (
    version_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    version_no INTEGER NOT NULL DEFAULT 1,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    submitted_by INTEGER NOT NULL REFERENCES users(user_id),
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    UNIQUE (document_id, version_no)
);
CREATE TABLE document_feedback (
    feedback_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    version_id INTEGER NOT NULL REFERENCES document_versions(version_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    feedback_text TEXT NOT NULL,
    feedback_type VARCHAR(50) NOT NULL DEFAULT 'Comment',
    feedback_status VARCHAR(20) NOT NULL DEFAULT 'Open',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Module 3b: Requirements (added 2026-11-05; also created by the Laravel migration
-- 2026_11_05_000000_create_requirements_tables in project-pulse-backend)
CREATE TABLE requirements (
    requirement_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    stage VARCHAR(30) NOT NULL,
    submission_type VARCHAR(10) NOT NULL DEFAULT 'File' CHECK (submission_type IN ('File', 'Link')),
    due_date DATE,
    course VARCHAR(20),
    adviser_id INTEGER REFERENCES users(user_id),
    created_by INTEGER NOT NULL REFERENCES users(user_id),
    needs_grammar_check BOOLEAN NOT NULL DEFAULT FALSE,
    is_final_output BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE requirement_submissions (
    submission_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    requirement_id INTEGER NOT NULL REFERENCES requirements(requirement_id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    submission_status VARCHAR(20) NOT NULL DEFAULT 'Submitted'
        CHECK (submission_status IN ('Submitted', 'Needs Revision', 'Approved')),
    version_no INTEGER NOT NULL DEFAULT 1,
    file_name VARCHAR(255),
    file_path VARCHAR(255),
    link_url VARCHAR(500),
    notes TEXT,
    submitted_by INTEGER NOT NULL REFERENCES users(user_id),
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    review_remarks TEXT,
    reviewed_by INTEGER REFERENCES users(user_id),
    reviewed_at TIMESTAMP,
    grammar_status VARCHAR(20) CHECK (grammar_status IN ('Approved', 'Needs Revision')),
    grammar_remarks TEXT,
    grammar_reviewed_by INTEGER REFERENCES users(user_id),
    grammar_reviewed_at TIMESTAMP,
    received_by INTEGER REFERENCES users(user_id),
    received_at TIMESTAMP,
    UNIQUE (requirement_id, project_id)
);

-- Module 4: Monitoring
CREATE TABLE monitoring (
    monitoring_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    updated_by INTEGER NOT NULL REFERENCES users(user_id),
    stage VARCHAR(50) NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    remarks TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE milestones (
    milestone_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    milestone_name VARCHAR(150) NOT NULL,
    description TEXT,
    due_date DATE,
    completed_date DATE,
    milestone_status VARCHAR(20) NOT NULL DEFAULT 'Pending'
);

-- Module 5: Defense
CREATE TABLE defenses (
    defense_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    defense_type VARCHAR(50) NOT NULL,
    defense_date DATE,
    defense_time TIME,
    venue VARCHAR(150),
    defense_status VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    defense_result VARCHAR(50),
    scheduled_by INTEGER NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_by INTEGER REFERENCES users(user_id),
    acknowledged_at TIMESTAMP,
    remarks TEXT
);
CREATE TABLE panel_assignments (
    assignment_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    defense_id INTEGER NOT NULL REFERENCES defenses(defense_id) ON DELETE CASCADE,
    panelist_id INTEGER NOT NULL REFERENCES users(user_id),
    role VARCHAR(50) NOT NULL DEFAULT 'Member',
    panel_status VARCHAR(20) NOT NULL DEFAULT 'Assigned',
    assigned_by INTEGER NOT NULL REFERENCES users(user_id),
    UNIQUE (defense_id, panelist_id)
);
CREATE TABLE evaluations (
    evaluation_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    defense_id INTEGER NOT NULL REFERENCES defenses(defense_id) ON DELETE CASCADE,
    panelist_id INTEGER NOT NULL REFERENCES users(user_id),
    score DECIMAL(5,2),
    remarks TEXT,
    evaluation_status VARCHAR(20) NOT NULL DEFAULT 'Draft',
    recommendation VARCHAR(30),
    evaluated_at TIMESTAMP,
    UNIQUE (defense_id, panelist_id)
);

-- Module 6: Communication
CREATE TABLE conversations (
    conversation_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INTEGER REFERENCES projects(project_id) ON DELETE CASCADE,
    conversation_type VARCHAR(50) NOT NULL DEFAULT 'Individual',   -- 'Direct' or 'Group'
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    direct_key VARCHAR(40)                                         -- "smallerUserId-largerUserId" for a Direct chat
);
CREATE UNIQUE INDEX conversations_direct_key_unique ON conversations (direct_key) WHERE direct_key IS NOT NULL;
CREATE UNIQUE INDEX conversations_group_project_unique ON conversations (project_id) WHERE conversation_type = 'Group';
CREATE TABLE conversation_participants (
    participant_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_read_message_id INTEGER NOT NULL DEFAULT 0,
    UNIQUE (conversation_id, user_id)
);
CREATE TABLE messages (
    message_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(user_id),
    message_content TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    message_status VARCHAR(20) NOT NULL DEFAULT 'Sent'            -- 'Sent' or 'Unsent'
);
CREATE INDEX messages_conversation_idx ON messages (conversation_id, message_id);
-- One row: when students may send messages (Asia/Manila time). Set by the Dean.
CREATE TABLE messaging_settings (
    id INTEGER PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    start_time VARCHAR(5) NOT NULL DEFAULT '05:00',
    end_time VARCHAR(5) NOT NULL DEFAULT '20:00',
    note VARCHAR(500) NOT NULL DEFAULT ''
);
INSERT INTO messaging_settings (id, note) VALUES (1, 'Students can message during the configured availability window.');
CREATE TABLE notifications (
    notification_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    link VARCHAR(200),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE announcements (
    announcement_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    posted_by INTEGER NOT NULL REFERENCES users(user_id),
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    target_role_id INTEGER REFERENCES roles(role_id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Module 7: Finalization
CREATE TABLE final_submissions (
    submission_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INTEGER NOT NULL UNIQUE REFERENCES projects(project_id),
    submitted_by INTEGER NOT NULL REFERENCES users(user_id),
    submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approval_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    approved_by INTEGER REFERENCES users(user_id),
    approved_at TIMESTAMP,
    final_status VARCHAR(20) NOT NULL DEFAULT 'Incomplete',
    certified_by INTEGER REFERENCES users(user_id),
    certified_at TIMESTAMP
);
CREATE TABLE final_submission_items (
    item_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES final_submissions(submission_id) ON DELETE CASCADE,
    requirement_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(255),
    item_status VARCHAR(20) NOT NULL DEFAULT 'Missing',
    approved_by INTEGER REFERENCES users(user_id),
    approved_at TIMESTAMP,
    recorded_by INTEGER REFERENCES users(user_id),
    recorded_at TIMESTAMP
);
CREATE TABLE archives (
    archive_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    submission_id INTEGER NOT NULL UNIQUE REFERENCES final_submissions(submission_id),
    archived_by INTEGER NOT NULL REFERENCES users(user_id),
    archive_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    archive_status VARCHAR(20) NOT NULL DEFAULT 'Archived'
);

INSERT INTO roles (role_name, role_description) VALUES
    ('Student', 'Creates the project, submits titles and documents, prepares for defenses'),
    ('Adviser', 'Creates groups, reviews titles and documents, schedules defenses'),
    ('Panelist', 'Evaluates assigned defenses and gives scores and feedback'),
    ('Grammarian', 'Checks the manuscript and issues the grammar certification'),
    ('Research Coordinator', 'Keeps the final digital records of completed projects'),
    ('Dean', 'System administrator; monitors progress and gives approvals');
COMMIT;

-- Module 3c: earlier versions of a requirement submission (the live row is always the latest version)
CREATE TABLE requirement_submission_versions (
    version_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES requirement_submissions(submission_id) ON DELETE CASCADE,
    version_no INTEGER NOT NULL,
    file_name VARCHAR(255),
    file_path VARCHAR(255),
    link_url VARCHAR(500),
    notes TEXT,
    submitted_by INTEGER NOT NULL REFERENCES users(user_id),
    submitted_at TIMESTAMP NOT NULL,
    outcome VARCHAR(20) NOT NULL,
    review_remarks TEXT,
    grammar_remarks TEXT,
    UNIQUE (submission_id, version_no)
);

-- Module 7b: archive of finished projects (the older `archives` table belongs to the retired final_submissions design)
CREATE TABLE project_archives (
    archive_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INTEGER NOT NULL UNIQUE REFERENCES projects(project_id) ON DELETE CASCADE,
    archived_by INTEGER NOT NULL REFERENCES users(user_id),
    archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT
);

-- Module 8: audit trail (written by the backend via App\Support\Audit; read-only for the Dean)
CREATE TABLE audit_logs (
    audit_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50),
    action VARCHAR(30) NOT NULL,
    module VARCHAR(40) NOT NULL,
    severity VARCHAR(10) NOT NULL DEFAULT 'Info',
    details VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX audit_logs_created_idx ON audit_logs (created_at DESC, audit_id DESC);

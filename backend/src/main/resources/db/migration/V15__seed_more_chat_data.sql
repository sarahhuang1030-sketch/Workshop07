-- =========================================================
-- V15__seed_more_chat_data.sql
-- Adds more interconnected chat data and seeds chatrequests
-- =========================================================

-- ---------------------------------------------------------
-- 1) Add missing conversation pairs
-- ---------------------------------------------------------
INSERT INTO conversations
(ConversationId, UserHighId, UserLowId, CreatedAt, ContextType, LastMessageAt, Status)
VALUES
    (5, 4, 1, '2026-04-01 09:00:00.000000', 'EMPLOYEE', '2026-04-01 09:18:00.000000', 'ACTIVE'),
    (6, 3, 2, '2026-04-01 10:00:00.000000', 'EMPLOYEE', '2026-04-01 10:16:00.000000', 'ACTIVE');

-- ---------------------------------------------------------
-- 2) Add more messages to existing and new conversations
-- Existing MessageId max was 14 in your seed
-- ---------------------------------------------------------
INSERT INTO chatmessages
(ConversationId, FromUserId, IsRead, MessageId, ToUserId, SentAt, MessageText)
VALUES
    -- Conversation 1: manager <-> agent
    (1, 1, b'1', 15, 2, '2026-04-01 08:30:00.000000', 'Bob, please follow up on the pending billing questions this morning.'),
    (1, 2, b'1', 16, 1, '2026-04-01 08:32:00.000000', 'Will do. I will review the customer notes and respond before 10 AM.'),
    (1, 1, b'0', 17, 2, '2026-04-01 08:34:00.000000', 'Thanks. Also keep me updated if any issue needs technician support.'),

    -- Conversation 2: manager <-> technician
    (2, 1, b'1', 18, 3, '2026-04-01 08:45:00.000000', 'Charlie, I may need you for two customer internet cases today.'),
    (2, 3, b'1', 19, 1, '2026-04-01 08:47:00.000000', 'That works. I have time available before noon and again after 2 PM.'),
    (2, 1, b'0', 20, 3, '2026-04-01 08:49:00.000000', 'Perfect. I will ask Bob to send you the case details once confirmed.'),

    -- Conversation 3: customer <-> agent
    (3, 4, b'1', 21, 2, '2026-04-01 09:10:00.000000', 'Hi Bob, I am still waiting for an update on my internet speed issue.'),
    (3, 2, b'1', 22, 4, '2026-04-01 09:12:00.000000', 'Thanks for checking in. I reviewed your account and I may need technician assistance.'),
    (3, 4, b'0', 23, 2, '2026-04-01 09:13:30.000000', 'That is fine. Please let me know the next step when available.'),

    -- Conversation 4: customer <-> technician
    (4, 3, b'1', 24, 4, '2026-04-01 09:20:00.000000', 'I found a signal issue on the line and I want to schedule a follow-up visit.'),
    (4, 4, b'1', 25, 3, '2026-04-01 09:22:00.000000', 'Tomorrow morning would work best for me if that slot is open.'),
    (4, 3, b'0', 26, 4, '2026-04-01 09:24:00.000000', 'Understood. I will note that preference and confirm through support.'),

    -- Conversation 5: manager <-> customer
    (5, 4, b'1', 27, 1, '2026-04-01 09:00:00.000000', 'Hello Alice, I wanted to escalate my recent support experience.'),
    (5, 1, b'1', 28, 4, '2026-04-01 09:05:00.000000', 'Thanks for reaching out, John. I reviewed your account and I will help coordinate the follow-up.'),
    (5, 4, b'0', 29, 1, '2026-04-01 09:08:00.000000', 'I appreciate that. I mainly want the service issue resolved as soon as possible.'),
    (5, 1, b'0', 30, 4, '2026-04-01 09:18:00.000000', 'Understood. I am involving both Bob and Charlie so the case moves faster.'),

    -- Conversation 6: agent <-> technician
    (6, 2, b'1', 31, 3, '2026-04-01 10:00:00.000000', 'Charlie, I am sending over a customer connectivity case for review.'),
    (6, 3, b'1', 32, 2, '2026-04-01 10:05:00.000000', 'Received. Is this the same customer who reported speed drops since yesterday?'),
    (6, 2, b'1', 33, 3, '2026-04-01 10:07:00.000000', 'Yes, that is John. Alice also asked us to keep the case moving today.'),
    (6, 3, b'0', 34, 2, '2026-04-01 10:16:00.000000', 'Got it. I will treat it as priority and update the notes after diagnostics.');

-- ---------------------------------------------------------
-- 3) Seed chatrequests
-- Using 3 statuses: PENDING, ACTIVE, CLOSED
-- ---------------------------------------------------------
INSERT INTO chatrequests
(RequestId, CustomerUserId, AssignedEmployeeUserId, ConversationId, Reason, Comment, Status, RequestedAt, AcceptedAt, ClosedAt)
VALUES
    (1, 4, NULL, NULL,
     'Billing Question',
     'Customer wants clarification about a recent invoice adjustment.',
     'PENDING',
     '2026-04-01 08:00:00.000000',
     NULL,
     NULL),

    (2, 4, 2, 3,
     'Internet Speed Issue',
     'Customer reports slow internet and is waiting for account review.',
     'ACTIVE',
     '2026-04-01 08:20:00.000000',
     '2026-04-01 08:25:00.000000',
     NULL),

    (3, 4, 3, 4,
     'Technician Follow-up',
     'Customer confirmed intermittent connection drops and needs diagnostics.',
     'ACTIVE',
     '2026-04-01 08:40:00.000000',
     '2026-04-01 08:45:00.000000',
     NULL),

    (4, 4, 2, 5,
     'Escalation to Manager',
     'Customer asked for escalation after delayed support response.',
     'CLOSED',
     '2026-04-01 08:50:00.000000',
     '2026-04-01 08:55:00.000000',
     '2026-04-01 09:30:00.000000'),

    (5, 4, null, null,
     'Appointment Request',
     'Customer prefers a morning visit for the next technician appointment.',
     'PENDING',
     '2026-04-01 09:35:00.000000',
     NULL,
     NULL),

    (6, 4, 2, 3,
     'Plan Review',
     'Customer wants to review whether the current plan still matches usage needs.',
     'CLOSED',
     '2026-04-01 09:50:00.000000',
     '2026-04-01 09:55:00.000000',
     '2026-04-01 10:20:00.000000');
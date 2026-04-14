-- =========================================================
-- V16__reset_and_reseed_chat_demo_data.sql
-- Reset chat demo data and reseed with clean customer-support-only flows
-- =========================================================

-- ---------------------------------------------------------
-- 0) Safety notes
-- Uses only these users:
--   Manager  = UserId 1
--   Agent    = UserId 2
--   Customer = UserId 4
--
-- Rules:
-- - Keep schema unchanged
-- - No employee-to-employee chat
-- - No technician chat
-- - 5 CLOSED conversations linked to CLOSED chatrequests
-- - 1 PENDING chatrequest with no conversation
-- - 0 ACTIVE requests
-- - 0 ACTIVE conversations
-- ---------------------------------------------------------

-- ---------------------------------------------------------
-- 1) Clear chat data
-- ---------------------------------------------------------
DELETE FROM chatmessages;
DELETE FROM chatrequests;
DELETE FROM conversations;

ALTER TABLE chatmessages AUTO_INCREMENT = 1;
ALTER TABLE chatrequests AUTO_INCREMENT = 1;
ALTER TABLE conversations AUTO_INCREMENT = 1;

-- ---------------------------------------------------------
-- 2) Seed conversations
-- 2 conversations with manager
-- 3 conversations with agent
-- All CLOSED
-- ContextType kept as existing system value
-- ---------------------------------------------------------
INSERT INTO conversations
(ConversationId, UserHighId, UserLowId, CreatedAt, ContextType, LastMessageAt, Status, Reason)
VALUES
    (1, 4, 1, '2026-03-20 09:00:00.000000', 'EMPLOYEE', '2026-03-20 09:18:00.000000', 'CLOSED', 'Billing clarification'),
    (2, 4, 1, '2026-03-25 10:05:00.000000', 'EMPLOYEE', '2026-03-25 10:32:00.000000', 'CLOSED', 'Service escalation'),
    (3, 4, 2, '2026-03-28 14:10:00.000000', 'EMPLOYEE', '2026-03-28 14:34:00.000000', 'CLOSED', 'Internet speed concern'),
    (4, 4, 2, '2026-04-02 11:00:00.000000', 'EMPLOYEE', '2026-04-02 11:41:00.000000', 'CLOSED', 'Plan review request'),
    (5, 4, 2, '2026-04-08 16:00:00.000000', 'EMPLOYEE', '2026-04-08 16:27:00.000000', 'CLOSED', 'Invoice explanation');

-- ---------------------------------------------------------
-- 3) Seed chatmessages
-- 5 to 10 messages per CLOSED conversation
-- ---------------------------------------------------------
INSERT INTO chatmessages
(ConversationId, FromUserId, IsRead, MessageId, ToUserId, SentAt, MessageText)
VALUES
    -- =====================================================
    -- Conversation 1: Customer 4 <-> Manager 1 (5 messages)
    -- =====================================================
    (1, 4, b'1', 1, 1, '2026-03-20 09:00:00.000000', 'Hello, I have a question about a recent invoice charge.'),
    (1, 1, b'1', 2, 4, '2026-03-20 09:04:00.000000', 'Sure, I can review that with you. Which charge are you asking about?'),
    (1, 4, b'1', 3, 1, '2026-03-20 09:08:00.000000', 'There is an adjustment on the bill that I do not recognize.'),
    (1, 1, b'1', 4, 4, '2026-03-20 09:14:00.000000', 'I checked the account and it was a one-time correction from the previous cycle.'),
    (1, 4, b'1', 5, 1, '2026-03-20 09:18:00.000000', 'Okay, thanks for clarifying that.'),

    -- =====================================================
    -- Conversation 2: Customer 4 <-> Manager 1 (6 messages)
    -- =====================================================
    (2, 4, b'1', 6, 1, '2026-03-25 10:05:00.000000', 'Hi, I wanted to escalate a previous support experience.'),
    (2, 1, b'1', 7, 4, '2026-03-25 10:09:00.000000', 'I understand. I reviewed the notes before replying here.'),
    (2, 4, b'1', 8, 1, '2026-03-25 10:14:00.000000', 'I mainly wanted to make sure the issue was documented properly.'),
    (2, 1, b'1', 9, 4, '2026-03-25 10:19:00.000000', 'Yes, it is documented and I also added a manager review note.'),
    (2, 4, b'1', 10, 1, '2026-03-25 10:26:00.000000', 'Thank you, that is what I needed.'),
    (2, 1, b'1', 11, 4, '2026-03-25 10:32:00.000000', 'You are welcome. I will mark this request as closed.'),

    -- =====================================================
    -- Conversation 3: Customer 4 <-> Agent 2 (5 messages)
    -- =====================================================
    (3, 4, b'1', 12, 2, '2026-03-28 14:10:00.000000', 'Hello, my internet has been slower than usual today.'),
    (3, 2, b'1', 13, 4, '2026-03-28 14:15:00.000000', 'Thanks for reporting it. I am checking the account now.'),
    (3, 4, b'1', 14, 2, '2026-03-28 14:21:00.000000', 'It is especially noticeable while streaming.'),
    (3, 2, b'1', 15, 4, '2026-03-28 14:28:00.000000', 'I refreshed the service profile and reviewed the connection notes.'),
    (3, 4, b'1', 16, 2, '2026-03-28 14:34:00.000000', 'It looks better now, thank you.'),

    -- =====================================================
    -- Conversation 4: Customer 4 <-> Agent 2 (8 messages)
    -- =====================================================
    (4, 4, b'1', 17, 2, '2026-04-02 11:00:00.000000', 'Hi, I want to know if my current plan still fits my usage.'),
    (4, 2, b'1', 18, 4, '2026-04-02 11:05:00.000000', 'Sure. Are you mostly using home internet or mobile services?'),
    (4, 4, b'1', 19, 2, '2026-04-02 11:10:00.000000', 'Mostly home internet, with more devices being added soon.'),
    (4, 2, b'1', 20, 4, '2026-04-02 11:16:00.000000', 'In that case, a slightly higher plan may be a better fit.'),
    (4, 4, b'1', 21, 2, '2026-04-02 11:21:00.000000', 'Would the increase be significant?'),
    (4, 2, b'1', 22, 4, '2026-04-02 11:28:00.000000', 'Not very large, and it would give better room for extra usage.'),
    (4, 4, b'1', 23, 2, '2026-04-02 11:35:00.000000', 'Okay, I just wanted a recommendation for now.'),
    (4, 2, b'1', 24, 4, '2026-04-02 11:41:00.000000', 'No problem, I documented the recommendation and will close this request.'),

    -- =====================================================
    -- Conversation 5: Customer 4 <-> Agent 2 (6 messages)
    -- =====================================================
    (5, 4, b'1', 25, 2, '2026-04-08 16:00:00.000000', 'Hi, I want help understanding the latest invoice total.'),
    (5, 2, b'1', 26, 4, '2026-04-08 16:04:00.000000', 'I can review it with you.'),
    (5, 4, b'1', 27, 2, '2026-04-08 16:09:00.000000', 'There are a couple of amounts I wanted confirmed.'),
    (5, 2, b'1', 28, 4, '2026-04-08 16:15:00.000000', 'I checked the invoice and the totals match the current services on the account.'),
    (5, 4, b'1', 29, 2, '2026-04-08 16:22:00.000000', 'Okay, that answers my question.'),
    (5, 2, b'1', 30, 4, '2026-04-08 16:27:00.000000', 'Great, I will close the request now.');

-- ---------------------------------------------------------
-- 4) Seed chatrequests
-- 5 CLOSED linked to conversations
-- 1 PENDING with no conversation
-- 0 ACTIVE
-- ---------------------------------------------------------
INSERT INTO chatrequests
(RequestId, CustomerUserId, AssignedEmployeeUserId, ConversationId, Reason, Comment, Status, RequestedAt, AcceptedAt, ClosedAt)
VALUES
    (1, 4, 1, 1,
     'Billing clarification',
     'Customer requested explanation for a recent invoice adjustment.',
     'CLOSED',
     '2026-03-20 08:55:00.000000',
     '2026-03-20 08:58:00.000000',
     '2026-03-20 09:20:00.000000'),

    (2, 4, 1, 2,
     'Service escalation',
     'Customer requested manager review of a previous support interaction.',
     'CLOSED',
     '2026-03-25 10:00:00.000000',
     '2026-03-25 10:03:00.000000',
     '2026-03-25 10:34:00.000000'),

    (3, 4, 2, 3,
     'Internet speed concern',
     'Customer reported slower than expected internet performance.',
     'CLOSED',
     '2026-03-28 14:05:00.000000',
     '2026-03-28 14:08:00.000000',
     '2026-03-28 14:36:00.000000'),

    (4, 4, 2, 4,
     'Plan review request',
     'Customer wanted advice on whether the current plan still fits usage.',
     'CLOSED',
     '2026-04-02 10:56:00.000000',
     '2026-04-02 10:58:00.000000',
     '2026-04-02 11:43:00.000000'),

    (5, 4, 2, 5,
     'Invoice explanation',
     'Customer wanted confirmation of the most recent invoice totals.',
     'CLOSED',
     '2026-04-08 15:55:00.000000',
     '2026-04-08 15:58:00.000000',
     '2026-04-08 16:29:00.000000'),

    (6, 4, NULL, NULL,
     'General support question',
     'Customer has a new support request waiting in the queue.',
     'PENDING',
     '2026-04-14 09:30:00.000000',
     NULL,
     NULL);
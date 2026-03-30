CREATE TABLE IF NOT EXISTS `chatmessages` (
                                              `ConversationId` int NOT NULL,
                                              `FromUserId` int NOT NULL,
                                              `IsRead` bit(1) NOT NULL,
    `MessageId` int NOT NULL AUTO_INCREMENT,
    `ToUserId` int NOT NULL,
    `SentAt` datetime(6) NOT NULL,
    `MessageText` text NOT NULL,
    PRIMARY KEY (`MessageId`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `conversations` (
                                               `ConversationId` int NOT NULL AUTO_INCREMENT,
                                               `UserHighId` int NOT NULL,
                                               `UserLowId` int NOT NULL,
                                               `CreatedAt` datetime(6) NOT NULL,
    `ContextType` varchar(20) NOT NULL DEFAULT 'EMPLOYEE',
    `LastMessageAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`ConversationId`),
    UNIQUE KEY `uq_conversation_pair_context` (`UserLowId`,`UserHighId`,`ContextType`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `conversations`
(`ConversationId`, `UserHighId`, `UserLowId`, `CreatedAt`, `ContextType`, `LastMessageAt`)
VALUES
    (1, 2, 1, '2026-03-18 14:25:41.000000', 'EMPLOYEE', '2026-03-18 18:40:04.432894'),
    (2, 3, 1, '2026-03-18 14:25:41.000000', 'EMPLOYEE', '2026-03-18 18:40:04.432894'),
    (3, 4, 2, '2026-03-18 14:25:41.000000', 'EMPLOYEE', '2026-03-18 18:40:04.432894'),
    (4, 4, 3, '2026-03-18 14:25:41.000000', 'EMPLOYEE', '2026-03-18 18:40:04.432894');

INSERT INTO `chatmessages`
(`ConversationId`, `FromUserId`, `IsRead`, `MessageId`, `ToUserId`, `SentAt`, `MessageText`)
VALUES
    (1, 1, b'1', 1, 2, '2026-03-18 09:00:00.000000', 'Morning Bob, can you review the customer escalation queue?'),
    (1, 2, b'1', 2, 1, '2026-03-18 09:02:00.000000', 'Good morning Alice, yes I am checking it now.'),
    (1, 1, b'1', 3, 2, '2026-03-18 09:03:30.000000', 'Please prioritize any service outage cases first.'),
    (1, 2, b'0', 4, 1, '2026-03-18 09:05:00.000000', 'Understood. I will update you once I finish.'),
    (2, 1, b'1', 5, 3, '2026-03-18 10:10:00.000000', 'Charlie, are you available for a technician callback today?'),
    (2, 3, b'1', 6, 1, '2026-03-18 10:12:00.000000', 'Yes, I have an opening after lunch.'),
    (2, 1, b'0', 7, 3, '2026-03-18 10:13:00.000000', 'Great. I may assign you a customer connectivity issue.'),
    (3, 4, b'1', 8, 2, '2026-03-18 11:00:00.000000', 'Hi, I need help with my internet plan.'),
    (3, 2, b'1', 9, 4, '2026-03-18 11:02:00.000000', 'Hello John, I can help with that. What issue are you having?'),
    (3, 4, b'1', 10, 2, '2026-03-18 11:03:30.000000', 'My speed is lower than expected since yesterday.'),
    (3, 2, b'0', 11, 4, '2026-03-18 11:06:00.000000', 'Thanks. I will check your account and line status.'),
    (4, 3, b'1', 12, 4, '2026-03-18 13:15:00.000000', 'Hello John, I am the technician assigned to your case.'),
    (4, 4, b'1', 13, 3, '2026-03-18 13:16:30.000000', 'Thanks, the connection keeps dropping every hour.'),
    (4, 3, b'0', 14, 4, '2026-03-18 13:18:00.000000', 'I am running diagnostics now. I will let you know the result shortly.');
package org.example.service;

import org.example.model.AuditLog;
import org.example.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String module, String action, String target, String doneBy) {
        AuditLog auditLog = new AuditLog();
        auditLog.setModule(module);
        auditLog.setAction(action);
        auditLog.setTarget(target);
        auditLog.setDoneBy(doneBy);
        auditLog.setTimestamp(LocalDateTime.now());

        auditLogRepository.save(auditLog);
    }
}
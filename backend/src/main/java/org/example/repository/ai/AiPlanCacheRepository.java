package org.example.repository.ai;

import org.example.entity.ai.AiPlanCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

public interface AiPlanCacheRepository extends JpaRepository<AiPlanCache, Long> {

    Optional<AiPlanCache> findByCacheKey(String cacheKey);
    @Modifying
    @Transactional
    void deleteByExpiresAtBefore(LocalDateTime now);
}
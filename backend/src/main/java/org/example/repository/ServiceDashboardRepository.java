package org.example.repository;

import org.example.dto.ServiceDashboardSummaryDTO;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ServiceDashboardRepository {

    private final JdbcTemplate jdbc;

    public ServiceDashboardRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public ServiceDashboardSummaryDTO getSummaryByUsername(String username) {
        Integer userId = findUserIdByUsername(username);

        if (userId == null) {
            return new ServiceDashboardSummaryDTO(0, 0, 0, 0);
        }

        long assignedRequests = countAssignedRequests(userId);
        long openRequests = countOpenRequests(userId);
        long todayAppointments = countTodayAppointments(userId);
        long unassignedRequests = countUnassignedRequests();

        return new ServiceDashboardSummaryDTO(
                assignedRequests,
                openRequests,
                todayAppointments,
                unassignedRequests
        );
    }

    private Integer findUserIdByUsername(String username) {
        var results = jdbc.query(
                """
                SELECT UserId
                FROM useraccounts
                WHERE Username = ?
                """,
                (rs, rowNum) -> rs.getInt("UserId"),
                username
        );

        return results.isEmpty() ? null : results.get(0);
    }

    private long countAssignedRequests(int userId) {
        Long value = jdbc.queryForObject(
                """
                SELECT COUNT(*)
                FROM servicerequests
                WHERE AssignedTechnicianUserId = ?
                """,
                Long.class,
                userId
        );
        return value != null ? value : 0L;
    }

    private long countOpenRequests(int userId) {
        Long value = jdbc.queryForObject(
                """
                SELECT COUNT(*)
                FROM servicerequests
                WHERE AssignedTechnicianUserId = ?
                  AND Status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS')
                """,
                Long.class,
                userId
        );
        return value != null ? value : 0L;
    }

    private long countTodayAppointments(int userId) {
        Long value = jdbc.queryForObject(
                """
                SELECT COUNT(*)
                FROM serviceappointments
                WHERE TechnicianUserId = ?
                  AND DATE(ScheduledStart) = CURDATE()
                """,
                Long.class,
                userId
        );
        return value != null ? value : 0L;
    }

    private long countUnassignedRequests() {
        Long value = jdbc.queryForObject(
                """
                SELECT COUNT(*)
                FROM servicerequests
                WHERE AssignedTechnicianUserId IS NULL
                  AND Status = 'OPEN'
                """,
                Long.class
        );
        return value != null ? value : 0L;
    }
}
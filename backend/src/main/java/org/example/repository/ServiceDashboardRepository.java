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
            return new ServiceDashboardSummaryDTO(0, 0, 0, 0, 0);
        }

        long assignedRequests = countAssignedRequests(userId);
        long openRequests = countOpenRequests(userId);
        long todayAppointments = countTodayAppointments(userId);
        long completedRequests = countCompletedRequests(userId);
        long assignedAppointments = countAssignedAppointments(userId);

        return new ServiceDashboardSummaryDTO(
                assignedRequests,
                openRequests,
                todayAppointments,
                completedRequests,
                assignedAppointments
        );
    }

    private Integer findUserIdByUsername(String username) {
        var results = jdbc.query(
                """
                SELECT UserId
                FROM useraccounts
                WHERE LOWER(Username) = LOWER(?)
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
                  AND Status IN ('Open', 'Assigned', 'In Progress')
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

    private long countCompletedRequests(int userId) {
        Long value = jdbc.queryForObject(
                """
                SELECT COUNT(*)
                FROM servicerequests
                WHERE AssignedTechnicianUserId = ?
                  AND Status = 'Completed'
                """,
                Long.class,
                userId
        );
        return value != null ? value : 0L;
    }

    private long countAssignedAppointments(int userId) {
        Long value = jdbc.queryForObject(
                """
                SELECT COUNT(*)
                FROM serviceappointments
                WHERE TechnicianUserId = ?
                  AND Status IN ('Scheduled', 'Pending')
                """,
                Long.class,
                userId
        );
        return value != null ? value : 0L;
    }
}
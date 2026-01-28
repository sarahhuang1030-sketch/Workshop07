package org.example.repository;

import org.example.dto.ServiceTypeDTO;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ServiceTypeRepository {

    private final JdbcTemplate jdbc;

    public ServiceTypeRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<ServiceTypeDTO> findAll() {
        return jdbc.query("""
                SELECT ServiceTypeId, Name, Description
                FROM ServiceTypes
                ORDER BY Name
                """,
                (rs, rowNum) -> new ServiceTypeDTO(
                        rs.getInt("ServiceTypeId"),
                        rs.getString("Name"),
                        rs.getString("Description")
                )
        );
    }
}

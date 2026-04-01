package org.example.repository;

import org.example.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface LocationRepository extends JpaRepository<Location, Integer> {
    @Query("SELECT COUNT(l) FROM Location l WHERE l.isActive = true")
    long countActiveLocations();
}
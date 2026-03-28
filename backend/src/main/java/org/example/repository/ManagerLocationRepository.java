package org.example.repository;

import org.example.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ManagerLocationRepository extends JpaRepository<Location, Integer> {
}

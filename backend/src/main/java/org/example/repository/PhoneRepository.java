package org.example.repository;

import org.example.entity.Phone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhoneRepository extends JpaRepository<Phone, Integer> {
    List<Phone> findByActiveTrue();
}
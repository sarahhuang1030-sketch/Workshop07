package org.example.repository;

import org.example.model.ServiceAppointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ManagerServiceAppointmentRepository extends JpaRepository<ServiceAppointment, Integer> {

    List<ServiceAppointment> findByRequestId(Integer requestId);

}
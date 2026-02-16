package org.example.repository;

import org.example.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    boolean existsByEmail(String email);


    Optional<Customer> findFirstByEmailIgnoreCase(String email);
    Optional<Customer> findByExternalProviderAndExternalCustomerId(String externalProvider, String externalCustomerId);
}

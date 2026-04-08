package org.example.repository;

import org.example.model.Customer;
import org.example.model.CustomerAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface CustomerAddressRepository extends JpaRepository<CustomerAddress, Long> {
    List<CustomerAddress> findByCustomerId(Integer customerId);
    Optional<CustomerAddress> findByCustomerIdAndAddressType(Integer customerId, String addressType);
    Optional<CustomerAddress> findFirstByCustomerIdOrderByIsPrimaryDesc(Integer customerId);
    Optional<CustomerAddress> findFirstByCustomerIdAndAddressTypeOrderByIsPrimaryDesc(Integer customerId, String addressType);
    @Modifying
    @Transactional
    void deleteAllByCustomerId(Integer customerId);
}

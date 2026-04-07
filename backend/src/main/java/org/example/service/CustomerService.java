package org.example.service;



import org.example.dto.CustomerDTO;
import org.example.model.Customer;
import org.example.repository.CustomerAddressRepository;
import org.example.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerAddressRepository customerAddressRepository;

    public CustomerService(CustomerRepository customerRepository,
                           CustomerAddressRepository customerAddressRepository) {
        this.customerRepository = customerRepository;
        this.customerAddressRepository = customerAddressRepository;
    }

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Customer getCustomerById(Integer id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));
    }

    public Customer createCustomer(Customer customer) {
        customer.setCreatedAt(null); // let @PrePersist handle it
        customer.setAssignedEmployeeId(customer.getAssignedEmployeeId());
        if (customer.getStatus() == null || customer.getStatus().isBlank()) {
            customer.setStatus("Active");
        }
        return customerRepository.save(customer);
    }

    public Customer updateCustomer(Integer id, Customer updatedCustomer) {
        Customer existing = getCustomerById(id);

        existing.setCustomerType(updatedCustomer.getCustomerType());
        existing.setFirstName(updatedCustomer.getFirstName());
        existing.setLastName(updatedCustomer.getLastName());
        existing.setBusinessName(updatedCustomer.getBusinessName());
        existing.setEmail(updatedCustomer.getEmail());
        existing.setHomePhone(updatedCustomer.getHomePhone());
        existing.setStatus(updatedCustomer.getStatus());
        existing.setAssignedEmployeeId(updatedCustomer.getAssignedEmployeeId());


        // usually keep these untouched in manager CRUD
        // existing.setExternalProvider(existing.getExternalProvider());
        // existing.setExternalCustomerId(existing.getExternalCustomerId());
        // existing.setPasswordHash(existing.getPasswordHash());

        return customerRepository.save(existing);
    }

    @Transactional
    public void deleteCustomer(Integer id) {
        Customer existing = getCustomerById(id);

        // remove related addresses first
        customerAddressRepository.deleteAllByCustomerId(id);

        customerRepository.delete(existing);
    }

    public List<CustomerDTO> getCustomersForTechnician(String username) {
        return customerRepository.findAll()
                .stream()
                .map(CustomerDTO::fromEntity)
                .toList();
    }
}
package org.example.service;

import org.example.model.CustomerAddress;
import org.example.repository.CustomerAddressRepository;
import org.springframework.stereotype.Service;

@Service
public class CustomerAddressService {

    private final CustomerAddressRepository customerAddressRepository;

    public CustomerAddressService(CustomerAddressRepository customerAddressRepository) {
        this.customerAddressRepository = customerAddressRepository;
    }

    public CustomerAddress getPrimaryAddress(Integer customerId) {
        return customerAddressRepository
                .findFirstByCustomerIdOrderByIsPrimaryDesc(customerId)
                .orElse(null);
    }

    public CustomerAddress saveOrUpdatePrimaryAddress(Integer customerId, CustomerAddress input) {
        CustomerAddress existing = customerAddressRepository
                .findFirstByCustomerIdOrderByIsPrimaryDesc(customerId)
                .orElse(null);

        if (existing == null) {
            CustomerAddress address = new CustomerAddress();
            address.setCustomerId(customerId);
            address.setAddressType(input.getAddressType());
            address.setStreet1(input.getStreet1());
            address.setStreet2(input.getStreet2());
            address.setCity(input.getCity());
            address.setProvince(input.getProvince());
            address.setPostalCode(input.getPostalCode());
            address.setCountry(input.getCountry());
            address.setIsPrimary(1);
            return customerAddressRepository.save(address);
        }

        existing.setAddressType(input.getAddressType());
        existing.setStreet1(input.getStreet1());
        existing.setStreet2(input.getStreet2());
        existing.setCity(input.getCity());
        existing.setProvince(input.getProvince());
        existing.setPostalCode(input.getPostalCode());
        existing.setCountry(input.getCountry());
        existing.setIsPrimary(1);

        return customerAddressRepository.save(existing);
    }
}
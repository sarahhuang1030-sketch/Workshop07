package org.example.service;

import org.example.dto.SaveMyAddressRequestDTO;
import org.example.model.CustomerAddress;
import org.example.repository.CustomerAddressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomerAddressService {

    private final CustomerAddressRepository customerAddressRepository;

    public CustomerAddressService(CustomerAddressRepository customerAddressRepository) {
        this.customerAddressRepository = customerAddressRepository;
    }

    public List<CustomerAddress> getAddresses(Integer customerId) {
        return customerAddressRepository.findAllByCustomerIdOrderByAddressIdAsc(customerId);
    }

    public CustomerAddress getPrimaryAddress(Integer customerId) {
        return customerAddressRepository
                .findFirstByCustomerIdOrderByIsPrimaryDesc(customerId)
                .orElse(null);
    }

    @Transactional
    public CustomerAddress saveOrUpdateAddress(Integer customerId, SaveMyAddressRequestDTO input) {
        String addressType = input.addressType != null && !input.addressType.trim().isEmpty()
                ? input.addressType.trim()
                : "Billing";

        CustomerAddress existing = customerAddressRepository
                .findByCustomerIdAndAddressType(customerId, addressType)
                .orElse(null);

        if (existing == null) {
            CustomerAddress address = new CustomerAddress();
            address.setCustomerId(customerId);
            address.setAddressType(addressType);
            address.setStreet1(input.street1);
            address.setStreet2(input.street2);
            address.setCity(input.city);
            address.setProvince(input.province);
            address.setPostalCode(input.postalCode);
            address.setCountry(input.country);
            address.setIsPrimary(1);
            return customerAddressRepository.save(address);
        }

        existing.setAddressType(addressType);
        existing.setStreet1(input.street1);
        existing.setStreet2(input.street2);
        existing.setCity(input.city);
        existing.setProvince(input.province);
        existing.setPostalCode(input.postalCode);
        existing.setCountry(input.country);
        existing.setIsPrimary(1);

        return customerAddressRepository.save(existing);
    }

    @Transactional
    public void deleteAddressByType(Integer customerId, String addressType) {
        customerAddressRepository.deleteByCustomerIdAndAddressType(customerId, addressType);
    }
}
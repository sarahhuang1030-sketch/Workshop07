package org.example.service;

import org.example.dto.RegisterRequestDTO;
import org.example.model.Customer;
import org.example.model.CustomerAddress;
import org.example.model.UserAccount;
import org.example.repository.CustomerAddressRepository;
import org.example.repository.CustomerRepository;
import org.example.repository.UserAccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.example.dto.LoginResponseDTO;

@Service
public class CustomerRegistrationService {

    private final CustomerRepository customerRepo;
    private final CustomerAddressRepository addressRepo;
    private final UserAccountRepository userAccountRepo;
    private final PasswordEncoder passwordEncoder;

    public CustomerRegistrationService(CustomerRepository customerRepo,
                                       CustomerAddressRepository addressRepo,
                                       UserAccountRepository userAccountRepo,
                                       PasswordEncoder passwordEncoder) {
        this.customerRepo = customerRepo;
        this.addressRepo = addressRepo;
        this.userAccountRepo = userAccountRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public LoginResponseDTO register(RegisterRequestDTO req) {
        String email = req.email.toLowerCase().trim();
        String username = req.username.trim().toLowerCase();

        boolean isBusiness = "business".equalsIgnoreCase(req.customerType);

        if (customerRepo.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists.");
        }

        if (userAccountRepo.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists.");
        }

        if (isBusiness && (req.businessName == null || req.businessName.isBlank())) {
            throw new IllegalArgumentException("Business name is required for business accounts.");
        }

        // 1) customers
        Customer c = new Customer();
        c.setCustomerType(isBusiness ? "Business" : "Individual");
        c.setFirstName(req.firstName.trim());
        c.setLastName(req.lastName.trim());
        c.setBusinessName(isBusiness ? req.businessName.trim() : null);
        c.setEmail(email);
        c.setHomePhone(req.homephone.trim());
        c.setStatus("Active");

        // login password stored in useraccounts and customers
        String hash = passwordEncoder.encode(req.password);
        c.setPasswordHash(hash);


        Customer saved = customerRepo.save(c);

        // 2) customeraddresses - Billing (primary)
        CustomerAddress billing = new CustomerAddress();
        billing.setCustomerId(saved.getCustomerId());
        billing.setAddressType("Billing");
        billing.setStreet1(req.billingStreet1.trim());
        billing.setStreet2(req.billingStreet2);
        billing.setCity(req.billingCity.trim());
        billing.setProvince(req.billingProvince.trim());
        billing.setPostalCode(req.billingPostalCode.trim());
        billing.setCountry(req.billingCountry.trim());
        billing.setIsPrimary(1);
        addressRepo.save(billing);

        // 3) customeraddresses - Service (optional)
        if (!req.sameAsBilling) {
            if (req.serviceStreet1 == null || req.serviceStreet1.isBlank()
                    || req.serviceCity == null || req.serviceCity.isBlank()
                    || req.serviceProvince == null || req.serviceProvince.isBlank()
                    || req.servicePostalCode == null || req.servicePostalCode.isBlank()
                    || req.serviceCountry == null || req.serviceCountry.isBlank()) {
                throw new IllegalArgumentException("Service address is incomplete.");
            }

            CustomerAddress service = new CustomerAddress();
            service.setCustomerId(saved.getCustomerId());
            service.setAddressType("Service");
            service.setStreet1(req.serviceStreet1.trim());
            service.setStreet2(req.serviceStreet2);
            service.setCity(req.serviceCity.trim());
            service.setProvince(req.serviceProvince.trim());
            service.setPostalCode(req.servicePostalCode.trim());
            service.setCountry(req.serviceCountry.trim());
            service.setIsPrimary(0);
            addressRepo.save(service);
        }

        // 4) useraccounts - create login
        UserAccount ua = new UserAccount();
        ua.setCustomerId(saved.getCustomerId());
        ua.setEmployeeId(null);
        ua.setUsername(username);
        ua.setPasswordHash(hash);
        ua.setRole("Customer");
        ua.setIsLocked(0);
        ua.setLastLoginAt(null);

        userAccountRepo.save(ua);

        return new LoginResponseDTO(
                saved.getCustomerId(),  // customerId
                null,                   // employeeId (customers are not employees)
                saved.getFirstName(),   // firstName
                ua.getUsername(),       // username
                "Customer"              // role
        );
    }
}
package org.example.service;

import org.example.dto.RegisterAsCustomerRequestDTO;
import org.example.model.Customer;
import org.example.model.CustomerAddress;
import org.example.model.UserAccount;
import org.example.repository.CustomerAddressRepository;
import org.example.repository.CustomerRepository;
import org.example.repository.UserAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class AgentCustomerService {
    private final UserAccountRepository userAccountRepo;
    private final CustomerRepository customerRepo;
    private final CustomerAddressRepository addressRepo;

    public AgentCustomerService(UserAccountRepository userAccountRepo,
                                CustomerRepository customerRepo,
                                CustomerAddressRepository addressRepo) {
        this.userAccountRepo = userAccountRepo;
        this.customerRepo = customerRepo;
        this.addressRepo = addressRepo;
    }

    @Transactional
    public Map<String, Object> registerAsCustomer(
            String usernameOrEmail,
            String provider,
            String externalId,
            String oauthFirstName,
            String oauthLastName,
            RegisterAsCustomerRequestDTO req
    ) {
        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(usernameOrEmail)
                .orElseThrow(() -> new IllegalArgumentException("UserAccount not found"));

        // already linked
        if (ua.getCustomerId() != null) {
            return Map.of(
                    "message", "Already registered as customer",
                    "customerId", ua.getCustomerId()
            );
        }

        // ---------- Dedup customer ----------
        Customer customer = null;

        if (provider != null && externalId != null) {
            customer = customerRepo
                    .findByExternalProviderAndExternalCustomerId(provider, externalId)
                    .orElse(null);
        }

        if (customer == null) {
            customer = customerRepo.findFirstByEmailIgnoreCase(usernameOrEmail).orElse(null);
        }

        // ---------- Create if missing ----------
        if (customer == null) {
            Customer c = new Customer();
            c.setCustomerType(req.customerType != null ? req.customerType : "Individual");

            // Prefer request name; otherwise OAuth name; otherwise blank
            String first = (req.firstName != null && !req.firstName.isBlank()) ? req.firstName : oauthFirstName;
            String last  = (req.lastName  != null && !req.lastName.isBlank())  ? req.lastName  : oauthLastName;

            c.setFirstName(first);
            c.setLastName(last);
            c.setBusinessName(req.businessName);

            // Email always from authenticated identity
            c.setEmail(usernameOrEmail);

            // Your Customers.HomePhone is nullable=false → must have something.
            // If you want to REQUIRE it instead of defaulting, return 400 here.
            String phone = (req.homePhone != null && !req.homePhone.isBlank()) ? req.homePhone : "0000000000";
            c.setHomePhone(phone);

            // Optional: tag oauth linkage in Customers table
            if (provider != null && externalId != null) {
                c.setExternalProvider(provider);
                c.setExternalCustomerId(externalId);
                c.setPasswordHash("OAUTH");
            } else {
                c.setPasswordHash(ua.getPasswordHash());
            }

            customer = customerRepo.save(c);

            // ---------- Billing address (optional here) ----------
            if (req.street1 != null && !req.street1.isBlank()) {
                CustomerAddress billing = new CustomerAddress();
                billing.setCustomerId(customer.getCustomerId());
                billing.setAddressType("Billing");
                billing.setStreet1(req.street1);
                billing.setStreet2(req.street2);
                billing.setCity(req.city);
                billing.setProvince(req.province);
                billing.setPostalCode(req.postalCode);
                billing.setCountry(req.country != null ? req.country : "Canada");
                billing.setIsPrimary(1);
                addressRepo.save(billing);

                if (Boolean.TRUE.equals(req.addServiceAddress)) {
                    CustomerAddress service = new CustomerAddress();
                    service.setCustomerId(customer.getCustomerId());
                    service.setAddressType("Service");
                    service.setStreet1(req.street1);
                    service.setStreet2(req.street2);
                    service.setCity(req.city);
                    service.setProvince(req.province);
                    service.setPostalCode(req.postalCode);
                    service.setCountry(req.country != null ? req.country : "Canada");
                    service.setIsPrimary(1);
                    addressRepo.save(service);
                }
            }
        }

        // ---------- Link useraccount to customer ----------
        ua.setCustomerId(customer.getCustomerId());
        userAccountRepo.save(ua);

        return Map.of(
                "message", "Customer profile created/linked",
                "customerId", customer.getCustomerId()
        );
    }

}
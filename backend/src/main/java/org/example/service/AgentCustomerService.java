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
    public Map<String, Object> registerAsCustomer(String usernameOrEmail, RegisterAsCustomerRequestDTO req) {

        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(usernameOrEmail)
                .orElseThrow(() -> new IllegalArgumentException("UserAccount not found"));

        // must be an employee/agent
        if (ua.getEmployeeId() == null) {
            throw new IllegalArgumentException("Only employees/agents can use register-as-customer.");
        }

        // already linked
        if (ua.getCustomerId() != null) {
            return Map.of(
                    "message", "Already registered as customer",
                    "customerId", ua.getCustomerId()
            );
        }

        // 1) create customer
        Customer c = new Customer();
        c.setCustomerType(req.customerType != null ? req.customerType : "Individual");
        c.setFirstName(req.firstName);
        c.setLastName(req.lastName);
        c.setBusinessName(req.businessName);

        // IMPORTANT: use email from the logged in user rather than trusting the client
        c.setEmail(usernameOrEmail);

        c.setHomePhone(req.homePhone != null ? req.homePhone : "000-000-0000");
        Customer saved = customerRepo.save(c);

        // 2) billing address
        CustomerAddress billing = new CustomerAddress();
        billing.setCustomerId(saved.getCustomerId());
        billing.setAddressType("Billing");
        billing.setStreet1(req.street1);
        billing.setStreet2(req.street2);
        billing.setCity(req.city);
        billing.setProvince(req.province);
        billing.setPostalCode(req.postalCode);
        billing.setCountry(req.country != null ? req.country : "Canada");
        billing.setIsPrimary(1);
        addressRepo.save(billing);

        // optional: also create a Service address (same fields for now)
        if (Boolean.TRUE.equals(req.addServiceAddress)) {
            CustomerAddress service = new CustomerAddress();
            service.setCustomerId(saved.getCustomerId());
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

        // 3) link useraccount to customer
        ua.setCustomerId(saved.getCustomerId());
        userAccountRepo.save(ua);

        return Map.of(
                "message", "Customer profile created and linked",
                "customerId", saved.getCustomerId()
        );
    }
}

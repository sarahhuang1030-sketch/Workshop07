package org.example.dto;

/**
 * CreateCustomerRequest
 *
 * DTO used for creating a new customer along with billing address.
 * This ensures both Customer and CustomerAddress tables are populated.
 */
public class CreateCustomerRequest {

    // -------- Customer fields --------
    public String firstName;
    public String lastName;
    public String email;
    public String homePhone;
    public String customerType;
    public String businessName;   //only for business customers
    public String status;         // e.g. "Active", "Inactive"
    public Integer assignedEmployeeId;

    // -------- Billing address fields --------
    public String street1;
    public String street2;
    public String city;
    public String province;
    public String postalCode;
    public String country;
}
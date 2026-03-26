/**
 Description: This DTO class is used for representing a customer's profile information, including their total
 spending, points, customer type, subscription plan details, billing information, and associated employee and
 role information. It serves as a data transfer object between the client and server when retrieving or
 displaying a customer's profile details.

 Created by: Sarah
 Created on: February 2026
 **/

package org.example.dto;

import java.util.List;

public class CustomerProfileDTO {
    public Double totalSpent;
    public Integer points;
    public String customerType;

    public PlanDTO plan;
    public BillingDTO billing;

    public static class PlanDTO {
        public String name;
        public Double monthlyPrice;
        public String status;
        public String startedAt;
        public List<Object> features;
        public List<Object> addOns;
    }

    public static class BillingDTO {
        public String nextBillDate;
        public Double nextBillAmount;
        public PaymentMethodDTO paymentMethod;
        public AddressDTO address;
        public List<Object> invoices;
    }

    public static class PaymentMethodDTO {
        public String brand;
        public String last4;
    }

    public static class AddressDTO {
        public String street1;
        public String street2;
        public String city;
        public String province;
        public String postalCode;
        public String country;
    }

    public Integer customerId;
    public Integer employeeId;
    public String role;

    public CustomerProfileDTO() {}

    public CustomerProfileDTO(Integer customerId, Integer employeeId, String role) {
        this.customerId = customerId;
        this.employeeId = employeeId;
        this.role = role;
    }

}

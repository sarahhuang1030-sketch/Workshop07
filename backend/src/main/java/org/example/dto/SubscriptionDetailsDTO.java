package org.example.dto;

import java.util.List;

public class SubscriptionDetailsDTO {
    private SubscriptionDTO subscription;
    private PlanInfoDTO plan;
    private List<FeatureInfoDTO> features;
    private List<AddOnInfoDTO> addOns;
    private List<PaymentInfoDTO> payments;
    private List<InvoiceDTO> invoices;

    public SubscriptionDetailsDTO() {}

    public SubscriptionDTO getSubscription() { return subscription; }
    public void setSubscription(SubscriptionDTO subscription) { this.subscription = subscription; }

    public PlanInfoDTO getPlan() { return plan; }
    public void setPlan(PlanInfoDTO plan) { this.plan = plan; }

    public List<FeatureInfoDTO> getFeatures() { return features; }
    public void setFeatures(List<FeatureInfoDTO> features) { this.features = features; }

    public List<AddOnInfoDTO> getAddOns() { return addOns; }
    public void setAddOns(List<AddOnInfoDTO> addOns) { this.addOns = addOns; }

    public List<PaymentInfoDTO> getPayments() { return payments; }
    public void setPayments(List<PaymentInfoDTO> payments) { this.payments = payments; }

    public List<InvoiceDTO> getInvoices() { return invoices; }
    public void setInvoices(List<InvoiceDTO> invoices) { this.invoices = invoices; }

    public static class SubscriptionDTO {
        private Integer subscriptionId;
        private String status;
        private String startDate;
        private String endDate;
        private Integer billingCycleDay;

        public Integer getSubscriptionId() { return subscriptionId; }
        public void setSubscriptionId(Integer subscriptionId) { this.subscriptionId = subscriptionId; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getStartDate() { return startDate; }
        public void setStartDate(String startDate) { this.startDate = startDate; }
        public String getEndDate() { return endDate; }
        public void setEndDate(String endDate) { this.endDate = endDate; }
        public Integer getBillingCycleDay() { return billingCycleDay; }
        public void setBillingCycleDay(Integer billingCycleDay) { this.billingCycleDay = billingCycleDay; }
    }

    public static class PlanInfoDTO {
        private String planName;
        private Double monthlyPrice;
        private String description;

        public String getPlanName() { return planName; }
        public void setPlanName(String planName) { this.planName = planName; }
        public Double getMonthlyPrice() { return monthlyPrice; }
        public void setMonthlyPrice(Double monthlyPrice) { this.monthlyPrice = monthlyPrice; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class FeatureInfoDTO {
        private String name;
        private String value;
        private String unit;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getValue() { return value; }
        public void setValue(String value) { this.value = value; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
    }

    public static class AddOnInfoDTO {
        private String addOnName;
        private Double monthlyPrice;

        public String getAddOnName() { return addOnName; }
        public void setAddOnName(String addOnName) { this.addOnName = addOnName; }
        public Double getMonthlyPrice() { return monthlyPrice; }
        public void setMonthlyPrice(Double monthlyPrice) { this.monthlyPrice = monthlyPrice; }
    }

    public static class PaymentInfoDTO {
        private Double amount;
        private String paymentDate;
        private String method;
        private String status;

        public Double getAmount() { return amount; }
        public void setAmount(Double amount) { this.amount = amount; }
        public String getPaymentDate() { return paymentDate; }
        public void setPaymentDate(String paymentDate) { this.paymentDate = paymentDate; }
        public String getMethod() { return method; }
        public void setMethod(String method) { this.method = method; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}

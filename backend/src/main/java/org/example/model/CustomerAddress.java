package org.example.model;

import jakarta.persistence.*;

@Entity
@Table(name = "CustomerAddresses")
public class CustomerAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "AddressId")
    private Long addressId;

    @Column(name = "CustomerId", nullable = false)
    private Integer customerId;

    @Column(name = "AddressType", nullable = false)
    private String addressType; // "Billing" or "Service"

    @Column(name = "Street1", nullable = false)
    private String street1;

    @Column(name = "Street2")
    private String street2;

    @Column(name = "City", nullable = false)
    private String city;

    @Column(name = "Province", nullable = false)
    private String province;

    @Column(name = "PostalCode", nullable = false)
    private String postalCode;

    @Column(name = "Country", nullable = false)
    private String country;

    @Column(name = "IsPrimary", nullable = false)
    private Integer isPrimary; // 1 or 0

    // getters/setters
    public Long getAddressId() { return addressId; }

    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }

    public String getAddressType() { return addressType; }
    public void setAddressType(String addressType) { this.addressType = addressType; }

    public String getStreet1() { return street1; }
    public void setStreet1(String street1) { this.street1 = street1; }

    public String getStreet2() { return street2; }
    public void setStreet2(String street2) { this.street2 = street2; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }

    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public Integer getIsPrimary() { return isPrimary; }
    public void setIsPrimary(Integer isPrimary) { this.isPrimary = isPrimary; }
}

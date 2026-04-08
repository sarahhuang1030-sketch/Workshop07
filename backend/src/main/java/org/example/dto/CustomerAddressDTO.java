package org.example.dto;

public class CustomerAddressDTO {
    private Integer addressId;
    private Integer customerId;
    private String addressType;
    private String street1;
    private String street2;
    private String city;
    private String province;
    private String postalCode;
    private String country;
    private Integer isPrimary;
    private String fullAddress;

    // Getters and Setters
    public Integer getAddressId() { return addressId; }
    public void setAddressId(Integer addressId) { this.addressId = addressId; }

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

    public String getFullAddress() { return fullAddress; }
    public void setFullAddress(String fullAddress) { this.fullAddress = fullAddress; }
}

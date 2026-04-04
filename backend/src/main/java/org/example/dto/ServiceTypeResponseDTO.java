package org.example.dto;

public class ServiceTypeResponseDTO {
    private Integer serviceTypeId;
    private String serviceTypeName;

    public ServiceTypeResponseDTO() {
    }

    public ServiceTypeResponseDTO(Integer serviceTypeId, String serviceTypeName) {
        this.serviceTypeId = serviceTypeId;
        this.serviceTypeName = serviceTypeName;
    }

    public Integer getServiceTypeId() {
        return serviceTypeId;
    }

    public void setServiceTypeId(Integer serviceTypeId) {
        this.serviceTypeId = serviceTypeId;
    }

    public String getServiceTypeName() {
        return serviceTypeName;
    }

    public void setServiceTypeName(String serviceTypeName) {
        this.serviceTypeName = serviceTypeName;
    }
}
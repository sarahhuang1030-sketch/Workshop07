package org.example.model;


import jakarta.persistence.*;

@Entity
@Table(name = "servicetypes")
public class ServiceType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ServiceTypeId")
    private Integer serviceTypeId;

    @Column(name = "Name", nullable = false, length = 100)
    private String serviceTypeName;

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
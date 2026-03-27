package org.example.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "EmployeeId")
    private Integer employeeId;

    @Column(name = "PrimaryLocationId")
    private Integer primaryLocationId;

    @Column(name = "ReportsToEmployeeId")
    private Integer reportsToEmployeeId;

    @Column(name = "FirstName")
    private String firstName;

    @Column(name = "LastName")
    private String lastName;

    @Column(name = "Email")
    private String email;

    @Column(name = "Phone")
    private String phone;

//    @Column(name = "PositionTitle")
//    private String role;
    @ManyToOne
    @JoinColumn(name = "RoleId")
    private Role role;

    @Column(name = "Salary")
    private BigDecimal salary;

    @Column(name = "HireDate")
    private LocalDate hireDate;

    @Column(name = "Status")
    private String status;

    @Column(name = "Active")
    private Integer active;

    @Column(name = "ManagerId")
    private Integer managerId;

    public Integer getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Integer employeeId) {
        this.employeeId = employeeId;
    }

    public Integer getPrimaryLocationId() {
        return primaryLocationId;
    }

    public void setPrimaryLocationId(Integer primaryLocationId) {
        this.primaryLocationId = primaryLocationId;
    }

    public Integer getReportsToEmployeeId() {
        return reportsToEmployeeId;
    }

    public void setReportsToEmployeeId(Integer reportsToEmployeeId) {
        this.reportsToEmployeeId = reportsToEmployeeId;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
//    public String getRole() {
//        return role;
//    }
//
//    public void setRole(String role) {
//        this.role = role;
//    }

    public BigDecimal getSalary() {
        return salary;
    }

    public void setSalary(BigDecimal salary) {
        this.salary = salary;
    }

    public LocalDate getHireDate() {
        return hireDate;
    }

    public void setHireDate(LocalDate hireDate) {
        this.hireDate = hireDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getActive() {
        return active;
    }

    public void setActive(Integer active) {
        this.active = active;
    }

    public Integer getManagerId() {
        return managerId;
    }

    public void setManagerId(Integer managerId) {
        this.managerId = managerId;
    }
}
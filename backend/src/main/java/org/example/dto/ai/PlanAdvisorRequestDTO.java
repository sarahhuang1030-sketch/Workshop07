package org.example.dto.ai;

public class PlanAdvisorRequestDTO {

    private String serviceType; // Mobile or Internet
    private Integer monthlyBudget;
    private Integer numberOfLines;
    private Integer estimatedDataGb;
    private Integer estimatedInternetSpeedMbps;
    private Integer householdSize;
    private Integer connectedDevices;

    private Boolean needsInternationalCalling;
    private Boolean needsHotspot;
    private Boolean heavyStreaming;

    private String priority; // lowest_price, best_value, most_data, family
    private String userPrompt;
    private String inputMode; // QUESTIONNAIRE, PROMPT, HYBRID

    public void normalize() {
        serviceType = clean(serviceType);
        priority = clean(priority);
        userPrompt = clean(userPrompt);
        inputMode = cleanUpper(inputMode);

        if (monthlyBudget != null && monthlyBudget < 0) monthlyBudget = null;
        if (numberOfLines != null && numberOfLines < 1) numberOfLines = 1;
        if (estimatedDataGb != null && estimatedDataGb < 0) estimatedDataGb = null;
        if (estimatedInternetSpeedMbps != null && estimatedInternetSpeedMbps < 0) estimatedInternetSpeedMbps = null;
        if (householdSize != null && householdSize < 1) householdSize = null;
        if (connectedDevices != null && connectedDevices < 0) connectedDevices = null;
    }

    public boolean isPromptMode() {
        return "PROMPT".equalsIgnoreCase(inputMode);
    }

    public boolean isHybridMode() {
        return "HYBRID".equalsIgnoreCase(inputMode);
    }

    public boolean isQuestionnaireMode() {
        return inputMode == null || "QUESTIONNAIRE".equalsIgnoreCase(inputMode);
    }

    private String clean(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String cleanUpper(String value) {
        String cleaned = clean(value);
        return cleaned == null ? null : cleaned.toUpperCase();
    }

    public String getServiceType() {
        return serviceType;
    }

    public void setServiceType(String serviceType) {
        this.serviceType = serviceType;
    }

    public Integer getMonthlyBudget() {
        return monthlyBudget;
    }

    public void setMonthlyBudget(Integer monthlyBudget) {
        this.monthlyBudget = monthlyBudget;
    }

    public Integer getNumberOfLines() {
        return numberOfLines;
    }

    public void setNumberOfLines(Integer numberOfLines) {
        this.numberOfLines = numberOfLines;
    }

    public Integer getEstimatedDataGb() {
        return estimatedDataGb;
    }

    public void setEstimatedDataGb(Integer estimatedDataGb) {
        this.estimatedDataGb = estimatedDataGb;
    }

    public Integer getEstimatedInternetSpeedMbps() {
        return estimatedInternetSpeedMbps;
    }

    public void setEstimatedInternetSpeedMbps(Integer estimatedInternetSpeedMbps) {
        this.estimatedInternetSpeedMbps = estimatedInternetSpeedMbps;
    }

    public Integer getHouseholdSize() {
        return householdSize;
    }

    public void setHouseholdSize(Integer householdSize) {
        this.householdSize = householdSize;
    }

    public Integer getConnectedDevices() {
        return connectedDevices;
    }

    public void setConnectedDevices(Integer connectedDevices) {
        this.connectedDevices = connectedDevices;
    }

    public Boolean getNeedsInternationalCalling() {
        return needsInternationalCalling;
    }

    public void setNeedsInternationalCalling(Boolean needsInternationalCalling) {
        this.needsInternationalCalling = needsInternationalCalling;
    }

    public Boolean getNeedsHotspot() {
        return needsHotspot;
    }

    public void setNeedsHotspot(Boolean needsHotspot) {
        this.needsHotspot = needsHotspot;
    }

    public Boolean getHeavyStreaming() {
        return heavyStreaming;
    }

    public void setHeavyStreaming(Boolean heavyStreaming) {
        this.heavyStreaming = heavyStreaming;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getUserPrompt() {
        return userPrompt;
    }

    public void setUserPrompt(String userPrompt) {
        this.userPrompt = userPrompt;
    }

    public String getInputMode() {
        return inputMode;
    }

    public void setInputMode(String inputMode) {
        this.inputMode = inputMode;
    }
}
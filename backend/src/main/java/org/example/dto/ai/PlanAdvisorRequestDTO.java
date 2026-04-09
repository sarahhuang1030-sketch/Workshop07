package org.example.dto.ai;

public class PlanAdvisorRequestDTO {

    private String serviceType; // Mobile or Internet
    private Integer monthlyBudget;
    private Integer numberOfLines;
    private Integer estimatedDataGb;
    private Boolean needsInternationalCalling;
    private Boolean needsHotspot;
    private Boolean heavyStreaming;
    private String priority; // lowest_price, best_value, most_data, family

    private String userPrompt;
    private String inputMode; // QUESTIONNAIRE, PROMPT, HYBRID

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

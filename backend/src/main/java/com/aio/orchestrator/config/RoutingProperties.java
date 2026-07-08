package com.aio.orchestrator.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "aio.routing")
public class RoutingProperties {

    private double maxAcceptableCostUsd = 0.25;
    private double minConfidenceThreshold = 0.72;
    private int maxAcceptableLatencyMs = 5500;

    public double getMaxAcceptableCostUsd() {
        return maxAcceptableCostUsd;
    }

    public void setMaxAcceptableCostUsd(double maxAcceptableCostUsd) {
        this.maxAcceptableCostUsd = maxAcceptableCostUsd;
    }

    public double getMinConfidenceThreshold() {
        return minConfidenceThreshold;
    }

    public void setMinConfidenceThreshold(double minConfidenceThreshold) {
        this.minConfidenceThreshold = minConfidenceThreshold;
    }

    public int getMaxAcceptableLatencyMs() {
        return maxAcceptableLatencyMs;
    }

    public void setMaxAcceptableLatencyMs(int maxAcceptableLatencyMs) {
        this.maxAcceptableLatencyMs = maxAcceptableLatencyMs;
    }
}

package com.reachonline.backend.ai.protection;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.ai")
public class AiProtectionProperties {

    private int dailyUserRequestLimit = 10;
    private int globalRequestLimit = 50;
    private long globalTokenLimit = 50_000;
    private int maxOutputTokens = 800;
    private int ipRequestsPerMinute = 5;
    private int maxActiveGenerationsPerUser = 1;
    private int maxActiveGenerations = 5;
    private long maxInputTokens = 4_000;
    private long requestStructureOverheadTokens = 256;
    private long reservationTimeoutSeconds = 300;
    private String trustedProxies = "";

    public int getDailyUserRequestLimit() {
        return dailyUserRequestLimit;
    }

    public void setDailyUserRequestLimit(int dailyUserRequestLimit) {
        this.dailyUserRequestLimit = dailyUserRequestLimit;
    }

    public int getGlobalRequestLimit() {
        return globalRequestLimit;
    }

    public void setGlobalRequestLimit(int globalRequestLimit) {
        this.globalRequestLimit = globalRequestLimit;
    }

    public long getGlobalTokenLimit() {
        return globalTokenLimit;
    }

    public void setGlobalTokenLimit(long globalTokenLimit) {
        this.globalTokenLimit = globalTokenLimit;
    }

    public int getMaxOutputTokens() {
        return maxOutputTokens;
    }

    public void setMaxOutputTokens(int maxOutputTokens) {
        this.maxOutputTokens = maxOutputTokens;
    }

    public int getIpRequestsPerMinute() {
        return ipRequestsPerMinute;
    }

    public void setIpRequestsPerMinute(int ipRequestsPerMinute) {
        this.ipRequestsPerMinute = ipRequestsPerMinute;
    }

    public int getMaxActiveGenerationsPerUser() {
        return maxActiveGenerationsPerUser;
    }

    public void setMaxActiveGenerationsPerUser(int maxActiveGenerationsPerUser) {
        this.maxActiveGenerationsPerUser = maxActiveGenerationsPerUser;
    }

    public int getMaxActiveGenerations() {
        return maxActiveGenerations;
    }

    public void setMaxActiveGenerations(int maxActiveGenerations) {
        this.maxActiveGenerations = maxActiveGenerations;
    }

    public long getMaxInputTokens() {
        return maxInputTokens;
    }

    public void setMaxInputTokens(long maxInputTokens) {
        this.maxInputTokens = maxInputTokens;
    }

    public long getRequestStructureOverheadTokens() {
        return requestStructureOverheadTokens;
    }

    public void setRequestStructureOverheadTokens(
            long requestStructureOverheadTokens
    ) {
        this.requestStructureOverheadTokens = requestStructureOverheadTokens;
    }

    public long getReservationTimeoutSeconds() {
        return reservationTimeoutSeconds;
    }

    public void setReservationTimeoutSeconds(long reservationTimeoutSeconds) {
        this.reservationTimeoutSeconds = reservationTimeoutSeconds;
    }

    public String getTrustedProxies() {
        return trustedProxies;
    }

    public void setTrustedProxies(String trustedProxies) {
        this.trustedProxies = trustedProxies;
    }
}

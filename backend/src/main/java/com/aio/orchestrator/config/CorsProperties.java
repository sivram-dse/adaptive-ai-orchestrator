package com.aio.orchestrator.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "aio.cors")
public class CorsProperties {

    private List<String> allowedOriginPatterns = new ArrayList<>(List.of(
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://*.vercel.app"));

    public List<String> getAllowedOriginPatterns() {
        return List.copyOf(allowedOriginPatterns);
    }

    public void setAllowedOriginPatterns(List<String> allowedOriginPatterns) {
        this.allowedOriginPatterns = allowedOriginPatterns == null
                ? new ArrayList<>()
                : new ArrayList<>(allowedOriginPatterns);
    }
}

package com.aio.orchestrator.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final CorsProperties corsProperties;

    public WebConfig(CorsProperties corsProperties) {
        this.corsProperties = corsProperties;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = corsProperties.getAllowedOriginPatterns().toArray(String[]::new);
        configure(registry, "/api/**", origins);
        configure(registry, "/health", origins);
        configure(registry, "/actuator/health", origins);
    }

    private void configure(CorsRegistry registry, String path, String[] origins) {
        registry.addMapping(path)
                .allowedOriginPatterns(origins)
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("Content-Type", "Accept", "X-Correlation-Id")
                .exposedHeaders("X-Correlation-Id")
                .allowCredentials(false)
                .maxAge(3600);
    }
}

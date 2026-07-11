package com.aio.orchestrator.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class OrchestrationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldExecuteRequestThroughRestApi() throws Exception {
        String payload = """
                {
                  "tenantId": "tenant",
                  "userId": "user",
                  "payload": "Validate this JSON payload"
                }
                """;

        mockMvc.perform(post("/api/v1/orchestrator/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestId").isNotEmpty())
                .andExpect(jsonPath("$.strategy").isNotEmpty());
    }

    @Test
    void shouldAllowLocalViteDemoOrigin() throws Exception {
        mockMvc.perform(options("/api/v1/orchestrator/execute")
                        .header("Origin", "http://127.0.0.1:5173")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://127.0.0.1:5173"));
    }

    @Test
    void shouldAllowVercelPreviewOrigin() throws Exception {
        mockMvc.perform(options("/api/v1/orchestrator/execute")
                        .header("Origin", "https://adaptive-ai-orchestrator-preview.vercel.app")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        "Access-Control-Allow-Origin",
                        "https://adaptive-ai-orchestrator-preview.vercel.app"));
    }

    @Test
    void shouldReturnProductionSecurityHeaders() throws Exception {
        mockMvc.perform(post("/api/v1/orchestrator/execute")
                        .header("X-Forwarded-Proto", "https")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "tenantId": "tenant",
                                  "userId": "user",
                                  "payload": "Classify this request"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Strict-Transport-Security", "max-age=31536000; includeSubDomains"));
    }
}

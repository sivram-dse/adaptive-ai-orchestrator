package com.aio.orchestrator.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
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

    @ParameterizedTest
    @CsvSource({
            "translation,easy,Translate this paragraph from English to French while preserving formal business tone.",
            "travel,complex,Plan a 5-day business trip to Tokyo including flight hotel options commute estimates and itinerary.",
            "reasoning,complex,Review this enterprise platform architecture and propose phased migration strategy with risks and controls."
    })
    void shouldExecuteDemoSkillScenariosWithoutServerError(String category, String difficulty, String prompt)
            throws Exception {
        String payload = """
                {
                  "tenantId": "tenant",
                  "userId": "user",
                  "payload": "%s",
                  "metadata": {
                    "category": "%s",
                    "difficulty": "%s"
                  }
                }
                """.formatted(prompt, category, difficulty);

        mockMvc.perform(post("/api/v1/orchestrator/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.strategy").isNotEmpty())
                .andExpect(jsonPath("$.output").isNotEmpty());
    }
}

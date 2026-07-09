package com.aio.orchestrator.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.aio.orchestrator.repository.ExecutionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AnalyticsAndObservabilityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ExecutionRepository executionRepository;

    @Test
    void shouldExposeAnalyticsAndObservabilityApis() throws Exception {
        String payload = """
                {
                  "tenantId": "tenant",
                  "userId": "user",
                  "payload": "Draft an email summary for project progress",
                  "metadata": {
                    "category": "email",
                    "difficulty": "easy"
                  }
                }
                """;

        mockMvc.perform(post("/api/v1/orchestrator/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/orchestrator/analytics/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRequests").isNumber());

        mockMvc.perform(get("/api/v1/orchestrator/analytics/paths"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/orchestrator/analytics/history"))
                .andExpect(status().isOk());

        int historyCountBeforeScenarios = executionRepository.findRecent(5000).size();

        mockMvc.perform(get("/api/v1/orchestrator/analytics/scenarios"))
                .andExpect(status().isOk());

        int historyCountAfterScenarios = executionRepository.findRecent(5000).size();
        assertEquals(historyCountBeforeScenarios, historyCountAfterScenarios);

        mockMvc.perform(get("/api/v1/orchestrator/observability/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRequests").isNumber());

        mockMvc.perform(get("/api/v1/orchestrator/observability/traces"))
                .andExpect(status().isOk());
    }
}

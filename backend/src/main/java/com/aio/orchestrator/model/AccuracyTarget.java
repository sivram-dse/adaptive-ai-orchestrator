package com.aio.orchestrator.model;

public record AccuracyTarget(
        double minimumScore,
        boolean requiresDeterminism,
        boolean safetyCritical
) {
}

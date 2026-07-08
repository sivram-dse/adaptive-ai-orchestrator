package com.aio.orchestrator.decision;

import com.aio.orchestrator.model.TaskComplexity;
import com.aio.orchestrator.model.UserRequest;

public interface ComplexityClassifier {

    TaskComplexity classify(UserRequest request);
}

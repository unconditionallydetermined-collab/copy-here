package com.careersync.exception;

import com.careersync.config.RequestLoggingFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        String requestId = resolveRequestId();
        log.warn("[{}] Max upload size exceeded: {}", requestId, ex.getMessage());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", "File size exceeds maximum allowed limit (10MB)");
        body.put("requestId", requestId);
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAllExceptions(Exception ex) {
        String requestId = resolveRequestId();
        log.error("[{}] Unhandled exception occurred: {}", requestId, ex.getMessage(), ex);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getMessage() != null ? ex.getMessage() : "An unexpected server error occurred");
        body.put("requestId", requestId);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    private String resolveRequestId() {
        String reqId = MDC.get(RequestLoggingFilter.MDC_REQUEST_ID_KEY);
        return (reqId != null && !reqId.isBlank()) ? reqId : UUID.randomUUID().toString();
    }
}

package org.example.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RideServiceException.class)
    public ResponseEntity<String> handleRideServiceException(RideServiceException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntimeException(RuntimeException ex) {
        // Catching previously thrown generic RuntimeExceptions and turning them into 400s 
        // until they are all migrated to RideServiceException
        if (ex.getMessage() != null && (
                ex.getMessage().contains("not found") ||
                ex.getMessage().contains("No seats available") ||
                ex.getMessage().contains("already joined") ||
                ex.getMessage().contains("creator cannot") ||
                ex.getMessage().contains("not open"))) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
        return ResponseEntity.internalServerError().body("An unexpected error occurred: " + ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        return ResponseEntity.badRequest().body(errors);
    }
}

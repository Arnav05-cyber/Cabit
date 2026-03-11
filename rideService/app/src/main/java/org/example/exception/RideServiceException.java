package org.example.exception;

public class RideServiceException extends RuntimeException {
    public RideServiceException(String message) {
        super(message);
    }
}

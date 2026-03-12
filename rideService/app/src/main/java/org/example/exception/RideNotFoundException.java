package org.example.exception;

public class RideNotFoundException extends RideServiceException {
    public RideNotFoundException(String message) {
        super(message);
    }
}

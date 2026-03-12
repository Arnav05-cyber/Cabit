package org.example.exception;

public class NoSeatsAvailableException extends RideServiceException {
    public NoSeatsAvailableException(String message) {
        super(message);
    }
}

package org.example.exception;

public class InvalidRideActionException extends RideServiceException {
    public InvalidRideActionException(String message) {
        super(message);
    }
}

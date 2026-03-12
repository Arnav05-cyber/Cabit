package org.example.exception;

public class UserAlreadyJoinedException extends RideServiceException {
    public UserAlreadyJoinedException(String message) {
        super(message);
    }
}

package org.example.service;

import org.example.entities.RefreshToken;
import org.example.entities.UserInfo;
import org.example.repos.RefreshTokenRepo;
import org.example.repos.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {

    @Autowired JwtService jwtService;
    @Autowired RefreshTokenRepo refreshTokenRepo;
    @Autowired UserRepo userRepo;

    @Transactional
    public RefreshToken createRefreshToken(String userName) {
        UserInfo user = userRepo.findByUserName(userName);

        // Delete any existing refresh token for this user (FIXES DUPLICATE ISSUE)
        refreshTokenRepo.findByUserInfo(user).ifPresent(refreshTokenRepo::delete);

        RefreshToken refreshToken = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusSeconds(60 * 60 * 24 * 7))  // Changed to 7 days
                .userInfo(user)
                .build();
        return refreshTokenRepo.save(refreshToken);
    }

    // Add this new method for logout
    @Transactional
    public void deleteByUser(UserInfo user) {
        refreshTokenRepo.findByUserInfo(user).ifPresent(refreshTokenRepo::delete);
    }

    public RefreshToken isTokenExpired(RefreshToken refreshToken) {
        if (refreshToken.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepo.delete(refreshToken);
            throw new RuntimeException(refreshToken.getToken() + " Refresh token expired. Please login again.");
        }
        return refreshToken;
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepo.findByToken(token);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepo.delete(token);
            throw new RuntimeException("Refresh token expired. Please login again.");
        }
        return token;
    }
}

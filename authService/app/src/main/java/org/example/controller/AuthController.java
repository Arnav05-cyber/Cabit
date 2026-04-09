package org.example.controller;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.example.entities.RefreshToken;
import org.example.entities.UserInfo;
import org.example.eventProducer.UserInfoProducer;
import org.example.model.UserInfoDto;
import org.example.repos.UserRepo;
import org.example.response.JwtResponseDTO;
import org.example.service.JwtService;
import org.example.service.RefreshTokenService;
import org.example.service.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.Map;

@AllArgsConstructor
@RestController
public class AuthController {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private UserDetailsImpl userDetailsImpl;

    @Autowired
    private UserRepo userRepo;  // Add this



    @PostMapping("/auth/v1/signup")
    public ResponseEntity signup(@RequestBody UserInfoDto userInfoDto){
        try {
            Boolean isSignedUp = userDetailsImpl.signUpUser(userInfoDto);
            if(Boolean.FALSE.equals(isSignedUp)) {
                // Check if user already exists to give a more specific message
                if (userRepo.findByUserName(userInfoDto.getUserName()) != null) {
                    return ResponseEntity.status(400).body(Map.of("message", "Username already exists. Please choose a different one."));
                }
                return ResponseEntity.status(400).body(Map.of("message", "Invalid email or password. Password must be at least 4 characters and contain uppercase, lowercase, a digit, and a special character (!@#$%^&*()-+)."));
            }
            System.out.println("User signed up successfully: " + userInfoDto.getUserName());
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(userInfoDto.getUserName());
            // Embed userId claim in the token so downstream services can identify users by UUID
            UserInfo savedUser = userRepo.findByUserName(userInfoDto.getUserName());
            Map<String, Object> extraClaims = new java.util.HashMap<>();
            extraClaims.put("userId", savedUser.getUserId());
            String jwtToken = jwtService.generateToken(new org.example.service.CustomUserDetails(savedUser), extraClaims);
            return new ResponseEntity<>(JwtResponseDTO.builder()
                    .accessToken(jwtToken)
                    .token(refreshToken.getToken())
                    .userName(userInfoDto.getUserName())
                    .email(userInfoDto.getEmail())
                    .userId(savedUser.getUserId())
                    .phoneNumber(savedUser.getPhoneNumber())
                    .place1(savedUser.getPlace1())
                    .place2(savedUser.getPlace2())
                    .build(), HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Internal server error: " + e.getMessage()));
        }
    }

    @PutMapping("/auth/v1/complete-profile")
    public ResponseEntity<?> completeProfile(@RequestHeader("Authorization") String authHeader, @RequestBody org.example.request.ProfileUpdateRequestDTO request) {
        try {
            String token = authHeader.substring(7); // Remove "Bearer "
            String username = jwtService.extractUsername(token);
            UserInfo user = userRepo.findByUserName(username);
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }

            UserInfo updatedUser = userDetailsImpl.updateOAuthUserProfile(user, request);
            return ResponseEntity.ok(Map.of(
                "message", "Profile updated successfully",
                "phoneNumber", updatedUser.getPhoneNumber(),
                "place1", updatedUser.getPlace1(),
                "place2", updatedUser.getPlace2()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to update profile: " + e.getMessage()));
        }
    }



    @PostMapping("/auth/v1/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract username from JWT token
            String token = authHeader.substring(7); // Remove "Bearer "
            String username = jwtService.extractUsername(token);

            // Delete refresh token for this user
            UserInfo user = userRepo.findByUserName(username);
            if (user != null) {
                refreshTokenService.deleteByUser(user);
                return ResponseEntity.ok("Logged out successfully");
            } else {
                return ResponseEntity.status(404).body("User not found");
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Logout failed: " + e.getMessage());
        }
    }

    @GetMapping("/ping")
    public ResponseEntity<java.util.Map<String, Object>> ping() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof org.example.service.CustomUserDetails) {
                String userId = ((org.example.service.CustomUserDetails) principal).getUserId();
                java.util.Map<String, Object> response = new java.util.HashMap<>();
                response.put("userId", userId);
                response.put("valid", true);
                return ResponseEntity.ok(response);
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}

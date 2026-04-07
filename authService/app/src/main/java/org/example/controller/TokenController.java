package org.example.controller;

import org.apache.catalina.User;
import org.example.entities.RefreshToken;
import org.example.entities.UserInfo;
import org.example.request.AuthRequestDTO;
import org.example.request.RefreshTokenRequestDTO;
import org.example.response.JwtResponseDTO;
import org.example.service.JwtService;
import org.example.service.RefreshTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.example.request.GoogleLoginRequest;
import org.example.service.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;
import java.util.Collections;
@RestController  // Changed from @Controller to @RestController
public class TokenController {

    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;
    private final UserDetailsImpl userDetailsImpl;

    @Value("${google.client.id}")
    private String googleClientId;

    private GoogleIdTokenVerifier verifier;

    public TokenController(AuthenticationManager authenticationManager,
                           RefreshTokenService refreshTokenService,
                           JwtService jwtService,
                           UserDetailsImpl userDetailsImpl) {
        this.authenticationManager = authenticationManager;
        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
        this.userDetailsImpl = userDetailsImpl;
    }

    @PostConstruct
    public void init() {
        verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
            .setAudience(Collections.singletonList(googleClientId))
            .build();
    }

    @PostMapping("/auth/v1/login")
    public ResponseEntity<?> AuthenticateAndGetToken(@RequestBody AuthRequestDTO authRequestDTO) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authRequestDTO.getUserName(),
                        authRequestDTO.getPassword()
                )
        );

        if (authentication.isAuthenticated()) {
            RefreshToken refreshToken =
                    refreshTokenService.createRefreshToken(authRequestDTO.getUserName());

            // Get user info to return email and userId
            String userName = authRequestDTO.getUserName();
            UserInfo userInfo = authentication.getPrincipal() instanceof org.example.service.CustomUserDetails
                    ? (UserInfo) authentication.getPrincipal()
                    : null;
            String email = userInfo != null ? userInfo.getEmail() : null;
            String userId = userInfo != null ? userInfo.getUserId() : null;

            java.util.Map<String, Object> extraClaims = new java.util.HashMap<>();
            if (userId != null) {
                extraClaims.put("userId", userId);
            }
            String jwtToken = userInfo != null 
                    ? jwtService.generateToken((org.springframework.security.core.userdetails.UserDetails) userInfo, extraClaims)
                    : jwtService.GenerateToken(userName);

            return new ResponseEntity<>(
                    JwtResponseDTO.builder()
                            .accessToken(jwtToken)
                            .token(refreshToken.getToken())
                            .userName(userName)
                            .email(email)
                            .userId(userId)
                            .build(),
                    HttpStatus.OK
            );
        } else {
            return new ResponseEntity<>(
                    "Exception in user service",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @PostMapping("/auth/v1/refreshToken")
    public JwtResponseDTO refreshToken(
            @RequestBody RefreshTokenRequestDTO refreshTokenRequestDTO) {

        return refreshTokenService.findByToken(refreshTokenRequestDTO.getRefreshToken())
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUserInfo)
                .map(userInfo -> {
                    java.util.Map<String, Object> extraClaims = new java.util.HashMap<>();
                    extraClaims.put("userId", userInfo.getUserId());
                    String accessToken = jwtService.generateToken(
                            new org.example.service.CustomUserDetails(userInfo), extraClaims);

                    return JwtResponseDTO.builder()
                            .accessToken(accessToken)
                            .token(refreshTokenRequestDTO.getRefreshToken())
                            .userName(userInfo.getUserName())
                            .email(userInfo.getEmail())
                            .userId(userInfo.getUserId())
                            .build();
                })
                .orElseThrow(() ->
                        new RuntimeException("Refresh token is not in database!")
                );
    }

    @PostMapping("/auth/v1/google")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {
        try {
            GoogleIdToken idToken = verifier.verify(request.getIdToken());
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();

                String email = payload.getEmail();
                String name = (String) payload.get("name");

                // Check or register user
                UserInfo userInfo = userDetailsImpl.signUpOAuthUser(email, name);

                // Create tokens
                RefreshToken refreshToken = refreshTokenService.createRefreshToken(userInfo.getUserName());
                
                java.util.Map<String, Object> extraClaims = new java.util.HashMap<>();
                extraClaims.put("userId", userInfo.getUserId());
                String jwtToken = jwtService.generateToken(
                        new org.example.service.CustomUserDetails(userInfo), extraClaims);

                return new ResponseEntity<>(
                        JwtResponseDTO.builder()
                                .accessToken(jwtToken)
                                .token(refreshToken.getToken())
                                .userName(userInfo.getUserName())
                                .email(userInfo.getEmail())
                                .userId(userInfo.getUserId())
                                .build(),
                        HttpStatus.OK
                );

            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid ID token.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error verifying token: " + e.getMessage());
        }
    }
}

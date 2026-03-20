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
import org.springframework.web.bind.annotation.RestController;  // Change this

@RestController  // Changed from @Controller to @RestController
public class TokenController {

    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;

    public TokenController(AuthenticationManager authenticationManager,
                           RefreshTokenService refreshTokenService,
                           JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
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

            // Get user info to return email
            String userName = authRequestDTO.getUserName();
            UserInfo userInfo = authentication.getPrincipal() instanceof org.example.service.CustomUserDetails
                    ? (UserInfo) authentication.getPrincipal()
                    : null;
            String email = userInfo != null ? userInfo.getEmail() : null;

            return new ResponseEntity<>(
                    JwtResponseDTO.builder()
                            .accessToken(jwtService.GenerateToken(userName))
                            .token(refreshToken.getToken())
                            .userName(userName)
                            .email(email)
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
                    String accessToken =
                            jwtService.GenerateToken(userInfo.getUserName());

                    return JwtResponseDTO.builder()
                            .accessToken(accessToken)
                            .token(refreshTokenRequestDTO.getRefreshToken())
                            .userName(userInfo.getUserName())
                            .email(userInfo.getEmail())
                            .build();
                })
                .orElseThrow(() ->
                        new RuntimeException("Refresh token is not in database!")
                );
    }
}

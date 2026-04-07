package org.example.service;


import lombok.AllArgsConstructor;
import lombok.Builder;
import org.example.entities.UserInfo;
import org.example.model.UserInfoDto;
import org.example.repos.UserRepo;
import org.example.utils.ValidateUserUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.UUID;

@Component
@AllArgsConstructor
@Builder
public class UserDetailsImpl implements UserDetailsService {

    @Autowired
    private final UserRepo userRepo;

    @Autowired
    private final PasswordEncoder passwordEncoder;

    @Autowired
    private final KafkaEventSender kafkaEventSender;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserInfo user = userRepo.findByUserName(username);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        } else {
            return new CustomUserDetails(user);
        }
    }

    public UserInfo checkIfUserExists(UserInfoDto userInfoDto) throws UsernameNotFoundException {
        return userRepo.findByUserName(userInfoDto.getUserName());
    }

    @Transactional
    public Boolean signUpUser(UserInfoDto userInfoDto) {
        if(!ValidateUserUtil.isValidUser(userInfoDto.getEmail(), userInfoDto.getPassword())) {
            System.out.println("Invalid user info for: " + userInfoDto.getUserName());
            return false;
        }
        System.out.println("Signing up user: " + userInfoDto.getUserName());
        
        // Check if user already exists (optional - for duplicate prevention)
        if(Objects.nonNull(checkIfUserExists(userInfoDto))) {
            return false;
        }
        
        // Encode password
        String encodedPassword = passwordEncoder.encode(userInfoDto.getPassword());
        
        // Save user in AUTH SERVICE database (for login authentication)
        String userId = UUID.randomUUID().toString();
        userRepo.save(new UserInfo(
            userId, 
            userInfoDto.getUserName(), 
            encodedPassword, 
            userInfoDto.getEmail(), 
            userInfoDto.getPlace1(), 
            userInfoDto.getPlace2(), 
            new java.util.HashSet<>()
        ));
        
        // Send Kafka event to USER SERVICE (for user profile)
        userInfoDto.setPassword(null);
        userInfoDto.setUserId(userId);
        kafkaEventSender.trySendingEvent(userInfoDto);
        return true;
    }

    @Transactional
    public UserInfo signUpOAuthUser(String email, String name) {
        UserInfo user = userRepo.findByEmail(email);
        if (user != null) {
            return user; // User already exists
        }

        System.out.println("Auto-registering OAuth user: " + email);
        
        // Generate a random password since they login via Google
        String randomPassword = UUID.randomUUID().toString();
        String encodedPassword = passwordEncoder.encode(randomPassword);
        
        String userId = UUID.randomUUID().toString();
        
        // Ensure place1, place2 are not null but empty strings if needed
        user = new UserInfo(
            userId, 
            email, // Use email as username
            encodedPassword, 
            email, 
            "", // place1
            "", // place2
            new java.util.HashSet<>()
        );
        
        userRepo.save(user);
        
        // Send Kafka event to USER SERVICE
        UserInfoDto userInfoDto = new UserInfoDto();
        userInfoDto.setUserId(userId);
        userInfoDto.setUserName(email); // Use email as username
        userInfoDto.setEmail(email);
        
        // Split name into first and last name if possible
        if (name != null) {
            String[] parts = name.split(" ", 2);
            userInfoDto.setFirstName(parts[0]);
            if (parts.length > 1) {
                userInfoDto.setLastName(parts[1]);
            }
        }
        
        kafkaEventSender.trySendingEvent(userInfoDto);
        
        return user;
    }

}

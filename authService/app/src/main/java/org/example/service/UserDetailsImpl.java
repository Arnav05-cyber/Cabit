package org.example.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import org.example.entities.UserInfo;
import org.example.model.UserInfoDto;
import org.example.outbox.OutboxEventService;
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

    // OutboxEventService replaces direct Kafka publishing.
    // Events are written to the DB atomically with the user record.
    @Autowired
    private final OutboxEventService outboxEventService;

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
            userInfoDto.getPhoneNumber(),
            userInfoDto.getPlace1(), 
            userInfoDto.getPlace2(), 
            new java.util.HashSet<>()
        ));
        
        // Write to outbox table atomically — same @Transactional as userRepo.save() above.
        // The OutboxPoller will pick this up within 5 seconds and publish to Kafka.
        userInfoDto.setPassword(null);
        userInfoDto.setUserId(userId);
        outboxEventService.saveUserEvent(userInfoDto);
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
            "", // phoneNumber
            "", // place1
            "", // place2
            new java.util.HashSet<>()
        );
        
        userRepo.save(user);

        // Write Kafka event to outbox atomically — same @Transactional as userRepo.save() above.
        UserInfoDto userInfoDto = new UserInfoDto();
        userInfoDto.setUserId(userId);
        userInfoDto.setUserName(email);
        userInfoDto.setEmail(email);

        if (name != null) {
            String[] parts = name.split(" ", 2);
            userInfoDto.setFirstName(parts[0]);
            if (parts.length > 1) {
                userInfoDto.setLastName(parts[1]);
            }
        }

        outboxEventService.saveUserEvent(userInfoDto);

        return user;
    }
    @Transactional
    public UserInfo updateOAuthUserProfile(UserInfo user, org.example.request.ProfileUpdateRequestDTO dto) {
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setPlace1(dto.getPlace1());
        user.setPlace2(dto.getPlace2());
        userRepo.save(user);

        // Notify downstream services via outbox
        UserInfoDto userInfoDto = new UserInfoDto();
        userInfoDto.setUserId(user.getUserId());
        userInfoDto.setUserName(user.getUserName());
        userInfoDto.setEmail(user.getEmail());
        userInfoDto.setPhoneNumber(user.getPhoneNumber());
        userInfoDto.setPlace1(user.getPlace1());
        userInfoDto.setPlace2(user.getPlace2());
        
        if (user.getUserName() != null) {
            String[] parts = user.getUserName().split(" ", 2);
            userInfoDto.setFirstName(parts[0]);
            if (parts.length > 1) {
                userInfoDto.setLastName(parts[1]);
            }
        }

        outboxEventService.saveUserEvent(userInfoDto);
        return user;
    }

}

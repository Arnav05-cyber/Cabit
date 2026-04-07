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


}

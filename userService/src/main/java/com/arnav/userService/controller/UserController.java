package com.arnav.userService.controller;

import com.arnav.userService.dtos.UserDto;
import com.arnav.userService.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/user/createUpdate")
    public ResponseEntity<UserDto> createUpdate(@RequestBody UserDto userDto) {
        try{
            UserDto user = userService.createOrUpdateUser(userDto);
            return ResponseEntity.ok(user);
        }catch (Exception e){
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/user/getUser")
    public ResponseEntity<UserDto> getUser(@RequestParam String email) {
        try{
            UserDto user = userService.getUserDetails(email);
            return ResponseEntity.ok(user);
        }catch (Exception e){
            return ResponseEntity.status(500).build();
        }
    }
}

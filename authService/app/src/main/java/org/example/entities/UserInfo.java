package org.example.entities;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.context.annotation.Bean;

import java.util.Set;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
@Getter
@Setter
public class UserInfo {

    @Id
    @Column(name = "user_id")
    private String userId;

    @Column(name = "user_name")
    private String userName;

    private String password;

    @Column(name = "email")  // Added email field
    private String email;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "place1")
    private String place1;

    @Column(name = "place2")
    private String place2;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<UserRole> roles = new java.util.HashSet<>();
}

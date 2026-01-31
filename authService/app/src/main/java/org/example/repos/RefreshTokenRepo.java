package org.example.repos;

import org.example.entities.RefreshToken;
import org.example.entities.UserInfo;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepo extends CrudRepository<RefreshToken, Integer> {

    Optional<RefreshToken> findByToken(String token);

    // Add these new methods
    Optional<RefreshToken> findByUserInfo(UserInfo userInfo);
    void deleteByUserInfo(UserInfo userInfo);
}

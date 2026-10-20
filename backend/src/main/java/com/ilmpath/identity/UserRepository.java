package com.ilmpath.identity;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByRole(Role role);
    long countByRole(Role role);

    /** The only way gender is ever written after registration: succeeds only while it is still NULL. */
    @Modifying(clearAutomatically = true)
    @Query("update User u set u.gender = :g where u.id = :id and u.gender is null")
    int setGenderOnce(@Param("id") String id, @Param("g") Gender g);
}

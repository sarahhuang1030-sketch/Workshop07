package org.example.service;

import org.example.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordMigration implements ApplicationRunner {

    @Autowired
    UserAccountRepository repo;
    @Autowired
    PasswordEncoder encoder;

    @Override
    public void run(ApplicationArguments args) {
        repo.findAll().forEach(u -> {
            String hash = u.getPasswordHash();
            if (hash != null && !hash.startsWith("$2a$") && !hash.startsWith("$2b$")) {
                u.setPasswordHash(encoder.encode(hash));
                repo.save(u);
                System.out.println("Migrated: " + u.getUsername());
            }
        });
    }
}

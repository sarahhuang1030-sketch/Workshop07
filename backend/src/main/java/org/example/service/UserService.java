package org.example.service;

import org.example.entity.User;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserService {

    private final List<User> users = new ArrayList<>();

    public UserService() {
        users.add(new User("Alice", "alice@example.com"));
        users.add(new User("Bob", "bob@example.com"));
    }

    public List<User> findAllUsers() {
        return users;
    }
}

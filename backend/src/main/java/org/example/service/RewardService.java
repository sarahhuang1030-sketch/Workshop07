package org.example.service;

import org.example.model.UserAccount;
import org.example.repository.UserAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RewardService {

    private final UserAccountRepository userRepo;

    public RewardService(UserAccountRepository userRepo) {
        this.userRepo = userRepo;
    }

    private static final int POINTS_PER_DOLLAR = 1;

    @Transactional
    public void addPointsFromInvoice(UserAccount user, Double total) {

        if (user == null || total == null) return;

        int pointsToAdd = (int) Math.floor(total * POINTS_PER_DOLLAR);

        user.addPoints(pointsToAdd);

        userRepo.save(user);
    }
}
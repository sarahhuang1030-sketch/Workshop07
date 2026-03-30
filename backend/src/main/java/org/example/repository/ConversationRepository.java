package org.example.repository;

import org.example.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConversationRepository extends JpaRepository<Conversation, Integer> {

    List<Conversation> findByUserHighIdOrUserLowIdOrderByLastMessageAtDesc(
            Integer high, Integer low
    );
}

package com.ilmpath.questions;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "question_replies") @Getter @Setter
public class QuestionReply {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "question_id") private Long questionId;
    @Column(name = "user_id") private String userId;
    private String status = "VISIBLE";
    @Column(columnDefinition = "TEXT") private String body;
    @Column(name = "created_at") private Instant createdAt = Instant.now();
}

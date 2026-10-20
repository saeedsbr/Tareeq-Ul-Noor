package com.ilmpath.discussions;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "discussion_posts") @Getter @Setter
public class DiscussionPost {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "room_id") private Long roomId;
    @Column(name = "user_id") private String userId;
    @Column(name = "parent_id") private Long parentId;
    @Column(columnDefinition = "TEXT") private String body;
    private String status = "VISIBLE"; // VISIBLE | HIDDEN
    @Column(name = "created_at") private Instant createdAt = Instant.now();
}

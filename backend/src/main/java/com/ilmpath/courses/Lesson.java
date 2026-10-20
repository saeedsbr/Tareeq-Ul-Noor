package com.ilmpath.courses;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "lessons") @Getter @Setter
public class Lesson {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "course_id") private Long courseId;
    private String title;
    private String slug;
    @Column(columnDefinition = "TEXT") private String description;
    @Column(name = "video_provider") private String videoProvider = "YOUTUBE";
    @Column(name = "video_url") private String videoUrl;
    @Column(name = "duration_minutes") private Integer durationMinutes;
    private int position;
    private String status = "DRAFT";
    @Column(name = "published_at") private Instant publishedAt;
    @Column(name = "created_at") private Instant createdAt = Instant.now();
    @Column(name = "updated_at") private Instant updatedAt = Instant.now();
    @PreUpdate void touch() { updatedAt = Instant.now(); }
}

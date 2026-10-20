package com.ilmpath.courses;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "courses") @Getter @Setter
public class Course {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String title;
    private String slug;
    @Column(columnDefinition = "TEXT") private String description;
    private String level = "Beginner";
    @Column(name = "cover_image_url") private String coverImageUrl;
    private String status = "DRAFT"; // DRAFT, PUBLISHED, ARCHIVED
    private int position;
    @Column(name = "created_by") private String createdBy;
    @Column(name = "created_at") private Instant createdAt = Instant.now();
    @Column(name = "updated_at") private Instant updatedAt = Instant.now();
    @PreUpdate void touch() { updatedAt = Instant.now(); }
}

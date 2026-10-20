package com.ilmpath.resources;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "notes") @Getter @Setter
public class Note {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "course_id") private Long courseId;
    @Column(name = "lesson_id") private Long lessonId;
    private String kind = "NOTE"; // NOTE | BENEFIT
    private String title;
    @Column(columnDefinition = "TEXT") private String body;
    @Column(name = "attachment_name") private String attachmentName;
    @Column(name = "attachment_url") private String attachmentUrl;
    private String status = "DRAFT";
    @Column(name = "created_by") private String createdBy;
    @Column(name = "created_at") private Instant createdAt = Instant.now();
    @Column(name = "updated_at") private Instant updatedAt = Instant.now();
    @PreUpdate void touch() { updatedAt = Instant.now(); }
}

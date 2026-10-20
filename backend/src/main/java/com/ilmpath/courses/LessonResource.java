package com.ilmpath.courses;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "lesson_resources") @Getter @Setter
public class LessonResource {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "lesson_id") private Long lessonId;
    private String title;
    @Column(name = "resource_type") private String resourceType = "LINK";
    @Column(name = "content_or_url", columnDefinition = "TEXT") private String contentOrUrl;
    private int position;
}

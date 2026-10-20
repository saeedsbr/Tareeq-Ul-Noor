package com.ilmpath.files;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "uploaded_files") @Getter @Setter
public class UploadedFile {
    @Id @Column(length = 36) private String id = UUID.randomUUID().toString();
    @Column(name = "original_name") private String originalName;
    @Column(name = "stored_name") private String storedName;
    @Column(name = "content_type") private String contentType;
    @Column(name = "size_bytes") private long sizeBytes;
    @Column(name = "uploaded_by") private String uploadedBy;
    @Column(name = "created_at") private Instant createdAt = Instant.now();
}

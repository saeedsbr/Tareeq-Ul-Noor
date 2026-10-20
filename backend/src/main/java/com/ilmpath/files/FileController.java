package com.ilmpath.files;

import com.ilmpath.common.ApiException;
import com.ilmpath.identity.CurrentUser;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Map;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1")
public class FileController {
    public record FileDto(String id, String name, String url, String contentType, long size) {}

    private final FileStorageService storage;
    private final UploadedFileRepository repo;

    public FileController(FileStorageService storage, UploadedFileRepository repo) { this.storage = storage; this.repo = repo; }

    /** Administrator-only (the /api/v1/admin/** rule applies). */
    @PostMapping("/admin/files") @ResponseStatus(HttpStatus.CREATED)
    public FileDto upload(@RequestParam("file") MultipartFile file) {
        UploadedFile f = storage.save(file, CurrentUser.get());
        return new FileDto(f.getId(), f.getOriginalName(), "/api/v1/files/" + f.getId(), f.getContentType(), f.getSizeBytes());
    }

    /** Images (course covers) are public; every other file needs a signed-in account. */
    @GetMapping("/files/{id}")
    public ResponseEntity<Resource> download(@PathVariable String id) {
        UploadedFile f = repo.findById(id).orElseThrow(() -> ApiException.notFound("File not found"));
        boolean image = f.getContentType().startsWith("image/");
        if (!image && CurrentUser.optional() == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Please sign in");
        Path p = storage.pathOf(f);
        if (!Files.isRegularFile(p)) throw ApiException.notFound("File not found");
        boolean inline = image || f.getContentType().equals("application/pdf");
        ContentDisposition cd = (inline ? ContentDisposition.inline() : ContentDisposition.attachment()).filename(f.getOriginalName(), StandardCharsets.UTF_8).build();
        ResponseEntity.BodyBuilder ok = ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(f.getContentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
            .header("X-Content-Type-Options", "nosniff");
        // A locked-down CSP stops scripts in anything the browser might render; the built-in PDF viewer needs none applied.
        if (!f.getContentType().equals("application/pdf")) ok.header("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:");
        return ok
            .cacheControl(image ? CacheControl.maxAge(Duration.ofDays(1)).cachePublic() : CacheControl.noStore())
            .body(new FileSystemResource(p));
    }
}

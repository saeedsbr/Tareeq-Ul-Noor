package com.ilmpath.files;

import com.ilmpath.common.ApiException;
import com.ilmpath.identity.User;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/** Stores administrator uploads on disk under random names. Only an allowlist of file types is accepted. */
@Service
public class FileStorageService {
    /** extension -> content type served back. SVG/HTML are deliberately absent (script risk). */
    static final Map<String, String> TYPES = Map.ofEntries(
        Map.entry("pdf", "application/pdf"), Map.entry("png", "image/png"), Map.entry("jpg", "image/jpeg"), Map.entry("jpeg", "image/jpeg"),
        Map.entry("webp", "image/webp"), Map.entry("gif", "image/gif"), Map.entry("txt", "text/plain; charset=utf-8"),
        Map.entry("doc", "application/msword"), Map.entry("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        Map.entry("ppt", "application/vnd.ms-powerpoint"), Map.entry("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
        Map.entry("xls", "application/vnd.ms-excel"), Map.entry("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        Map.entry("mp3", "audio/mpeg"), Map.entry("m4a", "audio/mp4"), Map.entry("mp4", "video/mp4"));

    private final Path root;
    private final UploadedFileRepository repo;

    public FileStorageService(@Value("${ilmpath.upload-dir}") String dir, UploadedFileRepository repo) throws IOException {
        this.root = Paths.get(dir).toAbsolutePath().normalize();
        Files.createDirectories(root);
        this.repo = repo;
    }

    public UploadedFile save(MultipartFile in, User admin) {
        if (in == null || in.isEmpty()) throw ApiException.bad("Please choose a file");
        String original = Paths.get(in.getOriginalFilename() == null ? "file" : in.getOriginalFilename()).getFileName().toString();
        String ext = original.contains(".") ? original.substring(original.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT) : "";
        String type = TYPES.get(ext);
        if (type == null) throw ApiException.bad("This file type is not allowed. Use PDF, images, Office documents, text, MP3, M4A or MP4.");
        try (InputStream is = in.getInputStream()) {
            byte[] head = is.readNBytes(12);
            if (!magicOk(ext, head)) throw ApiException.bad("The file content does not match its extension");
        } catch (IOException e) { throw ApiException.bad("Could not read the file"); }
        UploadedFile f = new UploadedFile();
        f.setOriginalName(original.length() > 255 ? original.substring(original.length() - 255) : original);
        f.setStoredName(UUID.randomUUID() + "." + ext);
        f.setContentType(type); f.setSizeBytes(in.getSize()); f.setUploadedBy(admin.getId());
        try { in.transferTo(root.resolve(f.getStoredName())); } catch (IOException e) { throw new IllegalStateException("Could not store upload", e); }
        return repo.save(f);
    }

    private static boolean magicOk(String ext, byte[] h) {
        return switch (ext) {
            case "pdf" -> h.length >= 4 && h[0] == '%' && h[1] == 'P' && h[2] == 'D' && h[3] == 'F';
            case "png" -> h.length >= 4 && (h[0] & 0xFF) == 0x89 && h[1] == 'P' && h[2] == 'N' && h[3] == 'G';
            case "jpg", "jpeg" -> h.length >= 3 && (h[0] & 0xFF) == 0xFF && (h[1] & 0xFF) == 0xD8;
            case "gif" -> h.length >= 3 && h[0] == 'G' && h[1] == 'I' && h[2] == 'F';
            case "webp" -> h.length >= 12 && h[0] == 'R' && h[1] == 'I' && h[2] == 'F' && h[3] == 'F' && h[8] == 'W' && h[9] == 'E' && h[10] == 'B' && h[11] == 'P';
            case "docx", "pptx", "xlsx" -> h.length >= 2 && h[0] == 'P' && h[1] == 'K';
            default -> true;
        };
    }

    public Path pathOf(UploadedFile f) { return root.resolve(f.getStoredName()).normalize(); }
}

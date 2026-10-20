package com.ilmpath.common;

import java.net.URI;

/** Only allowlisted providers are accepted; we store the URL and render a safe embed URL. */
public final class VideoUrls {
    private VideoUrls() {}

    public static String normalizeYoutube(String url) {
        if (url == null || url.isBlank()) return null;
        try {
            URI u = URI.create(url.trim());
            String host = u.getHost() == null ? "" : u.getHost().toLowerCase();
            String id = null;
            if (host.equals("youtu.be")) id = u.getPath().replaceFirst("^/", "");
            else if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
                String q = u.getQuery();
                if (u.getPath().startsWith("/embed/")) id = u.getPath().substring(7);
                else if (q != null) for (String p : q.split("&")) if (p.startsWith("v=")) id = p.substring(2);
            }
            if (id == null || !id.matches("[A-Za-z0-9_-]{6,20}")) throw ApiException.bad("Only YouTube video URLs are supported");
            return "https://www.youtube-nocookie.com/embed/" + id;
        } catch (IllegalArgumentException e) {
            throw ApiException.bad("Invalid video URL");
        }
    }
}

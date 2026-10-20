package com.ilmpath.common;

import java.text.Normalizer;
import java.util.Locale;

public final class Slugs {
    private Slugs() {}
    public static String of(String s) {
        String n = Normalizer.normalize(s, Normalizer.Form.NFKD).replaceAll("\\p{M}", "")
            .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        return n.isEmpty() ? "item" : n;
    }
}

package com.ilmpath.identity;

import com.ilmpath.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentUser {
    private CurrentUser() {}
    public static User get() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || !(a.getPrincipal() instanceof User u)) throw new ApiException(HttpStatus.UNAUTHORIZED, "Please sign in");
        return u;
    }
    /** Null when anonymous. */
    public static User optional() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        return a != null && a.getPrincipal() instanceof User u ? u : null;
    }
}

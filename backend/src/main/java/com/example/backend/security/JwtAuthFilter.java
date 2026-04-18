package com.example.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final JwtCookieUtil jwtCookieUtil;

    public JwtAuthFilter(
        JwtService jwtService,
        UserDetailsService userDetailsService,
        JwtCookieUtil jwtCookieUtil
    ) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.jwtCookieUtil = jwtCookieUtil;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String jwt = null;

        // Try to get JWT from Authorization header first
        final String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
        }

        // If not found in header, try to get from cookie
        if (jwt == null) {
            jwt = jwtCookieUtil.getJwtFromCookie(request);
        }

        if (jwt == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String username = jwtService.extractUsername(jwt);

        if (
            username != null &&
            SecurityContextHolder.getContext().getAuthentication() == null &&
            jwtService.isTokenValid(jwt)
        ) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
            );
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        filterChain.doFilter(request, response);
    }
}

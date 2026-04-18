package com.example.backend.config;

import com.example.backend.security.JwtAuthFilter;
import com.example.backend.security.OAuth2AuthenticationSuccessHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final PasswordEncoder passwordEncoder;

    public SecurityConfig(
        JwtAuthFilter jwtAuthFilter,
        UserDetailsService userDetailsService,
        OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler,
        PasswordEncoder passwordEncoder
    ) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
        this.oAuth2AuthenticationSuccessHandler = oAuth2AuthenticationSuccessHandler;
        this.passwordEncoder = passwordEncoder;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // CSRF protection using cookies
        CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokenRepository.setCookiePath("/");
        csrfTokenRepository.setCookieHttpOnly(false);
        csrfTokenRepository.setCookieSecure(true); // Set to false for dev, true for HTTPS in production
        csrfTokenRepository.setCookieSameSite("Strict");

        XorCsrfTokenRequestAttributeHandler csrfRequestHandler = new XorCsrfTokenRequestAttributeHandler();
        csrfRequestHandler.setCsrfRequestAttributeName("_csrf");

        http
            // CSRF protection enabled (disabled only for file uploads if needed)
            .csrf(csrf -> csrf
                .csrfTokenRepository(csrfTokenRepository)
                .csrfRequestHandler(csrfRequestHandler)
                .ignoringRequestMatchers("/api/incidents/uploads") // Multipart form data
            )
            // Security headers
            .headers(headers -> headers
                .frameOptions(frame -> frame.sameOrigin())
                .httpStrictTransportSecurity()
                    .includeSubDomains(true)
                    .preload(true)
                    .maxAgeInSeconds(31536000)
                .and()
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' http://localhost:8082 http://localhost:3000")
                )
                .xssProtection()
                .and()
                .contentTypeOptions()
            )
            // CORS with defaults
            .cors(Customizer.withDefaults())
            // Session management
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Authorization rules
            .authorizeHttpRequests(auth ->
                auth
                    .requestMatchers("/api/auth/**", "/oauth2/**", "/login/**").permitAll()
                    .requestMatchers("/uploads/**", "/h2-console/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/facilities/**").authenticated()
                    .requestMatchers("/api/admin/**").hasRole("ADMIN")
                    .requestMatchers("/api/incidents/technician/**").hasAnyRole("ADMIN", "TECHNICIAN")
                    .anyRequest()
                    .authenticated()
            )
            // OAuth2 login
            .oauth2Login(oauth -> oauth.successHandler(oAuth2AuthenticationSuccessHandler))
            // Authentication provider and filter
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}

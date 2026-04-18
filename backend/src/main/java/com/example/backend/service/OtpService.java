package com.example.backend.service;
import jakarta.mail.internet.MimeMessage;
import java.time.Instant;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;
@Service
public class OtpService {
    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private final JavaMailSender mailSender;
    @Value("${spring.mail.username}") private String fromEmail;
    @Value("${app.otp.expiry-minutes:5}") private int expiryMinutes;
    private record OtpEntry(String otp, Instant expiresAt) {}
    private final Map<String, OtpEntry> store = new ConcurrentHashMap<>();
    private final Random random = new Random();
    public OtpService(JavaMailSender mailSender) { this.mailSender = mailSender; }
    public void sendOtp(String email) {
        String otp = String.format("%04d", random.nextInt(10000));
        store.put(email.toLowerCase(), new OtpEntry(otp, Instant.now().plusSeconds(expiryMinutes * 60L)));
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromEmail); helper.setTo(email);
            helper.setSubject("CampusX - Your verification code");
            helper.setText("Hi,\n\nYour CampusX verification code is:\n\n  " + otp + "\n\nExpires in " + expiryMinutes + " minutes.\n\n- CampusX Team");
            mailSender.send(message);
            log.info("OTP sent to {}", email);
        } catch (Exception e) {
            log.error("Failed to send OTP: {}", e.getMessage(), e);
            store.remove(email.toLowerCase());
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Failed to send OTP: " + e.getMessage());
        }
    }
    public boolean verifyOtp(String email, String otp) {
        OtpEntry entry = store.get(email.toLowerCase());
        if (entry == null) throw new ResponseStatusException(BAD_REQUEST, "No OTP found. Please request a new one.");
        if (Instant.now().isAfter(entry.expiresAt())) { store.remove(email.toLowerCase()); throw new ResponseStatusException(BAD_REQUEST, "OTP expired."); }
        if (!entry.otp().equals(otp)) throw new ResponseStatusException(BAD_REQUEST, "Invalid OTP.");
        store.remove(email.toLowerCase());
        return true;
    }
}

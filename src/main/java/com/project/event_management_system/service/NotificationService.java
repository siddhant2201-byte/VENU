package com.project.event_management_system.service;

import com.project.event_management_system.dto.BookingConfirmedEvent;
import com.project.event_management_system.dto.SeatResponse;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final JavaMailSender mailSender;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy 'at' h:mm a");

    public void sendBookingConfirmationEmail(BookingConfirmedEvent event) {
        log.info("Preparing luxury HTML confirmation email for booking {} to {}",
                event.getBookingReference(), event.getUserEmail());

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("concierge@projectsmart.com", "ProjectSmart VIP Concierge");
            helper.setTo(event.getUserEmail());
            helper.setSubject(String.format("Confirmed: VIP Access Pass for %s [Ref: %s]",
                    event.getEventTitle(), event.getBookingReference()));

            String htmlBody = buildHtmlEmail(event);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("Email successfully dispatched for booking {} to Mailpit ({})",
                    event.getBookingReference(), event.getUserEmail());

        } catch (Exception e) {
            log.error("Failed to send booking confirmation email for booking {}",
                    event.getBookingReference(), e);
        }
    }

    private String buildHtmlEmail(BookingConfirmedEvent event) {
        StringBuilder seatsHtml = new StringBuilder();
        if (event.getSeats() != null) {
            for (SeatResponse seat : event.getSeats()) {
                seatsHtml.append(String.format(
                        "<tr>" +
                        "<td style='padding:12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#ffffff;font-weight:bold;'>Seat %s</td>" +
                        "<td style='padding:12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#958ea0;'>Row %s</td>" +
                        "<td style='padding:12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#d0bcff;'><span style='background:rgba(139,92,246,0.15);padding:3px 8px;border-radius:4px;font-size:11px;font-weight:bold;'>%s</span></td>" +
                        "<td style='padding:12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#FFD026;text-align:right;font-weight:bold;'>$%s</td>" +
                        "</tr>",
                        seat.getSeatNumber(),
                        seat.getRowLabel(),
                        seat.getSeatType(),
                        seat.getPrice() != null ? seat.getPrice().toString() : "0.00"
                ));
            }
        }

        String eventDateStr = event.getEventStartTime() != null
                ? event.getEventStartTime().format(DATE_FORMATTER)
                : "Date to be announced";

        return "<!DOCTYPE html>" +
                "<html><head><meta charset='utf-8'>" +
                "<style>" +
                "body { margin:0; padding:0; background-color:#0A0A0C; font-family:'Plus Jakarta Sans', Arial, sans-serif; color:#e5e1e4; }" +
                ".container { max-width:600px; margin:30px auto; background-color:#121118; border:1px solid rgba(255,255,255,0.12); border-radius:4px; overflow:hidden; }" +
                ".header { padding:36px; text-align:center; background:linear-gradient(135deg, rgba(139,92,246,0.2), rgba(255,51,102,0.15)); border-bottom:1px solid rgba(255,255,255,0.08); }" +
                ".badge { display:inline-block; font-family:'JetBrains Mono', monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.15em; padding:4px 10px; border-radius:4px; background:rgba(255,208,38,0.12); color:#FFD026; border:1px solid rgba(255,208,38,0.3); margin-bottom:12px; }" +
                ".title { font-family:'Playfair Display', Georgia, serif; font-size:26px; color:#ffffff; margin:0 0 8px 0; font-weight:500; }" +
                ".subtitle { font-size:12px; color:#958ea0; margin:0; }" +
                ".content { padding:32px; }" +
                ".ref-box { background:#0A0A0C; border:1px solid rgba(255,255,255,0.08); border-radius:4px; padding:16px; margin-bottom:24px; text-align:center; }" +
                ".ref-code { font-family:'JetBrains Mono', monospace; font-size:16px; font-weight:bold; color:#ffffff; letter-spacing:0.05em; }" +
                ".meta-grid { margin-bottom:24px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:16px; }" +
                ".meta-item { font-size:12px; color:#cbc3d7; margin:6px 0; }" +
                ".meta-label { color:#958ea0; font-family:'JetBrains Mono', monospace; text-transform:uppercase; font-size:10px; margin-right:8px; }" +
                "table { width:100%; border-collapse:collapse; font-size:12px; font-family:'JetBrains Mono', monospace; margin-bottom:24px; }" +
                ".total-row { padding:14px 12px; text-align:right; font-size:16px; font-weight:bold; color:#FFD026; font-family:'JetBrains Mono', monospace; }" +
                ".footer { padding:24px; text-align:center; background:#0A0A0C; border-top:1px solid rgba(255,255,255,0.06); font-size:11px; color:#958ea0; line-height:1.6; }" +
                "</style></head>" +
                "<body>" +
                "<div class='container'>" +
                "<div class='header'>" +
                "<div class='badge'>ProjectSmart VIP Concierge</div>" +
                "<h1 class='title'>VIP Admission Confirmed</h1>" +
                "<p class='subtitle'>Dear " + event.getUserFullName() + ", your reserved credentials have been verified.</p>" +
                "</div>" +
                "<div class='content'>" +
                "<div class='ref-box'>" +
                "<div style='font-size:10px;color:#958ea0;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;'>Cryptographic Booking Reference</div>" +
                "<div class='ref-code'>" + event.getBookingReference() + "</div>" +
                "</div>" +
                "<div class='meta-grid'>" +
                "<div class='meta-item'><span class='meta-label'>Event</span><strong style='color:#ffffff;'>" + event.getEventTitle() + "</strong></div>" +
                "<div class='meta-item'><span class='meta-label'>Schedule</span>" + eventDateStr + "</div>" +
                "<div class='meta-item'><span class='meta-label'>Venue</span>" + event.getVenueName() + " (" + event.getVenueCity() + ")</div>" +
                "</div>" +
                "<div style='font-family:\"JetBrains Mono\",monospace;font-size:10px;color:#958ea0;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:12px;'>Allocated Seats</div>" +
                "<table>" +
                seatsHtml.toString() +
                "</table>" +
                "<div class='total-row'>" +
                "<span style='color:#958ea0;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin-right:12px;'>Total Paid</span>" +
                "$" + (event.getTotalAmount() != null ? event.getTotalAmount().toString() : "0.00") +
                "</div>" +
                "</div>" +
                "<div class='footer'>" +
                "Please present this booking reference or your digital QR pass at the entrance gate.<br/>" +
                "© 2026 ProjectSmart Platform. All rights reserved." +
                "</div>" +
                "</div>" +
                "</body></html>";
    }
}

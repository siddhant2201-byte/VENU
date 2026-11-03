package com.project.event_management_system.controller;

import com.project.event_management_system.dto.ApiResponse;
import com.project.event_management_system.dto.OrganizerAnalyticsResponse;
import com.project.event_management_system.security.UserPrincipal;
import com.project.event_management_system.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OrganizerAnalyticsResponse>> getAnalytics(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        boolean isAdmin = userPrincipal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        OrganizerAnalyticsResponse analytics = analyticsService.getOrganizerAnalytics(userPrincipal.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success(analytics, "Analytics aggregated successfully"));
    }
}

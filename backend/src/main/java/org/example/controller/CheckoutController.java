package org.example.controller;

import org.example.dto.CheckoutRequestDTO;
import org.example.entity.Invoices;
import org.example.service.CheckoutService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.example.service.AuditService;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final AuditService auditService;

    public CheckoutController(CheckoutService checkoutService,
                              AuditService auditService) {
        this.checkoutService = checkoutService;
        this.auditService = auditService;
    }

    @PostMapping
    public ResponseEntity<?> checkout(@RequestBody CheckoutRequestDTO dto,
                                      Authentication authentication) {

        String username = (authentication != null) ? authentication.getName() : "system";

        try {
            // Log incoming request
            System.out.println("CheckoutRequestDTO received: " + dto);

            Invoices invoice = checkoutService.checkout(
                    dto.getPaymentAccountId(),
                    dto.getSubtotal(),
                    dto.getTax(),
                    dto.getTotal(),
                    dto.getPromoCode(),
                    dto.getBillingCycle(),
                    dto.getPaymentIntentId(),
                    dto.getInvoiceNumber(),
                    dto.getItems()
            );

            // Audit log for successful payment
            String target = "Invoice " + invoice.getInvoiceId()
                    + " Total $" + dto.getTotal();

            auditService.log("Payment", "Success", target, username);

            return ResponseEntity.ok(invoice);

        } catch (Exception e) {

            System.err.println("Checkout failed: " + e.getMessage());
            e.printStackTrace();

            String target = "Checkout Total $" + dto.getTotal();
            auditService.log("Payment", "Failed", target, username);

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Checkout failed", e.getMessage()));
        }
    }

    // Nested class for error response
    public static class ErrorResponse {
        private String error;
        private String details;

        public ErrorResponse(String error, String details) {
            this.error = error;
            this.details = details;
        }

        public String getError() { return error; }
        public String getDetails() { return details; }
    }
}

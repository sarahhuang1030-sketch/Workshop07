package org.example.controller;

import org.example.dto.CheckoutRequestDTO;
import org.example.entity.Invoices;
import org.example.service.CheckoutService;
import org.example.service.AuditService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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

    /**
     * =========================
     * VERSION 1: Checkout with Address Info
     * =========================
     */
    @PostMapping("/v1")
    public ResponseEntity<?> checkoutV1(@RequestBody CheckoutRequestDTO dto,
                                        Authentication authentication) {

        String username = (authentication != null) ? authentication.getName() : "system";

        try {
            System.out.println("CheckoutRequestDTO V1 received: " + dto);

            Invoices invoice = checkoutService.checkout(
                    dto.getPaymentAccountId(),
                    dto.getSubtotal(),
                    dto.getTax(),
                    dto.getTotal(),
                    dto.getPromoCode(),
                    dto.getBillingCycle(),
                    dto.getPaymentIntentId(),
                    dto.getInvoiceNumber(),

                    // ✅ FIX 1: missing quoteId (V1 has no quote)
                    null,

                    dto.getItems(),
                    dto.getStreet1(),
                    dto.getStreet2(),
                    dto.getCity(),
                    dto.getProvince(),
                    dto.getPostalCode(),
                    dto.getCountry()
            );

            String target = "Invoice " + invoice.getInvoiceId()
                    + " Total $" + dto.getTotal();

            auditService.log("Payment", "Success", target, username);

            return ResponseEntity.ok(invoice);

        } catch (Exception e) {

            System.err.println("Checkout V1 failed: " + e.getMessage());
            e.printStackTrace();

            String target = "Checkout Total $" + dto.getTotal();
            auditService.log("Payment", "Failed", target, username);

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Checkout failed", e.getMessage()));
        }
    }

    /**
     * =========================
     * VERSION 2: Checkout with QuoteId
     * =========================
     */
    @PostMapping("/v2")
    public ResponseEntity<?> checkoutV2(@RequestBody CheckoutRequestDTO dto,
                                        Authentication authentication) {

        String username = (authentication != null) ? authentication.getName() : "system";

        try {
            System.out.println("CheckoutRequestDTO V2 received: " + dto);

            Invoices invoice = checkoutService.checkout(
                    dto.getPaymentAccountId(),
                    dto.getSubtotal(),
                    dto.getTax(),
                    dto.getTotal(),
                    dto.getPromoCode(),
                    dto.getBillingCycle(),
                    dto.getPaymentIntentId(),
                    dto.getInvoiceNumber(),

                    // quoteId (V2 uses this)
                    dto.getQuoteId(),

                    dto.getItems(),

                    // ✅ FIX 2: V2 has NO address fields → pass nulls
                    null,
                    null,
                    null,
                    null,
                    null,
                    null
            );

            String target = "Invoice " + invoice.getInvoiceId()
                    + " Total $" + dto.getTotal();

            auditService.log("Payment", "Success", target, username);

            return ResponseEntity.ok(invoice);

        } catch (Exception e) {

            System.err.println("Checkout V2 failed: " + e.getMessage());
            e.printStackTrace();

            String target = "Checkout Total $" + dto.getTotal();
            auditService.log("Payment", "Failed", target, username);

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Checkout failed", e.getMessage()));
        }
    }

    /**
     * =========================
     * Shared Error Response
     * =========================
     */
    public static class ErrorResponse {
        private String error;
        private String details;

        public ErrorResponse(String error, String details) {
            this.error = error;
            this.details = details;
        }

        public String getError() {
            return error;
        }

        public String getDetails() {
            return details;
        }
    }
}
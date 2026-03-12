package org.example.controller;

import org.example.dto.CheckoutRequestDTO;
import org.example.entity.Invoices;
import org.example.entity.InvoiceItems;
import org.example.service.CheckoutService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.example.service.AuditService;
import org.springframework.security.core.Authentication;

import java.util.List;

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
    public ResponseEntity<Invoices> checkout(@RequestBody CheckoutRequestDTO dto,
                                             Authentication authentication) {
        String username = (authentication != null) ? authentication.getName() : "system";

        try {
            List<InvoiceItems> items = dto.getItems();
            Invoices invoices = checkoutService.checkout(
                    dto.getPaymentAccountId(),
                    dto.getSubtotal(),
                    dto.getTax(),
                    dto.getTotal(),
                    dto.getPromoCode(),
                    dto.getBillingCycle(),
                    items
            );
    //adding the log for manager to see
            String target = "Invoice " + invoices.getInvoiceId()
                    + " Total $" + dto.getTotal();

            auditService.log("Payment", "Success", target, username);

            return ResponseEntity.ok(invoices);
        } catch (Exception e) {
            String target = "Checkout Total $" + dto.getTotal();
            auditService.log("Payment", "Failed", target, username);
            return ResponseEntity.badRequest().body(null);
        }
    }
}
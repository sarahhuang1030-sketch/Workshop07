package org.example.controller;

import org.example.dto.CheckoutRequestDTO;
import org.example.entity.Invoices;
import org.example.entity.InvoiceItems;
import org.example.service.CheckoutService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final CheckoutService checkoutService;

    public CheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping
    public ResponseEntity<Invoices> checkout(@RequestBody CheckoutRequestDTO dto) {
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
            return ResponseEntity.ok(invoices);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
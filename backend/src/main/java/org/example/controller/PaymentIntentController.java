package org.example.controller;

import com.stripe.model.PaymentIntent;
import org.example.service.StripePaymentService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment-intent")
public class PaymentIntentController {

    private final StripePaymentService stripeService;

    public PaymentIntentController(StripePaymentService stripeService) {
        this.stripeService = stripeService;
    }

    @PostMapping
    public Map<String, String> createIntent(@RequestBody Map<String, Object> data,
                                            @RequestParam(required = false) String stripeCustomerId,
                                            @RequestParam(required = false) String paymentMethodId) throws Exception {

        Long amount = Long.valueOf(data.get("amount").toString());

        PaymentIntent intent;

        if (stripeCustomerId != null && paymentMethodId != null) {
            intent = stripeService.createPaymentIntentWithCustomer(amount, stripeCustomerId, paymentMethodId);
        } else {
            intent = stripeService.createPaymentIntent(amount);
        }

        return Map.of(
                "clientSecret", intent.getClientSecret(),
                "paymentIntentId", intent.getId()
        );
    }
}
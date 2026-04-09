package org.example.controller;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.PaymentMethod;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import com.stripe.model.Event;
import com.stripe.net.Webhook;

@RestController
@RequestMapping("/api")
public class PaymentIntentController {

    private final Logger logger = LoggerFactory.getLogger(PaymentIntentController.class);

        @PostMapping("/payment-intent")
        public ResponseEntity<?> createPaymentIntent(@RequestBody Map<String, Object> payload) {

            try {
                // ---------------------------
                // Validate input safely
                // ---------------------------
                if (payload == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Request body is missing"));
                }

                Object amountObj = payload.get("amount");
                Object pmObj = payload.get("paymentMethodId");

                if (amountObj == null || pmObj == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "amount and paymentMethodId are required"));
                }

                long amount;
                try {
                    amount = Long.parseLong(amountObj.toString());
                } catch (Exception e) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Invalid amount format"));
                }

                if (amount <= 0) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Amount must be greater than 0"));
                }

                String paymentMethodId = pmObj.toString();
                boolean saveCard = Boolean.TRUE.equals(payload.get("saveCard"));

                // ---------------------------
                // Retrieve PaymentMethod from Stripe
                // ---------------------------
                PaymentMethod pm = PaymentMethod.retrieve(paymentMethodId);

                // ---------------------------
                // Build PaymentIntent
                // ---------------------------
                PaymentIntentCreateParams.Builder builder =
                        PaymentIntentCreateParams.builder()
                                .setAmount(amount)
                                .setCurrency("cad")
                                .setPaymentMethod(paymentMethodId)
                                .setConfirm(false);

                // ---------------------------
                // Attach customer only if saving card
                // ---------------------------
                if (saveCard) {
                    String customerId = pm.getCustomer();

                    if (customerId == null || customerId.isEmpty()) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("error", "Cannot save card without Stripe customer"));
                    }

                    builder.setCustomer(customerId);
                }

                PaymentIntent intent = PaymentIntent.create(builder.build());

                return ResponseEntity.ok(Map.of(
                        "clientSecret", intent.getClientSecret()
                ));

            } catch (Exception e) {
                return ResponseEntity.status(500)
                        .body(Map.of("error", e.getMessage()));
            }
        }
}
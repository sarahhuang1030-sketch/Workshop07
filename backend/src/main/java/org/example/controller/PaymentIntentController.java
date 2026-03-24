package org.example.controller;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.PaymentMethod;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PaymentIntentController {

    private final Logger logger = LoggerFactory.getLogger(PaymentIntentController.class);

    @PostMapping("/payment-intent")
    public ResponseEntity<?> createPaymentIntent(
            @RequestParam(name = "paymentMethodId") String paymentMethodId,
            @RequestParam(name = "stripeCustomerId", required = false) String stripeCustomerId,
            @RequestBody Map<String, Object> payload,
            HttpServletRequest request
    ) {
        Map<String, Object> response = new HashMap<>();

        try {
            // ---------------------------
            // Validate required parameters
            // ---------------------------
            if (paymentMethodId == null || paymentMethodId.isEmpty()) {
                response.put("error", "PaymentMethodId is required");
                return ResponseEntity.badRequest().body(response);
            }

            Object amountObj = payload.get("amount");
            if (amountObj == null) {
                response.put("error", "Amount is required in request body");
                return ResponseEntity.badRequest().body(response);
            }

            long amount;
            try {
                amount = Long.parseLong(amountObj.toString());
            } catch (NumberFormatException e) {
                response.put("error", "Amount must be a number");
                return ResponseEntity.badRequest().body(response);
            }

            if (amount <= 0) {
                response.put("error", "Amount must be greater than zero");
                return ResponseEntity.badRequest().body(response);
            }

            // ----------------------------------------
            // Check if the payment method already has a customer
            // ----------------------------------------
            PaymentMethod paymentMethod = PaymentMethod.retrieve(paymentMethodId);
            String customerFromPaymentMethod = paymentMethod.getCustomer();

            if (customerFromPaymentMethod != null && !customerFromPaymentMethod.isEmpty()) {
                // Use the customer already associated with the payment method
                stripeCustomerId = customerFromPaymentMethod;
                logger.info("PaymentMethod {} is already associated with customer {}", paymentMethodId, stripeCustomerId);
            } else if (stripeCustomerId == null || stripeCustomerId.isEmpty()) {
                // If no customer associated, require front-end to pass stripeCustomerId
                response.put("error", "stripeCustomerId is required for a new payment method");
                return ResponseEntity.badRequest().body(response);
            }

            // ---------------------------
            // Create PaymentIntent
            // ---------------------------
            PaymentIntentCreateParams.Builder paramsBuilder = PaymentIntentCreateParams.builder()
                    .setAmount(amount)
                    .setCurrency("cad")
                    .setPaymentMethod(paymentMethodId)
                    .setConfirm(false) // front-end confirms the payment
                    .setDescription("Order payment from frontend");

            if (stripeCustomerId != null && !stripeCustomerId.isEmpty()) {
                paramsBuilder.setCustomer(stripeCustomerId);
            }

            PaymentIntent paymentIntent = PaymentIntent.create(paramsBuilder.build());

            logger.info("PaymentIntent created successfully: {}", paymentIntent.getId());
            response.put("clientSecret", paymentIntent.getClientSecret());

            return ResponseEntity.ok(response);

        } catch (StripeException e) {
            logger.error("StripeException when creating PaymentIntent", e);
            response.put("error", e.getMessage());
            return ResponseEntity.status(400).body(response);

        } catch (Exception e) {
            logger.error("Unexpected error when creating PaymentIntent", e);
            response.put("error", "Server error while creating PaymentIntent. See logs for details.");
            return ResponseEntity.status(500).body(response);
        }
    }
}
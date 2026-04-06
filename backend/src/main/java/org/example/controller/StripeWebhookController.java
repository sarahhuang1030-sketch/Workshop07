//package org.example.controller;
//
//import com.stripe.model.*;
//import com.stripe.net.Webhook;
//import org.example.repository.InvoiceRepositoryCustom;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//@RestController
//@RequestMapping("/api/webhook")
//public class StripeWebhookController {
//
//    private final String endpointSecret;
//    private final InvoiceRepositoryCustom invoiceRepository;
//
//    public StripeWebhookController(
//            @Value("${stripe.webhook.secret}") String endpointSecret,
//            InvoiceRepositoryCustom invoiceRepository
//    ) {
//        this.endpointSecret = endpointSecret;
//        this.invoiceRepository = invoiceRepository;
//    }
//
//    /**
//     * Stripe webhook (source of truth)
//     */
//    @PostMapping("/stripe")
//    public ResponseEntity<String> handleWebhook(
//            @RequestBody String payload,
//            @RequestHeader("Stripe-Signature") String sigHeader
//    ) {
//
//        try {
//            // ✅ Correct Stripe Event import
//            Event event = Webhook.constructEvent(
//                    payload,
//                    sigHeader,
//                    endpointSecret
//            );
//
//            if ("payment_intent.succeeded".equals(event.getType())) {
//
//                // ✅ Stripe v26 safe deserialization
//                PaymentIntent intent = (PaymentIntent) event
//                        .getDataObjectDeserializer()
//                        .getObject()
//                        .orElseThrow();
//
//                String paymentIntentId = intent.getId();
//
//                String last4 = null;
//                String brand = null;
//
//                // =====================================================
//                // FIX: NO getCharges() in newer Stripe Java SDK
//                // Use PaymentMethodDetails instead (BEST PRACTICE)
//                // =====================================================
//                if (intent.getPaymentMethodTypes() != null) {
//
//                    PaymentMethod paymentMethod =
//                            PaymentMethod.retrieve(intent.getPaymentMethod());
//
//                    if (paymentMethod.getCard() != null) {
//                        last4 = paymentMethod.getCard().getLast4();
//                        brand = paymentMethod.getCard().getBrand();
//                    }
//                }
//
//                // fallback safety (optional)
//                if (last4 == null) {
//                    last4 = "****";
//                }
//
//                invoiceRepository.markPaidByStripe(
//                        paymentIntentId,
//                        last4,
//                        brand
//                );
//            }
//
//            return ResponseEntity.ok("ok");
//
//        } catch (Exception e) {
//            return ResponseEntity.badRequest()
//                    .body("Webhook error: " + e.getMessage());
//        }
//    }
//}
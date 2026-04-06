//package org.example.repository;
//
//import org.springframework.jdbc.core.JdbcTemplate;
//import org.springframework.stereotype.Repository;
//
//@Repository
//public class InvoiceRepositoryImpl implements InvoiceRepositoryCustom {
//
//    private final JdbcTemplate jdbcTemplate;
//
//    public InvoiceRepositoryImpl(JdbcTemplate jdbcTemplate) {
//        this.jdbcTemplate = jdbcTemplate;
//    }
//
//    /**
//     * Update invoice payment status after Stripe success
//     */
//    @Override
//    public void markPaidByStripe(
//            String paymentIntentId,
//            String last4,
//            String brand
//    ) {
//
//        String sql = """
//            UPDATE invoices
//            SET Status = 'PAID',
//                CardLast4 = ?,
//                CardBrand = ?
//            WHERE StripePaymentIntentId = ?
//        """;
//
//        jdbcTemplate.update(sql,
//                last4,
//                brand,
//                paymentIntentId
//        );
//    }
//}
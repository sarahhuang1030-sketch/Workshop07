package org.example.service;

import org.example.dto.ItemDTO;
import org.example.dto.QuoteRequestDTO;
import org.example.dto.QuoteUpdateDTO;
import org.example.entity.Quote;
import org.example.entity.QuoteAddOn;
import org.example.model.AddOn;
import org.example.model.Plan;
import org.example.repository.AddOnRepository;
import org.example.repository.PlanRepository;
import org.example.repository.QuoteRepository;
import org.springframework.stereotype.Service;
import org.example.model.Customer;
import org.example.repository.CustomerRepository;

import java.util.ArrayList;
import java.util.List;

@Service
public class QuoteService {

    private final QuoteRepository repo;
    private final PlanRepository planRepo;
    private final AddOnRepository addOnRepo;
    private final CustomerRepository customerRepo;
    private final EmailService emailService;

    public QuoteService(QuoteRepository repo,
                        PlanRepository planRepo,
                        AddOnRepository addOnRepo,
                        CustomerRepository customerRepo,
                        EmailService emailService) {
        this.repo = repo;
        this.planRepo = planRepo;
        this.addOnRepo = addOnRepo;
        this.customerRepo=customerRepo;
        this.emailService = emailService;
    }

    // CREATE QUOTE
    public Quote createQuote(QuoteRequestDTO dto) {

        Quote q = new Quote();
        q.setCustomerId(dto.getCustomerId());
        q.setStatus("PENDING");

        List<QuoteAddOn> addons = new ArrayList<>();

        double subtotal = 0;

        if (dto.getItems() != null && !dto.getItems().isEmpty()) {

            for (ItemDTO item : dto.getItems()) {

                if ("plan".equalsIgnoreCase(item.getType())) {
                    q.setPlanId(item.getId());
                    subtotal += item.getPrice();
                }

                if ("addon".equalsIgnoreCase(item.getType())) {

                    QuoteAddOn qa = new QuoteAddOn();
                    qa.setQuote(q);
                    qa.setAddonId(item.getId());

                    addons.add(qa);
                    subtotal += item.getPrice();
                }
            }

        } else {

            q.setPlanId(dto.getPlanId());

            subtotal = calculate(dto.getPlanId(), dto.getAddonIds());

            if (dto.getAddonIds() != null) {
                for (Integer id : dto.getAddonIds()) {

                    QuoteAddOn qa = new QuoteAddOn();
                    qa.setQuote(q);
                    qa.setAddonId(id);

                    addons.add(qa);
                }
            }
        }

        q.setAmount(subtotal);
        q.setAddons(addons);

        Quote saved = repo.save(q);

        try {
            Customer customer = customerRepo.findById(saved.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found"));

            emailService.sendQuoteNotification(customer);
            System.out.println("=== QUOTE EMAIL SENT ===");

        } catch (Exception e) {
            System.out.println("=== QUOTE EMAIL FAILED ===");
            e.printStackTrace();
        }

        return saved;
    }

    // UPDATE QUOTE
    public Quote updateQuote(Integer id, QuoteUpdateDTO dto) {

        Quote q = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found"));

        if (!"PENDING".equalsIgnoreCase(q.getStatus()) &&
                !"DECLINED".equalsIgnoreCase(q.getStatus())) {
            throw new IllegalStateException("Only PENDING or DECLINED quotes can be edited");
        }

        q.setCustomerId(dto.getCustomerId());
        q.setPlanId(dto.getPlanId());

        if (q.getAddons() != null) {
            q.getAddons().clear();
        }

        List<Integer> addonIds = dto.getAddonIds();

        if (addonIds != null) {
            for (Integer addonId : addonIds) {
                QuoteAddOn qa = new QuoteAddOn();
                qa.setQuote(q);
                qa.setAddonId(addonId);
                q.getAddons().add(qa);
            }
        }

        double subtotal = calculate(dto.getPlanId(), addonIds);
        q.setAmount(subtotal);

        return repo.save(q);
    }

    // PRICE ENGINE
    private Double calculate(Integer planId, List<Integer> addonIds) {

        var planRow = planRepo.findPlanById(planId);

        if (planRow == null) {
            throw new RuntimeException("Plan not found");
        }

        double total = planRow.monthlyPrice();

        if (addonIds != null) {
            for (Integer id : addonIds) {

                var addon = addOnRepo.findById(id);

                if (addon != null) {
                    total += addon.monthlyPrice();
                }
            }
        }

        return total;
    }
}
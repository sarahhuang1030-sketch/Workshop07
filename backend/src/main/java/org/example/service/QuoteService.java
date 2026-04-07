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

import java.util.ArrayList;
import java.util.List;

@Service
public class QuoteService {

    private final QuoteRepository repo;
    private final PlanRepository planRepo;
    private final AddOnRepository addOnRepo;

    public QuoteService(QuoteRepository repo,
                        PlanRepository planRepo,
                        AddOnRepository addOnRepo) {
        this.repo = repo;
        this.planRepo = planRepo;
        this.addOnRepo = addOnRepo;
    }

    // =========================
    // CREATE QUOTE
    // =========================
    public Quote createQuote(QuoteRequestDTO dto) {

        Quote q = new Quote();
        q.setCustomerId(dto.getCustomerId());
        q.setStatus("PENDING");

        List<QuoteAddOn> addons = new ArrayList<>();

        double total = 0;

        if (dto.getItems() != null && !dto.getItems().isEmpty()) {

            for (ItemDTO item : dto.getItems()) {

                if ("plan".equalsIgnoreCase(item.getType())) {
                    q.setPlanId(item.getId());
                    total += item.getPrice();
                }

                if ("addon".equalsIgnoreCase(item.getType())) {

                    QuoteAddOn qa = new QuoteAddOn();
                    qa.setQuote(q);
                    qa.setAddonId(item.getId());

                    addons.add(qa);
                    total += item.getPrice();
                }
            }

        } else {

            q.setPlanId(dto.getPlanId());

            total = calculate(dto.getPlanId(), dto.getAddonIds());

            if (dto.getAddonIds() != null) {
                for (Integer id : dto.getAddonIds()) {

                    QuoteAddOn qa = new QuoteAddOn();
                    qa.setQuote(q);
                    qa.setAddonId(id);

                    addons.add(qa);
                }
            }
        }

        q.setAmount(total);
        q.setAddons(addons);

        return repo.save(q);
    }

    // =========================
    // UPDATE QUOTE
    // =========================
    public Quote updateQuote(Integer id, QuoteUpdateDTO dto) {

        Quote q = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found"));

        if (!"PENDING".equalsIgnoreCase(q.getStatus())) {
            throw new IllegalStateException("Only PENDING quotes can be edited");
        }

        q.setCustomerId(dto.getCustomerId());
        q.setPlanId(dto.getPlanId());

        if (q.getAddons() != null) {
            q.getAddons().clear();
        }

        if (dto.getAddonIds() != null) {
            for (Integer addonId : dto.getAddonIds()) {
                QuoteAddOn qa = new QuoteAddOn();
                qa.setQuote(q);
                qa.setAddonId(addonId);
                q.getAddons().add(qa);
            }
        }

        q.setAmount(calculate(dto.getPlanId(), dto.getAddonIds()));

        return repo.save(q);
    }

    // =========================
    // PRICE ENGINE (FIXED)
    // =========================
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
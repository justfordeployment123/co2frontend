-- ========================================================================
-- CSRD TRANSLATIONS (EN & DE)
-- ========================================================================
-- 
-- Translation keys for CSRD (Corporate Sustainability Reporting Directive)
-- and ESRS E1 (Climate) reporting standard
--
-- Run this after schema_complete.sql to add CSRD-specific translations
-- ========================================================================

-- CSRD General Terms
INSERT INTO translations (language_code, translation_key, translation_value, context) VALUES
    -- English
    ('EN', 'csrd_full_name', 'Corporate Sustainability Reporting Directive', 'CSRD_STANDARD'),
    ('EN', 'csrd_abbreviation', 'CSRD', 'CSRD_STANDARD'),
    ('EN', 'esrs_full_name', 'European Sustainability Reporting Standards', 'CSRD_STANDARD'),
    ('EN', 'esrs_e1_full_name', 'ESRS E1 - Climate Change', 'CSRD_STANDARD'),
    ('EN', 'csrd_description', 'EU mandatory sustainability reporting framework requiring disclosure of environmental, social, and governance impacts', 'CSRD_HELP'),
    ('EN', 'esrs_e1_description', 'Climate-related disclosure requirements including GHG emissions, energy consumption, and transition plans', 'CSRD_HELP'),
    
    -- German
    ('DE', 'csrd_full_name', 'Richtlinie über die Nachhaltigkeitsberichterstattung von Unternehmen', 'CSRD_STANDARD'),
    ('DE', 'csrd_abbreviation', 'CSRD', 'CSRD_STANDARD'),
    ('DE', 'esrs_full_name', 'Europäische Standards für die Nachhaltigkeitsberichterstattung', 'CSRD_STANDARD'),
    ('DE', 'esrs_e1_full_name', 'ESRS E1 - Klimawandel', 'CSRD_STANDARD'),
    ('DE', 'csrd_description', 'Verbindlicher EU-Rahmen für Nachhaltigkeitsberichterstattung mit Offenlegung von Umwelt-, Sozial- und Governance-Auswirkungen', 'CSRD_HELP'),
    ('DE', 'esrs_e1_description', 'Klimabezogene Offenlegungsanforderungen einschließlich THG-Emissionen, Energieverbrauch und Übergangspläne', 'CSRD_HELP')
ON CONFLICT (language_code, translation_key, context) DO NOTHING;

-- ESRS E1 Disclosure Requirements
INSERT INTO translations (language_code, translation_key, translation_value, context) VALUES
    -- English
    ('EN', 'esrs_e1_1_title', 'E1-1: Transition Plan for Climate Change Mitigation', 'CSRD_DISCLOSURE'),
    ('EN', 'esrs_e1_1_description', 'Describe your plan to ensure business model and strategy are compatible with limiting global warming to 1.5°C', 'CSRD_HELP'),
    ('EN', 'esrs_e1_2_title', 'E1-2: Policies Related to Climate Change', 'CSRD_DISCLOSURE'),
    ('EN', 'esrs_e1_2_description', 'Describe policies to manage material climate impacts, dependencies, risks and opportunities', 'CSRD_HELP'),
    ('EN', 'esrs_e1_3_title', 'E1-3: Actions and Resources for Climate Change', 'CSRD_DISCLOSURE'),
    ('EN', 'esrs_e1_3_description', 'Describe climate action plans and resources allocated to climate change mitigation', 'CSRD_HELP'),
    ('EN', 'esrs_e1_4_title', 'E1-4: Targets for Climate Change Mitigation', 'CSRD_DISCLOSURE'),
    ('EN', 'esrs_e1_4_description', 'Describe GHG emission reduction targets and alignment with Paris Agreement goals', 'CSRD_HELP'),
    ('EN', 'esrs_e1_5_title', 'E1-5: Energy Consumption and Mix', 'CSRD_DISCLOSURE'),
    ('EN', 'esrs_e1_5_description', 'Disclose total energy consumption from renewable and non-renewable sources', 'CSRD_HELP'),
    ('EN', 'esrs_e1_6_title', 'E1-6: Gross Scopes 1, 2, 3 and Total GHG Emissions', 'CSRD_DISCLOSURE'),
    ('EN', 'esrs_e1_6_description', 'Report absolute GHG emissions by scope and intensity metrics per revenue/employee', 'CSRD_HELP'),
    ('EN', 'esrs_e1_7_title', 'E1-7: GHG Removals and Mitigation Projects', 'CSRD_DISCLOSURE'),
    ('EN', 'esrs_e1_7_description', 'Disclose carbon removal activities, carbon credits purchased, and quality criteria', 'CSRD_HELP'),
    ('EN', 'esrs_e1_8_title', 'E1-8: Internal Carbon Pricing', 'CSRD_DISCLOSURE'),
    ('EN', 'esrs_e1_8_description', 'Explain if and how internal carbon pricing is used in decision-making', 'CSRD_HELP'),
    ('EN', 'esrs_e1_9_title', 'E1-9: Anticipated Financial Effects from Climate Risks', 'CSRD_DISCLOSURE'),
    ('EN', 'esrs_e1_9_description', 'Disclose financial impacts from material climate-related risks and opportunities', 'CSRD_HELP'),
    
    -- German
    ('DE', 'esrs_e1_1_title', 'E1-1: Übergangsplan zur Eindämmung des Klimawandels', 'CSRD_DISCLOSURE'),
    ('DE', 'esrs_e1_1_description', 'Beschreiben Sie Ihren Plan, um sicherzustellen, dass Geschäftsmodell und Strategie mit der Begrenzung der globalen Erwärmung auf 1,5°C vereinbar sind', 'CSRD_HELP'),
    ('DE', 'esrs_e1_2_title', 'E1-2: Richtlinien zum Klimawandel', 'CSRD_DISCLOSURE'),
    ('DE', 'esrs_e1_2_description', 'Beschreiben Sie Richtlinien zur Bewältigung wesentlicher Klimaauswirkungen, Abhängigkeiten, Risiken und Chancen', 'CSRD_HELP'),
    ('DE', 'esrs_e1_3_title', 'E1-3: Maßnahmen und Ressourcen für den Klimawandel', 'CSRD_DISCLOSURE'),
    ('DE', 'esrs_e1_3_description', 'Beschreiben Sie Klimaschutzpläne und zugewiesene Ressourcen zur Eindämmung des Klimawandels', 'CSRD_HELP'),
    ('DE', 'esrs_e1_4_title', 'E1-4: Ziele zur Eindämmung des Klimawandels', 'CSRD_DISCLOSURE'),
    ('DE', 'esrs_e1_4_description', 'Beschreiben Sie THG-Reduktionsziele und Ausrichtung auf die Ziele des Pariser Abkommens', 'CSRD_HELP'),
    ('DE', 'esrs_e1_5_title', 'E1-5: Energieverbrauch und Energiemix', 'CSRD_DISCLOSURE'),
    ('DE', 'esrs_e1_5_description', 'Offenlegen des Gesamtenergieverbrauchs aus erneuerbaren und nicht erneuerbaren Quellen', 'CSRD_HELP'),
    ('DE', 'esrs_e1_6_title', 'E1-6: Brutto-Scope 1, 2, 3 und Gesamt-THG-Emissionen', 'CSRD_DISCLOSURE'),
    ('DE', 'esrs_e1_6_description', 'Absolute THG-Emissionen nach Scope und Intensitätskennzahlen pro Umsatz/Mitarbeiter berichten', 'CSRD_HELP'),
    ('DE', 'esrs_e1_7_title', 'E1-7: THG-Entfernungen und Minderungsprojekte', 'CSRD_DISCLOSURE'),
    ('DE', 'esrs_e1_7_description', 'CO2-Entfernungsaktivitäten, erworbene CO2-Zertifikate und Qualitätskriterien offenlegen', 'CSRD_HELP'),
    ('DE', 'esrs_e1_8_title', 'E1-8: Interner CO2-Preis', 'CSRD_DISCLOSURE'),
    ('DE', 'esrs_e1_8_description', 'Erklären Sie, ob und wie interne CO2-Preise in Entscheidungen verwendet werden', 'CSRD_HELP'),
    ('DE', 'esrs_e1_9_title', 'E1-9: Erwartete finanzielle Auswirkungen von Klimarisiken', 'CSRD_DISCLOSURE'),
    ('DE', 'esrs_e1_9_description', 'Finanzielle Auswirkungen wesentlicher klimabezogener Risiken und Chancen offenlegen', 'CSRD_HELP')
ON CONFLICT (language_code, translation_key, context) DO NOTHING;

-- CSRD Metrics and Terms
INSERT INTO translations (language_code, translation_key, translation_value, context) VALUES
    -- English
    ('EN', 'scope_2_location_based', 'Scope 2 (Location-based)', 'CSRD_METRIC'),
    ('EN', 'scope_2_market_based', 'Scope 2 (Market-based)', 'CSRD_METRIC'),
    ('EN', 'biogenic_co2_separate', 'Biogenic CO2 (separate disclosure)', 'CSRD_METRIC'),
    ('EN', 'ghg_intensity_revenue', 'GHG Intensity per Revenue', 'CSRD_METRIC'),
    ('EN', 'ghg_intensity_employee', 'GHG Intensity per Employee', 'CSRD_METRIC'),
    ('EN', 'location_based_help', 'Uses average emission intensity of grid where energy consumption occurs', 'CSRD_HELP'),
    ('EN', 'market_based_help', 'Reflects emissions from electricity supplier-specific contracts (e.g., green tariffs)', 'CSRD_HELP'),
    ('EN', 'double_materiality', 'Double Materiality Assessment', 'CSRD_TERM'),
    ('EN', 'double_materiality_help', 'Assessment of both impact materiality (company effects on environment/society) and financial materiality (sustainability effects on company)', 'CSRD_HELP'),
    ('EN', 'limited_assurance', 'Limited Assurance', 'CSRD_TERM'),
    ('EN', 'limited_assurance_help', 'Third-party verification providing moderate level of confidence in sustainability disclosures', 'CSRD_HELP'),
    ('EN', 'reasonable_assurance', 'Reasonable Assurance', 'CSRD_TERM'),
    ('EN', 'reasonable_assurance_help', 'Higher level of third-party verification (similar to financial audit) required in later phases', 'CSRD_HELP'),
    
    -- German
    ('DE', 'scope_2_location_based', 'Scope 2 (Standortbasiert)', 'CSRD_METRIC'),
    ('DE', 'scope_2_market_based', 'Scope 2 (Marktbasiert)', 'CSRD_METRIC'),
    ('DE', 'biogenic_co2_separate', 'Biogenes CO2 (separate Offenlegung)', 'CSRD_METRIC'),
    ('DE', 'ghg_intensity_revenue', 'THG-Intensität pro Umsatz', 'CSRD_METRIC'),
    ('DE', 'ghg_intensity_employee', 'THG-Intensität pro Mitarbeiter', 'CSRD_METRIC'),
    ('DE', 'location_based_help', 'Verwendet durchschnittliche Emissionsintensität des Netzes am Ort des Energieverbrauchs', 'CSRD_HELP'),
    ('DE', 'market_based_help', 'Spiegelt Emissionen aus lieferantenspezifischen Verträgen wider (z.B. Ökostromtarife)', 'CSRD_HELP'),
    ('DE', 'double_materiality', 'Doppelte Wesentlichkeitsbewertung', 'CSRD_TERM'),
    ('DE', 'double_materiality_help', 'Bewertung sowohl der Auswirkungswesentlichkeit (Unternehmensauswirkungen auf Umwelt/Gesellschaft) als auch der finanziellen Wesentlichkeit (Nachhaltigkeitsauswirkungen auf Unternehmen)', 'CSRD_HELP'),
    ('DE', 'limited_assurance', 'Begrenzte Prüfungssicherheit', 'CSRD_TERM'),
    ('DE', 'limited_assurance_help', 'Externe Prüfung mit moderatem Vertrauensniveau in Nachhaltigkeitsoffenlegungen', 'CSRD_HELP'),
    ('DE', 'reasonable_assurance', 'Hinreichende Prüfungssicherheit', 'CSRD_TERM'),
    ('DE', 'reasonable_assurance_help', 'Höheres Niveau externer Prüfung (ähnlich Finanzprüfung), erforderlich in späteren Phasen', 'CSRD_HELP')
ON CONFLICT (language_code, translation_key, context) DO NOTHING;

-- CSRD Applicability and Timeline
INSERT INTO translations (language_code, translation_key, translation_value, context) VALUES
    -- English
    ('EN', 'csrd_applicability_title', 'Who Must Comply with CSRD?', 'CSRD_INFO'),
    ('EN', 'csrd_large_companies', 'Large EU companies (>250 employees or >€50M revenue)', 'CSRD_INFO'),
    ('EN', 'csrd_listed_smes', 'Listed small and medium enterprises (simplified requirements)', 'CSRD_INFO'),
    ('EN', 'csrd_non_eu', 'Non-EU companies with significant EU operations (>€150M EU revenue)', 'CSRD_INFO'),
    ('EN', 'csrd_timeline_2024', '2024: Companies already subject to NFRD', 'CSRD_TIMELINE'),
    ('EN', 'csrd_timeline_2025', '2025: All large companies and listed SMEs', 'CSRD_TIMELINE'),
    ('EN', 'csrd_timeline_2026', '2026: Listed SMEs (opt-out until 2028 possible)', 'CSRD_TIMELINE'),
    ('EN', 'csrd_timeline_2028', '2028: Non-EU companies with EU operations', 'CSRD_TIMELINE'),
    
    -- German
    ('DE', 'csrd_applicability_title', 'Wer muss CSRD einhalten?', 'CSRD_INFO'),
    ('DE', 'csrd_large_companies', 'Große EU-Unternehmen (>250 Mitarbeiter oder >50 Mio. € Umsatz)', 'CSRD_INFO'),
    ('DE', 'csrd_listed_smes', 'Börsennotierte kleine und mittlere Unternehmen (vereinfachte Anforderungen)', 'CSRD_INFO'),
    ('DE', 'csrd_non_eu', 'Nicht-EU-Unternehmen mit bedeutenden EU-Aktivitäten (>150 Mio. € EU-Umsatz)', 'CSRD_INFO'),
    ('DE', 'csrd_timeline_2024', '2024: Unternehmen, die bereits der NFRD unterliegen', 'CSRD_TIMELINE'),
    ('DE', 'csrd_timeline_2025', '2025: Alle großen Unternehmen und börsennotierte KMU', 'CSRD_TIMELINE'),
    ('DE', 'csrd_timeline_2026', '2026: Börsennotierte KMU (Opt-out bis 2028 möglich)', 'CSRD_TIMELINE'),
    ('DE', 'csrd_timeline_2028', '2028: Nicht-EU-Unternehmen mit EU-Aktivitäten', 'CSRD_TIMELINE')
ON CONFLICT (language_code, translation_key, context) DO NOTHING;

-- CSRD UI Labels
INSERT INTO translations (language_code, translation_key, translation_value, context) VALUES
    -- English
    ('EN', 'reporting_standard_label', 'Reporting Standard', 'FORM_LABEL'),
    ('EN', 'reporting_standard_ghg', 'GHG Protocol', 'FORM_OPTION'),
    ('EN', 'reporting_standard_csrd', 'CSRD (ESRS E1)', 'FORM_OPTION'),
    ('EN', 'reporting_standard_iso', 'ISO 14064', 'FORM_OPTION'),
    ('EN', 'csrd_disclosure_report', 'CSRD Disclosure Report', 'REPORT_TYPE'),
    ('EN', 'view_csrd_requirements', 'View CSRD Requirements', 'BUTTON_TEXT'),
    ('EN', 'validate_csrd_compliance', 'Validate CSRD Compliance', 'BUTTON_TEXT'),
    ('EN', 'export_csrd_report', 'Export CSRD Report', 'BUTTON_TEXT'),
    
    -- German
    ('DE', 'reporting_standard_label', 'Berichtsstandard', 'FORM_LABEL'),
    ('DE', 'reporting_standard_ghg', 'GHG-Protokoll', 'FORM_OPTION'),
    ('DE', 'reporting_standard_csrd', 'CSRD (ESRS E1)', 'FORM_OPTION'),
    ('DE', 'reporting_standard_iso', 'ISO 14064', 'FORM_OPTION'),
    ('DE', 'csrd_disclosure_report', 'CSRD-Offenlegungsbericht', 'REPORT_TYPE'),
    ('DE', 'view_csrd_requirements', 'CSRD-Anforderungen anzeigen', 'BUTTON_TEXT'),
    ('DE', 'validate_csrd_compliance', 'CSRD-Konformität validieren', 'BUTTON_TEXT'),
    ('DE', 'export_csrd_report', 'CSRD-Bericht exportieren', 'BUTTON_TEXT')
ON CONFLICT (language_code, translation_key, context) DO NOTHING;

-- ========================================================================
-- CSRD TRANSLATIONS COMPLETE
-- ========================================================================
-- Total translations added: ~80 keys (40 EN + 40 DE)
-- Categories: Standards, Disclosures, Metrics, Terms, Info, Timeline, UI
-- ========================================================================

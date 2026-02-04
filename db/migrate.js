#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Migration files in order
const MIGRATIONS = [
  '01_create_core_schema.sql',
  '02_a_create_emission_factor_tables.sql',
  '02_b_create_scope3_factor_tables.sql',
  '02_c_add_missing_solid_factors.sql',
  '02_d_update_factors_parity.sql',
  '02_e_fix_biomass_flags.sql',
  '02_f_add_landfill_fix_propane.sql',
  '02_g_add_all_stationary_fuels.sql',
  '03_load_epa_2024_factors.sql',
  '04_load_csrd_translations.sql',
  '05_seed_emission_factor_values.sql',
  '06_add_calculation_results_columns.sql',
  '07_a_create_reference_boundary_questions.sql',
  '07_b_create_onboarding_schema.sql',
  '09_fix_approval_schema.sql',
  '10_create_company_boundary_answers.sql',
  '11_create_report_generation_history.sql',
  '12_create_payments.sql',
  '13_add_reporting_period_id_to_payments.sql',
  '14_create_reviews.sql',
  '15_update_scope2_columns.sql',
  '16_seed_scope2_emission_factors.sql',
  '17_add_missing_steam_fuels.sql',
  '18_sync_application_schema.sql',
  '19_complete_schema_sync.sql',
  '20_make_amounts_nullable.sql',
  '21_add_source_columns_to_ref_fire.sql',
  '22_add_missing_frontend_columns.sql',
  '23_allow_negative_emissions.sql',
  '24_fix_waste_units.sql',
  '25_default_calc_method.sql',
];

async function migrate() {
  // Get database URL from command line or environment
  const dbUrl = process.argv[2] || process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ Error: Database URL is required');
    console.error('Usage: node migrate.js "postgres://user:password@host:port/database"');
    console.error('Or set DATABASE_URL environment variable');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl });
  const client = await pool.connect();

  try {
    console.log('🚀 Starting database migrations...\n');

    for (let i = 0; i < MIGRATIONS.length; i++) {
      const file = MIGRATIONS[i];
      const filePath = path.join(__dirname, file);
      
      try {
        const sql = fs.readFileSync(filePath, 'utf8');
        console.log(`[${i + 1}/${MIGRATIONS.length}] Running: ${file}`);
        
        await client.query(sql);
        console.log(`✅ Completed: ${file}\n`);
      } catch (error) {
        console.error(`❌ Failed on: ${file}`);
        console.error(`Error: ${error.message}\n`);
        throw error;
      }
    }

    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

migrate().catch(console.error);

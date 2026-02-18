#!/usr/bin/env python3
"""
Check Remaining Verified Leads

This script:
1. Reads the updated Customer.io export CSV (newly processed)
2. Reads the current "Remaining Verified Leads" CSV
3. Compares them to determine how many verified emails still need processing
"""

import csv

# File paths
REMAINING_LEADS_CSV = "/Users/joseph/Downloads/Heeb's List - Remaining Verified Leads.csv"
UPDATED_CIO_EXPORT_CSV = "/Users/joseph/Downloads/customers-2026-01-14_20-47.csv"
UPDATED_REMAINING_CSV = "/Users/joseph/Downloads/Heeb's List - Remaining Verified Leads (Updated).csv"

def load_processed_emails(cio_csv_path):
    """Load emails from Customer.io export that have lead_for_heebnewsletters=true"""
    processed = set()
    
    print(f"📖 Reading updated Customer.io export: {cio_csv_path}...")
    with open(cio_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = row.get('email', '').strip().lower()
            lead_tag = row.get('lead_for_heebnewsletters', '').strip().lower()
            # Only include emails where lead_for_heebnewsletters is true
            if email and lead_tag in ('true', '1', 'yes'):
                processed.add(email)
    
    print(f"   Found {len(processed)} emails with lead_for_heebnewsletters=true")
    return processed

def load_remaining_leads(remaining_csv_path):
    """Load emails from the remaining verified leads CSV"""
    remaining = []
    
    print(f"\n📖 Reading remaining verified leads CSV: {remaining_csv_path}...")
    with open(remaining_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = row.get('email', '').strip().lower()
            brand = row.get('brand', '').strip()
            if email and brand:
                remaining.append({
                    'email': email,
                    'original_email': row['email'].strip(),  # Keep original case
                    'brand': brand
                })
    
    print(f"   Found {len(remaining)} remaining verified leads")
    return remaining

def main():
    print("=" * 60)
    print("🔍 Check Remaining Verified Leads")
    print("=" * 60)
    print()
    
    # Load processed emails from updated Customer.io export
    processed_emails = load_processed_emails(UPDATED_CIO_EXPORT_CSV)
    
    # Load remaining verified leads
    remaining_leads = load_remaining_leads(REMAINING_LEADS_CSV)
    
    # Filter out already processed
    still_remaining = []
    newly_processed = []
    
    for lead in remaining_leads:
        if lead['email'] in processed_emails:
            newly_processed.append(lead)
        else:
            still_remaining.append(lead)
    
    print()
    print("=" * 60)
    print("📊 COMPARISON RESULTS")
    print("=" * 60)
    print(f"Total in remaining verified leads CSV: {len(remaining_leads)}")
    print(f"✅ Newly processed (now in Customer.io): {len(newly_processed)}")
    print(f"⏳ Still remaining to process: {len(still_remaining)}")
    print()
    
    if len(still_remaining) > 0:
        print(f"⚠️  {len(still_remaining)} verified emails still need to be processed")
        
        # Write updated CSV with only remaining leads
        print(f"\n💾 Writing updated CSV: {UPDATED_REMAINING_CSV}...")
        with open(UPDATED_REMAINING_CSV, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['email', 'brand'])
            writer.writeheader()
            for lead in still_remaining:
                writer.writerow({
                    'email': lead['original_email'],
                    'brand': lead['brand']
                })
        print(f"   ✅ Created updated CSV with {len(still_remaining)} remaining verified leads")
    else:
        print("🎉 All verified leads have been processed!")
    
    print()

if __name__ == "__main__":
    main()

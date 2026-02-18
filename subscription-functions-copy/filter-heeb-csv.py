#!/usr/bin/env python3
"""
Filter Heeb Leads CSV - Remove Already Processed and Unverified Emails

This script:
1. Reads the Customer.io export CSV (already processed)
2. Reads the Verified CSV (Email Oversight verified emails)
3. Reads the original CSV
4. Removes emails that are:
   - Already in Customer.io (processed)
   - NOT in the Verified CSV (unverified)
5. Creates a new CSV with only verified, unprocessed emails
"""

import csv
import os

# File paths
ORIGINAL_CSV = "/Users/joseph/Downloads/Heeb's List - Active Leads.csv"
CIO_EXPORT_CSV = "/Users/joseph/Downloads/customers-2026-01-13_21-28.csv"
VERIFIED_CSV = "/Users/joseph/Downloads/Heeb's List - Verified (1).csv"
OUTPUT_CSV = "/Users/joseph/Downloads/Heeb's List - Remaining Verified Leads.csv"

def load_processed_emails(cio_csv_path):
    """Load emails from Customer.io export that have lead_for_heebnewsletters=true"""
    processed = set()
    
    print(f"📖 Reading Customer.io export: {cio_csv_path}...")
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

def load_verified_emails(verified_csv_path):
    """Load verified emails from Email Oversight verified CSV"""
    verified = set()
    
    print(f"📖 Reading Verified CSV: {verified_csv_path}...")
    with open(verified_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = row.get('Email', '').strip().lower()
            if email:
                verified.add(email)
    
    print(f"   Found {len(verified)} verified emails")
    return verified

def filter_csv(original_csv_path, processed_emails, verified_emails, output_csv_path):
    """Filter original CSV to exclude processed and unverified emails"""
    print(f"\n📖 Reading original CSV: {original_csv_path}...")
    
    remaining_leads = []
    skipped_processed = 0
    skipped_unverified = 0
    
    with open(original_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = row.get('email', '').strip().lower()
            brand = row.get('brand', '').strip()
            
            if email and brand:
                # Skip if already processed in Customer.io
                if email in processed_emails:
                    skipped_processed += 1
                    continue
                
                # Skip if not verified by Email Oversight
                if email not in verified_emails:
                    skipped_unverified += 1
                    continue
                
                # Include this email (verified and not yet processed)
                remaining_leads.append({
                    'email': row['email'].strip(),  # Keep original case
                    'brand': brand
                })
    
    total_original = len(remaining_leads) + skipped_processed + skipped_unverified
    
    print(f"   Original leads: {total_original}")
    print(f"   Already processed (excluded): {skipped_processed}")
    print(f"   Not verified (excluded): {skipped_unverified}")
    print(f"   Remaining verified leads to process: {len(remaining_leads)}")
    
    # Write filtered CSV
    print(f"\n💾 Writing filtered CSV: {output_csv_path}...")
    with open(output_csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['email', 'brand'])
        writer.writeheader()
        writer.writerows(remaining_leads)
    
    print(f"   ✅ Created new CSV with {len(remaining_leads)} remaining verified leads")
    return len(remaining_leads), skipped_processed, skipped_unverified

def main():
    print("=" * 60)
    print("🔍 Filter Heeb Leads CSV")
    print("=" * 60)
    print()
    
    # Load processed emails from Customer.io
    processed_emails = load_processed_emails(CIO_EXPORT_CSV)
    
    # Load verified emails from Email Oversight
    verified_emails = load_verified_emails(VERIFIED_CSV)
    
    # Filter the original CSV
    remaining_count, skipped_processed, skipped_unverified = filter_csv(
        ORIGINAL_CSV,
        processed_emails,
        verified_emails,
        OUTPUT_CSV
    )
    
    print()
    print("=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    print(f"✅ New CSV created: {OUTPUT_CSV}")
    print(f"   Remaining verified leads to process: {remaining_count}")
    print(f"   Already processed (excluded): {skipped_processed}")
    print(f"   Not verified (excluded): {skipped_unverified}")
    print()
    print("📝 NOTE: These emails are already verified by Email Oversight,")
    print("   so Email Oversight validation can be skipped during processing.")
    print()
    print("Ready to process tomorrow! 🚀")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Filter and Process Heeb Leads

This script:
1. Reads the original CSV
2. Reads a list of already-processed emails (from Customer.io export)
3. Filters the CSV to exclude already-processed emails
4. Processes only the remaining emails
"""

import json
import csv
import requests
import time
import sys
import os

# Configuration
ORIGINAL_CSV = "/Users/joseph/Downloads/Heeb's List - Active Leads.csv"
BATCH_SIZE = 20
URL = "https://subscription-functions.vercel.app/api/bulk-lead-upload"

# Get processed emails file from command line or use default
if len(sys.argv) > 1:
    PROCESSED_EMAILS_FILE = sys.argv[1]
else:
    PROCESSED_EMAILS_FILE = "/Users/joseph/Downloads/customers-2026-01-13_19-42.csv"  # Customer.io CSV export

def load_processed_emails(file_path):
    """Load already-processed emails from Customer.io CSV export"""
    processed = set()
    if os.path.exists(file_path):
        print(f"📖 Reading processed emails from {file_path}...")
        
        # Check if it's a CSV (Customer.io export) or text file
        with open(file_path, 'r', encoding='utf-8') as f:
            first_line = f.readline().strip()
            f.seek(0)  # Reset to beginning
            
            # If first line contains 'email' and 'lead_for_heebnewsletters', it's a CSV
            if 'email' in first_line.lower() and 'lead_for_heebnewsletters' in first_line.lower():
                # It's a Customer.io CSV export
                reader = csv.DictReader(f)
                for row in reader:
                    email = row.get('email', '').strip().lower()
                    lead_tag = row.get('lead_for_heebnewsletters', '').strip().lower()
                    # Only include emails where lead_for_heebnewsletters is true
                    if email and lead_tag in ('true', '1', 'yes'):
                        processed.add(email)
                print(f"   Found {len(processed)} emails with lead_for_heebnewsletters=true")
            else:
                # It's a simple text file (one email per line)
                for line in f:
                    email = line.strip().lower()
                    if email:
                        processed.add(email)
                print(f"   Found {len(processed)} already-processed emails")
    else:
        print(f"⚠️  Processed emails file not found: {file_path}")
        print(f"   Will process all emails from CSV")
    return processed

def load_csv_emails(csv_file):
    """Load emails from CSV"""
    print(f"📖 Reading CSV file: {csv_file}...")
    leads = []
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = row['email'].strip()
            brand = row['brand'].strip()
            if email and brand:
                leads.append({
                    "email": email,
                    "brand": brand
                })
    print(f"   Found {len(leads)} leads in CSV")
    return leads

def filter_leads(leads, processed_emails):
    """Filter out already-processed emails"""
    filtered = []
    skipped = 0
    for lead in leads:
        email_lower = lead['email'].lower()
        if email_lower not in processed_emails:
            filtered.append(lead)
        else:
            skipped += 1
    
    print(f"\n📊 Filtering Results:")
    print(f"   Original: {len(leads)} leads")
    print(f"   Already processed: {skipped} leads")
    print(f"   Remaining to process: {len(filtered)} leads")
    
    return filtered

def process_leads(leads):
    """Process leads in batches"""
    if not leads:
        print("\n✅ No leads to process!")
        return
    
    total = len(leads)
    batches = (total + BATCH_SIZE - 1) // BATCH_SIZE
    
    print(f"\n🚀 Processing {total} leads in {batches} batches...")
    print("=" * 60)
    
    results = {
        "total": total,
        "successful": 0,
        "failed": 0,
        "skipped": 0,
        "leadTagsSynced": 0,
        "errors": []
    }
    
    start_time = time.time()
    
    # Process in batches
    for i in range(0, total, BATCH_SIZE):
        batch = leads[i:i+BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        
        batch_start = time.time()
        print(f"\n📦 Batch {batch_num}/{batches} ({len(batch)} leads)...", end=" ", flush=True)
        
        try:
            response = requests.post(
                URL,
                json={"leads": batch},
                headers={"Content-Type": "application/json"},
                timeout=90
            )
            
            batch_elapsed = time.time() - batch_start
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get('success'):
                        summary = data.get('summary', {})
                        batch_successful = summary.get('successful', 0)
                        batch_skipped = summary.get('skipped', 0)
                        batch_tags = summary.get('leadTagsSynced', 0)
                        
                        results["successful"] += batch_successful
                        results["skipped"] += batch_skipped
                        results["leadTagsSynced"] += batch_tags
                        
                        print(f"✅ {batch_successful} successful, {batch_skipped} skipped, {batch_tags} tags synced ({batch_elapsed:.1f}s)")
                    else:
                        print(f"❌ Failed: {data.get('message', 'Unknown error')} ({batch_elapsed:.1f}s)")
                        results["failed"] += len(batch)
                except json.JSONDecodeError:
                    print(f"❌ Invalid JSON response ({batch_elapsed:.1f}s)")
                    results["failed"] += len(batch)
            else:
                print(f"❌ HTTP {response.status_code} ({batch_elapsed:.1f}s)")
                results["failed"] += len(batch)
                
        except requests.exceptions.Timeout:
            batch_elapsed = time.time() - batch_start
            print(f"⏱️  TIMEOUT after {batch_elapsed:.1f}s")
            results["failed"] += len(batch)
        except Exception as e:
            batch_elapsed = time.time() - batch_start
            print(f"❌ Error: {str(e)[:100]} ({batch_elapsed:.1f}s)")
            results["failed"] += len(batch)
        
        # Progress update every 10 batches
        if batch_num % 10 == 0:
            elapsed = time.time() - start_time
            rate = results["successful"] / elapsed if elapsed > 0 else 0
            remaining = total - (batch_num * BATCH_SIZE)
            eta = remaining / rate if rate > 0 else 0
            print(f"\n   Progress: {batch_num}/{batches} batches, {results['successful']} successful, ~{eta:.0f}s remaining")
        
        # Small delay between batches
        if i + BATCH_SIZE < total:
            time.sleep(0.5)
    
    total_elapsed = time.time() - start_time
    
    print()
    print("=" * 60)
    print("📊 FINAL SUMMARY")
    print("=" * 60)
    print(f"Total leads processed: {results['total']}")
    print(f"Successful: {results['successful']}")
    print(f"Failed: {results['failed']}")
    print(f"Skipped: {results['skipped']}")
    print(f"Lead tags synced: {results['leadTagsSynced']}")
    print(f"Total time: {total_elapsed:.1f} seconds")
    if total_elapsed > 0:
        print(f"Average rate: {results['successful']/total_elapsed:.1f} leads/second")

def main():
    print("=" * 60)
    print("🔍 Filter and Process Heeb Leads")
    print("=" * 60)
    print()
    print(f"📁 Processed emails file: {PROCESSED_EMAILS_FILE}")
    print(f"📁 Original CSV: {ORIGINAL_CSV}")
    print()
    
    # Load processed emails
    processed_emails = load_processed_emails(PROCESSED_EMAILS_FILE)
    
    # Load CSV
    all_leads = load_csv_emails(ORIGINAL_CSV)
    
    # Filter leads
    remaining_leads = filter_leads(all_leads, processed_emails)
    
    # Ask for confirmation (skip if running non-interactively)
    if remaining_leads:
        print(f"\n⚠️  About to process {len(remaining_leads)} leads")
        try:
            response = input("Continue? (y/n): ").strip().lower()
            if response != 'y':
                print("❌ Cancelled")
                return
        except (EOFError, KeyboardInterrupt):
            # Running non-interactively, auto-confirm
            print("(Auto-confirming, running non-interactively)")
        
        # Process remaining leads
        process_leads(remaining_leads)
    else:
        print("\n✅ All leads have already been processed!")

if __name__ == "__main__":
    main()

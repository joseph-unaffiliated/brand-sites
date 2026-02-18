#!/usr/bin/env python3
"""
Bulk Unsubscribe Script

Reads a CSV file with emails and unsubscribes them from a specified brand.

CSV Format:
- Must have an 'email' column
- Optional 'brand' column (if not provided, uses the --brand argument)

Usage:
    python3 bulk-unsubscribe.py emails.csv --brand heebnewsletters
    python3 bulk-unsubscribe.py emails.csv --brand heebnewsletters --batch-size 10
"""

import csv
import requests
import time
import argparse
import sys

# Default configuration
BASE_URL = "https://subscription-functions.vercel.app"
UNSUBSCRIBE_URL = f"{BASE_URL}/api/bulk-unsubscribe"

def unsubscribe_batch(emails, brand, dry_run=False):
    """Unsubscribe a batch of emails from a brand"""
    if dry_run:
        print(f"  [DRY RUN] Would unsubscribe {len(emails)} emails from {brand}")
        return {"success": True, "dry_run": True, "count": len(emails)}
    
    try:
        # Call the bulk unsubscribe endpoint
        payload = {
            "emails": emails,
            "brand": brand
        }
        
        response = requests.post(
            UNSUBSCRIBE_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            return {
                "success": True,
                "status_code": response.status_code,
                "result": result
            }
        else:
            return {
                "success": False,
                "status_code": response.status_code,
                "error": response.text[:200]
            }
    except requests.exceptions.Timeout:
        return {"success": False, "error": "Request timeout"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def main():
    parser = argparse.ArgumentParser(
        description="Bulk unsubscribe emails from a brand",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Unsubscribe all emails in CSV from heebnewsletters
  python3 bulk-unsubscribe.py emails.csv --brand heebnewsletters
  
  # Process in batches of 10 with 1 second delay
  python3 bulk-unsubscribe.py emails.csv --brand heebnewsletters --batch-size 10 --delay 1
  
  # Dry run to see what would be unsubscribed
  python3 bulk-unsubscribe.py emails.csv --brand heebnewsletters --dry-run
        """
    )
    
    parser.add_argument("csv_file", help="Path to CSV file with emails")
    parser.add_argument("--brand", required=True, help="Brand ID to unsubscribe from")
    parser.add_argument("--batch-size", type=int, default=1, help="Number of emails to process per batch (default: 1)")
    parser.add_argument("--delay", type=float, default=0.5, help="Delay in seconds between batches (default: 0.5)")
    parser.add_argument("--dry-run", action="store_true", help="Preview what would be unsubscribed without actually doing it")
    parser.add_argument("--email-column", default="email", help="Name of the email column in CSV (default: 'email')")
    parser.add_argument("--brand-column", help="Name of the brand column in CSV (if different per email)")
    
    args = parser.parse_args()
    
    # Read CSV file
    print(f"📖 Reading CSV file: {args.csv_file}")
    emails_to_unsubscribe = []
    
    try:
        with open(args.csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            # Check if email column exists
            if args.email_column not in reader.fieldnames:
                print(f"❌ Error: CSV file must have a column named '{args.email_column}'")
                print(f"   Available columns: {', '.join(reader.fieldnames)}")
                sys.exit(1)
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (row 1 is header)
                email = row.get(args.email_column, '').strip()
                if not email:
                    continue
                
                # Use brand from CSV if brand_column is specified, otherwise use --brand argument
                brand = row.get(args.brand_column, '').strip() if args.brand_column else args.brand
                if not brand:
                    brand = args.brand
                
                emails_to_unsubscribe.append({
                    "email": email,
                    "brand": brand,
                    "row": row_num
                })
    except FileNotFoundError:
        print(f"❌ Error: File not found: {args.csv_file}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error reading CSV file: {str(e)}")
        sys.exit(1)
    
    total = len(emails_to_unsubscribe)
    if total == 0:
        print("❌ No emails found in CSV file")
        sys.exit(1)
    
    batches = (total + args.batch_size - 1) // args.batch_size
    
    print(f"📊 Found {total} emails to unsubscribe")
    if args.brand_column:
        print(f"📦 Brands will be read from CSV column: {args.brand_column}")
    else:
        print(f"📦 Brand: {args.brand}")
    print(f"⚙️  Batch size: {args.batch_size}, Delay: {args.delay}s")
    if args.dry_run:
        print("🔍 DRY RUN MODE - No actual unsubscribes will be performed")
    print()
    print("Starting processing...")
    print("=" * 60)
    
    results = {
        "total": total,
        "successful": 0,
        "failed": 0,
        "errors": []
    }
    
    start_time = time.time()
    
    # Group by brand for efficiency (if not using brand column)
    if not args.brand_column:
        # All same brand - process in batches
        all_emails = [item["email"] for item in emails_to_unsubscribe]
        all_brand = args.brand
        
        for i in range(0, total, args.batch_size):
            batch_emails = all_emails[i:i + args.batch_size]
            batch_num = (i // args.batch_size) + 1
            
            print(f"\n📦 Batch {batch_num}/{batches} ({len(batch_emails)} emails)")
            
            result = unsubscribe_batch(batch_emails, all_brand, dry_run=args.dry_run)
            
            if result.get("success"):
                if args.dry_run:
                    results["successful"] += len(batch_emails)
                else:
                    # Parse the API response
                    api_result = result.get("result", {})
                    summary = api_result.get("summary", {})
                    results["successful"] += summary.get("successful", 0)
                    results["failed"] += summary.get("failed", 0)
                    if "errors" in summary:
                        results["errors"].extend(summary["errors"])
                    print(f"      ✅ Batch processed: {summary.get('successful', 0)} successful, {summary.get('failed', 0)} failed")
            else:
                results["failed"] += len(batch_emails)
                error_msg = result.get("error", f"Status code: {result.get('status_code', 'unknown')}")
                for email in batch_emails:
                    results["errors"].append({
                        "email": email,
                        "error": error_msg
                    })
                print(f"      ❌ Batch failed: {error_msg}")
            
            # Delay between batches (except for the last batch)
            if i + args.batch_size < total and not args.dry_run:
                time.sleep(args.delay)
    else:
        # Different brands per email - process individually
        for i in range(0, total, args.batch_size):
            batch = emails_to_unsubscribe[i:i + args.batch_size]
            batch_num = (i // args.batch_size) + 1
            
            print(f"\n📦 Batch {batch_num}/{batches} ({len(batch)} emails)")
            
            # Group by brand within batch
            by_brand = {}
            for item in batch:
                brand = item["brand"]
                if brand not in by_brand:
                    by_brand[brand] = []
                by_brand[brand].append(item["email"])
            
            # Process each brand group
            for brand, emails in by_brand.items():
                print(f"  Processing {len(emails)} emails for brand: {brand}")
                result = unsubscribe_batch(emails, brand, dry_run=args.dry_run)
                
                if result.get("success"):
                    if args.dry_run:
                        results["successful"] += len(emails)
                    else:
                        api_result = result.get("result", {})
                        summary = api_result.get("summary", {})
                        results["successful"] += summary.get("successful", 0)
                        results["failed"] += summary.get("failed", 0)
                        if "errors" in summary:
                            results["errors"].extend(summary["errors"])
                else:
                    results["failed"] += len(emails)
                    error_msg = result.get("error", f"Status code: {result.get('status_code', 'unknown')}")
                    for email in emails:
                        results["errors"].append({
                            "email": email,
                            "error": error_msg
                        })
            
            # Delay between batches (except for the last batch)
            if i + args.batch_size < total and not args.dry_run:
                time.sleep(args.delay)
    
    elapsed = time.time() - start_time
    
    print()
    print("=" * 60)
    print("📊 Processing Complete!")
    print(f"   Total: {results['total']}")
    print(f"   Successful: {results['successful']}")
    print(f"   Failed: {results['failed']}")
    print(f"   Time elapsed: {elapsed:.2f} seconds")
    
    if results["errors"]:
        print(f"\n⚠️  Errors ({len(results['errors'])}):")
        for error in results["errors"][:10]:  # Show first 10 errors
            print(f"   Row {error['row']}: {error['email']} - {error['error']}")
        if len(results["errors"]) > 10:
            print(f"   ... and {len(results['errors']) - 10} more errors")
    
    if args.dry_run:
        print("\n🔍 This was a dry run. Use without --dry-run to actually unsubscribe.")

if __name__ == "__main__":
    main()

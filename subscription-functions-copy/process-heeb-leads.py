import json
import csv
import requests
import time
import sys

csv_file = "/Users/joseph/Downloads/Heeb's List - Remaining Verified Leads (Updated).csv"
batch_size = 1  # Process one at a time to avoid Vercel timeout (60s limit)
url = "https://subscription-functions.vercel.app/api/bulk-lead-upload"
skip_validation = True  # These emails are pre-verified by Email Oversight

# Read and parse CSV
print("📖 Reading CSV file...")
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

total = len(leads)
batches = (total + batch_size - 1) // batch_size

print(f"📊 Found {total} verified leads")
print(f"📦 Will process in {batches} batches of {batch_size} leads each")
print(f"🏷️  Brand: heebnewsletters")
if skip_validation:
    print(f"⏭️  Email Oversight validation: SKIPPED (pre-verified)")
print()
print("Starting processing...")
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
for i in range(0, total, batch_size):
    batch = leads[i:i+batch_size]
    batch_num = (i // batch_size) + 1
    
    batch_start = time.time()
    print(f"\n📦 Batch {batch_num}/{batches} ({len(batch)} leads)...", end=" ", flush=True)
    
    try:
        response = requests.post(
            url,
            json={
                "leads": batch,
                "skipValidation": skip_validation
            },
            headers={"Content-Type": "application/json"},
            timeout=90  # 90 second timeout
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
                print(f"   Response: {response.text[:200]}")
                results["failed"] += len(batch)
        else:
            print(f"❌ HTTP {response.status_code} ({batch_elapsed:.1f}s)")
            print(f"   Response: {response.text[:200]}")
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
        remaining = total - (batch_num * batch_size)
        eta = remaining / rate if rate > 0 else 0
        print(f"\n   Progress: {batch_num}/{batches} batches, {results['successful']} successful, ~{eta:.0f}s remaining")
    
    # Small delay between batches to avoid rate limiting
    if i + batch_size < total:
        time.sleep(0.5)

total_elapsed = time.time() - start_time

print()
print("=" * 60)
print("📊 FINAL SUMMARY")
print("=" * 60)
print(f"Total leads: {results['total']}")
print(f"Successful: {results['successful']}")
print(f"Failed: {results['failed']}")
print(f"Skipped: {results['skipped']}")
print(f"Lead tags synced: {results['leadTagsSynced']}")
print(f"Total time: {total_elapsed:.1f} seconds")
print(f"Average rate: {results['successful']/total_elapsed:.1f} leads/second" if total_elapsed > 0 else "")

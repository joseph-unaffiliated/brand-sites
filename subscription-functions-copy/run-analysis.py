import requests
import csv
import json

csv_file = "/Users/joseph/Downloads/Heeb's List - Active Leads.csv"
url = "https://subscription-functions.vercel.app/api/analyze-heeb-leads-endpoint"

# Read emails from CSV
print("📖 Reading CSV file...")
emails = []
with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        email = row['email'].strip()
        if email:
            emails.append(email.lower())

print(f"📊 Found {len(emails)} emails")
print(f"🔍 Sending to analysis endpoint...")

# Send in batches of 1000 to avoid timeout
batch_size = 1000
all_results = {
    "already_processed": [],
    "failed_validation": [],
    "already_subscribed": [],
    "unsubscribed": [],
    "wrong_brand_interest": [],
    "needs_processing": [],
    "not_in_bq": []
}

for i in range(0, len(emails), batch_size):
    batch = emails[i:i+batch_size]
    batch_num = (i // batch_size) + 1
    total_batches = (len(emails) + batch_size - 1) // batch_size
    
    print(f"\n📦 Processing batch {batch_num}/{total_batches} ({len(batch)} emails)...")
    
    try:
        response = requests.post(
            url,
            json={"emails": batch},
            headers={"Content-Type": "application/json"},
            timeout=300
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                # Merge results
                for key in all_results.keys():
                    all_results[key].extend(data['results'].get(key, []))
                
                summary = data.get('summary', {})
                print(f"✅ Batch complete:")
                print(f"   Already processed: {summary.get('already_processed', 0)}")
                print(f"   Needs processing: {summary.get('needs_processing', 0)}")
                print(f"   Failed validation: {summary.get('failed_validation', 0)}")
                print(f"   Already subscribed: {summary.get('already_subscribed', 0)}")
                print(f"   Not in BQ: {summary.get('not_in_bq', 0)}")
            else:
                print(f"❌ Failed: {data.get('message', 'Unknown error')}")
        else:
            print(f"❌ HTTP {response.status_code}: {response.text[:200]}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

# Write results
print("\n" + "=" * 60)
print("📊 FINAL SUMMARY")
print("=" * 60)
print(f"Total emails: {len(emails)}")
print(f"Already processed (has lead tag): {len(all_results['already_processed'])}")
print(f"Failed validation: {len(all_results['failed_validation'])}")
print(f"Already subscribed: {len(all_results['already_subscribed'])}")
print(f"Unsubscribed: {len(all_results['unsubscribed'])}")
print(f"Wrong brand interest: {len(all_results['wrong_brand_interest'])}")
print(f"Needs processing: {len(all_results['needs_processing'])}")
print(f"Not in BigQuery: {len(all_results['not_in_bq'])}")

# Write CSV files
import os
output_dir = "lead-analysis-results"
os.makedirs(output_dir, exist_ok=True)

if all_results['needs_processing']:
    with open(f"{output_dir}/needs-processing.csv", 'w') as f:
        f.write("email,reason\n")
        for r in all_results['needs_processing']:
            f.write(f'"{r["email"]}","{r["reason"]}"\n')
    print(f"\n✅ Wrote {len(all_results['needs_processing'])} emails that need processing to: {output_dir}/needs-processing.csv")

if all_results['not_in_bq']:
    with open(f"{output_dir}/not-in-bq.csv", 'w') as f:
        f.write("email,reason\n")
        for r in all_results['not_in_bq']:
            f.write(f'"{r["email"]}","{r["reason"]}"\n')
    print(f"✅ Wrote {len(all_results['not_in_bq'])} emails not in BigQuery to: {output_dir}/not-in-bq.csv")

if all_results['already_processed']:
    with open(f"{output_dir}/already-processed.csv", 'w') as f:
        f.write("email\n")
        for r in all_results['already_processed']:
            f.write(f'"{r["email"]}"\n')
    print(f"✅ Wrote {len(all_results['already_processed'])} already processed emails to: {output_dir}/already-processed.csv")

if all_results['failed_validation']:
    with open(f"{output_dir}/failed-validation.csv", 'w') as f:
        f.write("email,reason\n")
        for r in all_results['failed_validation']:
            f.write(f'"{r["email"]}","{r["reason"]}"\n')
    print(f"✅ Wrote {len(all_results['failed_validation'])} failed validation emails to: {output_dir}/failed-validation.csv")

if all_results['already_subscribed']:
    with open(f"{output_dir}/already-subscribed.csv", 'w') as f:
        f.write("email,reason,subscriptions\n")
        for r in all_results['already_subscribed']:
            subs = ','.join(r.get('details', {}).get('subscriptions', []))
            f.write(f'"{r["email"]}","{r["reason"]}","{subs}"\n')
    print(f"✅ Wrote {len(all_results['already_subscribed'])} already subscribed emails to: {output_dir}/already-subscribed.csv")

print("\n✅ Analysis complete!")

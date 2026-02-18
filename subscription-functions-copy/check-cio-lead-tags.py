"""
Check Customer.io for lead tags
This script reads emails from a CSV (from BigQuery QUALIFIES_AS_LEAD results)
and checks if they have the lead_for_heebnewsletters tag in Customer.io
"""

import csv
import requests
import time
import os

# Customer.io API credentials (set as environment variables)
CIO_SITE_ID = os.getenv('CIO_SITE_ID')
CIO_API_KEY = os.getenv('CIO_API_KEY')
CIO_TRACK_URL = os.getenv('CIO_TRACK_URL', 'https://track.customer.io/api/v2')

if not CIO_SITE_ID or not CIO_API_KEY:
    print("❌ Error: CIO_SITE_ID and CIO_API_KEY environment variables must be set")
    print("   Set them with: export CIO_SITE_ID=... && export CIO_API_KEY=...")
    exit(1)

cioAuth = requests.auth.HTTPBasicAuth(CIO_SITE_ID, CIO_API_KEY)

def check_lead_tag(email):
    """Check if email has lead_for_heebnewsletters tag in Customer.io"""
    try:
        response = requests.get(
            f"{CIO_TRACK_URL}/entity",
            params={
                'type': 'person',
                'email': email.lower()
            },
            auth=cioAuth,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('results') and len(data['results']) > 0:
                person = data['results'][0]
                lead_tag = person.get('attributes', {}).get('lead_for_heebnewsletters')
                return lead_tag == True
        elif response.status_code == 404:
            return False
        
        return False
    except Exception as e:
        print(f"   Error checking {email}: {str(e)[:100]}")
        return False

def main():
    # Read emails from CSV file (from BigQuery QUALIFIES_AS_LEAD results)
    input_file = input("Enter path to CSV file with emails (or press Enter for 'qualifies-as-leads.csv'): ").strip()
    if not input_file:
        input_file = "qualifies-as-leads.csv"
    
    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        print("   First run the BigQuery SQL query and export QUALIFIES_AS_LEAD emails to CSV")
        return
    
    print(f"📖 Reading {input_file}...")
    emails = []
    with open(input_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = row.get('email', '').strip()
            if email:
                emails.append(email.lower())
    
    print(f"📊 Found {len(emails)} emails to check")
    print("🔍 Checking Customer.io for lead tags...\n")
    
    results = {
        'has_tag': [],
        'no_tag': [],
        'not_found': []
    }
    
    for i, email in enumerate(emails, 1):
        if i % 50 == 0:
            print(f"   Checked {i}/{len(emails)}...")
        
        has_tag = check_lead_tag(email)
        
        if has_tag:
            results['has_tag'].append(email)
        else:
            # Check if person exists at all
            try:
                response = requests.get(
                    f"{CIO_TRACK_URL}/entity",
                    params={'type': 'person', 'email': email.lower()},
                    auth=cioAuth,
                    timeout=10
                )
                if response.status_code == 404:
                    results['not_found'].append(email)
                else:
                    results['no_tag'].append(email)
            except:
                results['no_tag'].append(email)
        
        time.sleep(0.1)  # Rate limiting
    
    print("\n" + "=" * 60)
    print("📊 RESULTS")
    print("=" * 60)
    print(f"Total emails checked: {len(emails)}")
    print(f"✅ Has lead tag: {len(results['has_tag'])}")
    print(f"❌ No lead tag (but in Customer.io): {len(results['no_tag'])}")
    print(f"⚠️  Not found in Customer.io: {len(results['not_found'])}")
    
    # Write results
    output_dir = "lead-analysis-results"
    os.makedirs(output_dir, exist_ok=True)
    
    if results['has_tag']:
        with open(f"{output_dir}/has-lead-tag.csv", 'w') as f:
            f.write("email\n")
            for email in results['has_tag']:
                f.write(f"{email}\n")
        print(f"\n✅ Wrote {len(results['has_tag'])} emails with tag to: {output_dir}/has-lead-tag.csv")
    
    if results['no_tag']:
        with open(f"{output_dir}/needs-lead-tag.csv", 'w') as f:
            f.write("email\n")
            for email in results['no_tag']:
                f.write(f"{email}\n")
        print(f"✅ Wrote {len(results['no_tag'])} emails that need tag to: {output_dir}/needs-lead-tag.csv")
    
    if results['not_found']:
        with open(f"{output_dir}/not-in-cio.csv", 'w') as f:
            f.write("email\n")
            for email in results['not_found']:
                f.write(f"{email}\n")
        print(f"✅ Wrote {len(results['not_found'])} emails not in Customer.io to: {output_dir}/not-in-cio.csv")
    
    print("\n✅ Analysis complete!")

if __name__ == "__main__":
    main()

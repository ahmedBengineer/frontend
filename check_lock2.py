import json

with open(r'C:\Users\AhmedKhawar\Desktop\Pentagon\frontend\package-lock.json', 'r') as f:
    data = json.load(f)

# Print top-level keys
print("Top-level keys:", list(data.keys()))

# Print first 300 chars
print("\nFirst 300 chars:")
print(json.dumps(data, indent=2)[:300])
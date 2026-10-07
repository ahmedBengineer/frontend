import json

with open(r'C:\Users\AhmedKhawar\Desktop\Pentagon\frontend\package-lock.json', 'r') as f:
    data = json.load(f)

# Check if es-abstract is in the lockfile
packages = data.get('packages', {})
all_keys = list(packages.keys())
print('Total package keys:', len(all_keys))
print('es-abstract in keys:', 'es-abstract' in all_keys)

# Look at top-level dependencies
deps = data.get('dependencies', {})
print('Top-level deps count:', len(deps))
print('Top-level deps keys sample:', list(deps.keys())[:30])

# Check if es-abstract is a top-level dep
print('es-abstract in top-level deps:', 'es-abstract' in deps)
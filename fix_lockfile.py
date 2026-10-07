import json, subprocess, os

frontend = r'C:\Users\AhmedKhawar\Desktop\Pentagon\frontend'

# Read current package.json
with open(os.path.join(frontend, 'package.json'), 'r') as f:
    pkg = json.load(f)

# Remove old lockfile
lockfile = os.path.join(frontend, 'package-lock.json')
if os.path.exists(lockfile):
    os.remove(lockfile)
    print("Removed old package-lock.json")

# Run npm install to regenerate
result = subprocess.run(
    ['npm', 'install'],
    cwd=frontend,
    capture_output=True,
    text=True,
    timeout=120000
)
print("STDOUT:", result.stdout[-500:] if result.stdout else "none")
print("STDERR:", result.stderr[-500:] if result.stderr else "none")
print("Exit code:", result.returncode)

# Check new lockfile
if os.path.exists(lockfile):
    with open(lockfile, 'r') as f:
        data = json.load(f)
    print("New lockfileVersion:", data.get('lockfileVersion'))
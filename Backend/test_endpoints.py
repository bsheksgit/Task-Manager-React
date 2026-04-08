#!/usr/bin/env python3
"""Test script to verify backend endpoints are correctly configured."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

try:
    from app import app
    print("✓ Backend FastAPI app imported successfully")
    
    # List all routes
    print("\n📋 Available endpoints:")
    endpoints_by_method = {}
    for route in app.routes:
        method = list(route.methods)[0] if route.methods else "UNKNOWN"
        path = route.path
        if method not in endpoints_by_method:
            endpoints_by_method[method] = []
        endpoints_by_method[method].append(path)
    
    # Print grouped by method
    for method in sorted(endpoints_by_method.keys()):
        print(f"\n{method}:")
        for path in sorted(endpoints_by_method[method]):
            print(f"  {path}")
    
    # Check for the specific endpoints we changed
    print("\n🔍 Checking updated endpoints:")
    
    required_endpoints = [
        ("POST", "/users/{userId}/tasks"),
        ("GET", "/users/{userId}/tasks"),
        ("DELETE", "/users/{userId}/tasks/{taskId}"),
    ]
    
    all_endpoints = [(list(route.methods)[0], route.path) for route in app.routes if route.methods]
    
    missing = []
    for req_method, req_path in required_endpoints:
        found = any(method == req_method and path == req_path for method, path in all_endpoints)
        if found:
            print(f"✓ {req_method} {req_path}")
        else:
            print(f"✗ {req_method} {req_path} (MISSING)")
            missing.append((req_method, req_path))
    
    # Check old endpoints are NOT present
    print("\n🔍 Checking old endpoints (should NOT be present):")
    old_endpoints = [
        ("POST", "/save-user-tasks"),
        ("GET", "/get-user-tasks"),
        ("DELETE", "/delete-user-task"),
    ]
    
    old_found = []
    for old_method, old_path in old_endpoints:
        found = any(method == old_method and path == old_path for method, path in all_endpoints)
        if found:
            print(f"⚠ {old_method} {old_path} (STILL PRESENT - should be removed)")
            old_found.append((old_method, old_path))
        else:
            print(f"✓ {old_method} {old_path} (removed)")
    
    # Summary
    print("\n📊 Summary:")
    print(f"Total endpoints: {len(all_endpoints)}")
    if not missing and not old_found:
        print("✅ All endpoint changes successful!")
    else:
        if missing:
            print(f"❌ Missing {len(missing)} required endpoints")
        if old_found:
            print(f"❌ Still have {len(old_found)} old endpoints that should be removed")
        sys.exit(1)
            
except Exception as e:
    print(f"❌ Error importing app: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
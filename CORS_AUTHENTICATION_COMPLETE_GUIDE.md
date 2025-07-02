# 🔧 ACTA-UI CORS & Authentication Complete Guide

## 🚨 **Current Issue: CORS Blocking Your Application**

Your ACTA-UI is failing because API Gateway is not properly configured for CORS (Cross-Origin Resource Sharing). The browser blocks requests from `https://d7t9x3j66yd8k.cloudfront.net` to your API because there are no CORS headers.

## 📋 **Understanding CORS Headers**

### **What CORS Headers Do We Define?**

Yes, **you define what each CORS header should be**. Here's what each one means:

```http
Access-Control-Allow-Origin: https://d7t9x3j66yd8k.cloudfront.net
# ☝️ Specifies exactly which domain can access your API

Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
# ☝️ Specifies which HTTP methods are allowed

Access-Control-Allow-Headers: Content-Type,Authorization,X-Amz-Date,X-Api-Key
# ☝️ Specifies which headers the frontend can send

Access-Control-Allow-Credentials: true
# ☝️ Allows cookies and authentication headers to be sent
```

### **For Your ACTA-UI Project:**
- **Origin**: `https://d7t9x3j66yd8k.cloudfront.net` (your CloudFront domain)
- **Methods**: `GET,POST,OPTIONS` (what your API supports)
- **Headers**: `Content-Type,Authorization` (for JSON and auth tokens)

## 🔐 **Authentication Token Explained**

### **"Authorization" Header - The Word vs The Token**

In your CloudFormation template:
```json
"IdentitySource": "method.request.header.Authorization"
```

This means:
- **Header Name**: `Authorization` (this is the literal word "Authorization")
- **Header Value**: `Bearer <jwt-token>` (this is the actual JWT token from Cognito)

### **How It Works:**

1. **User logs in** → Cognito returns a JWT token
2. **Frontend stores token** → Usually in localStorage or memory
3. **Frontend sends requests** → Adds header: `Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...`
4. **API Gateway validates** → Checks the JWT token against your Cognito User Pool
5. **Lambda receives** → User info extracted from the validated token

### **In Your React Code:**
Your `fetchWrapper.ts` already does this correctly:
```typescript
// ✅ This is correct
if (token) {
  headers.set('Authorization', `Bearer ${token}`);
}
```

## 🛠️ **Complete Solution**

### **Option 1: Run the CORS Fix Script (Recommended)**

I've created a script that fixes all your CORS issues:

```bash
./fix-cors-acta-ui.sh
```

This script:
1. ✅ Adds OPTIONS methods to all your endpoints
2. ✅ Configures proper CORS headers
3. ✅ Makes OPTIONS methods public (no auth required)
4. ✅ Keeps your actual endpoints protected with Cognito
5. ✅ Deploys the changes automatically

### **Option 2: Manual AWS Console Fix**

If you prefer manual control:

1. **Go to AWS API Gateway Console**
2. **Select your API**: `q2b9avfwv5`
3. **For each resource** (health, timeline, project-summary, etc.):
   - Click the resource
   - Click "Actions" → "Enable CORS"
   - Set **Access-Control-Allow-Origin**: `https://d7t9x3j66yd8k.cloudfront.net`
   - Set **Access-Control-Allow-Headers**: `Content-Type,Authorization`
   - Set **Access-Control-Allow-Methods**: `GET,POST,OPTIONS`
   - Click "Enable CORS and replace existing CORS headers"
4. **Deploy the API**: Actions → Deploy API → Stage: prod

## 🎯 **Why This Fixes Everything**

### **Before Fix:**
```
Browser: "Can I make a request to your API?"
API Gateway: "Who are you? Show me your token!"
Browser: "But this is just a CORS check..."
API Gateway: "NO TOKEN = NO ACCESS!" (403 error)
Browser: "CORS ERROR - Blocking the request"
```

### **After Fix:**
```
Browser: "Can I make a request to your API?" (OPTIONS request)
API Gateway: "Sure! Here are the CORS headers" (200 with CORS headers)
Browser: "Great! Now making the real request..." (GET/POST with Authorization header)
API Gateway: "Valid token? Yes! Here's your data" (200 with data + CORS headers)
Browser: "✅ Success!"
```

## 🔍 **Testing Your Fix**

After applying the fix, test with:

```bash
# Test CORS preflight
curl -H "Origin: https://d7t9x3j66yd8k.cloudfront.net" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Authorization" \
     -X OPTIONS \
     https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health

# Should return 200 with CORS headers
```

## 📊 **Your CloudFormation Template Analysis**

Your template is **99% correct**! The only issue is missing CORS configuration. Here's what's perfect:

✅ **Cognito Authorizer**: Properly configured  
✅ **JWT Token Validation**: Using `method.request.header.Authorization`  
✅ **Endpoint Structure**: All endpoints properly defined  
✅ **Lambda Permissions**: All correctly set up  

❌ **Missing**: OPTIONS methods for CORS preflight requests

## 🚀 **Go Live Checklist**

After running the CORS fix:

1. ✅ **Clear browser cache** completely
2. ✅ **Test authentication flow** - login/logout
3. ✅ **Test each button** in your UI
4. ✅ **Check browser console** - should be no CORS errors
5. ✅ **Monitor CloudWatch logs** for any Lambda errors

## 💡 **Pro Tips**

### **Token Security:**
- Your JWT tokens expire (that's good security)
- Your frontend should handle token refresh automatically
- Amplify handles this for you with `fetchAuthSession()`

### **CORS Security:**
- Never use `*` for `Access-Control-Allow-Origin` in production
- Your specific domain restriction is perfect for security
- CORS is a browser security feature - it doesn't affect server-to-server calls

### **Troubleshooting:**
- If you get 403 on authenticated endpoints: Check the JWT token format
- If you get CORS errors: The OPTIONS method isn't properly configured
- If you get 502 errors: Check CloudWatch logs for Lambda function errors

## 🎉 **Expected Result**

After the fix:
- ✅ No more CORS errors in browser console
- ✅ All API calls work from your frontend
- ✅ Authentication flow works smoothly
- ✅ All buttons in your UI function properly
- ✅ Ready for production! 🚀

---

**The bottom line**: Run `./fix-cors-acta-ui.sh` and your ACTA-UI will be production-ready! 🎯

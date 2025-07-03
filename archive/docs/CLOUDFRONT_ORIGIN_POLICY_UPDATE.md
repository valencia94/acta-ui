# Custom Origin Request Policy Update

This snippet updates distribution `EPQU7PVDLQXUA` to forward auth headers while leaving caching intact.

```bash
# Create policy if missing and apply to all behaviors
bash scripts/update-cloudfront-origin-policy.sh
```

To verify the new policy:

```bash
aws cloudfront get-distribution \
  --id EPQU7PVDLQXUA \
  --query 'Distribution.DistributionConfig.DefaultCacheBehavior.OriginRequestPolicyId'
```

CloudFormation patch example:

```yaml
CustomAuthOriginPolicy:
  Type: AWS::CloudFront::OriginRequestPolicy
  Properties:
    OriginRequestPolicyConfig: 
      Name: acta-ui-auth-policy
      Comment: Allow Authorization and CORS headers
      HeadersConfig:
        HeaderBehavior: whitelist
        Headers:
          Quantity: 3
          Items:
            - Authorization
            - Origin
            - Content-Type
      CookiesConfig:
        CookieBehavior: none
      QueryStringsConfig:
        QueryStringBehavior: all
```

import awsConfig from "@/aws-exports.js";

describe("aws parity", () => {
  it("should have correct user pool ID", () => {
    expect(awsConfig.aws_user_pools_id).toBe("us-east-2_FyHLtOhiY");
  });

  it("should have correct user pool web client ID", () => {
    expect(awsConfig.aws_user_pools_web_client_id).toBe(
      "dshos5iou44tuach7ta3ici5m",
    );
  });

  it("should have correct identity pool ID", () => {
    expect(awsConfig.aws_cognito_identity_pool_id).toBe(
      "us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35",
    );
  });

  it("should have correct API endpoint with /prod path", () => {
    expect(awsConfig.API.REST.ActaAPI.endpoint).toBe(
      "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod",
    );
  });
});

import cfg from "@/aws-exports";

describe("aws parity", () => {
  it("should have correct user pool ID matching July 10 snapshot", () => {
    expect(cfg.Auth.userPoolId).toBe("us-east-2_FyHLtOhiY");
  });

  it("should have correct user pool web client ID", () => {
    expect(cfg.Auth.userPoolWebClientId).toBe("dshos5iou44tuach7ta3ici5m");
  });

  it("should have correct identity pool ID", () => {
    expect(cfg.Auth.identityPoolId).toBe(
      "us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35",
    );
  });

  it("should have correct API endpoint with /prod path", () => {
    expect(cfg.API.REST.ActaAPI.endpoint).toBe(
      "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod",
    );
  });

  it("should have mandatory sign in enabled", () => {
    expect(cfg.Auth.mandatorySignIn).toBe(true);
  });
});

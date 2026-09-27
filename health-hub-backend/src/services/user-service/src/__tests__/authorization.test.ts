const createUser = jest.fn();
const createPatient = jest.fn();
const getUser = jest.fn();
const listUsers = jest.fn();
const deleteUser = jest.fn();

jest.mock("../services/userService", () => ({
  UserService: jest.fn().mockImplementation(() => ({
    create: createUser,
    get: getUser,
    list: listUsers,
    delete: deleteUser,
  })),
}));
jest.mock("../../../patient-service/src/services/patientService", () => ({
  PatientService: jest.fn().mockImplementation(() => ({ create: createPatient })),
}));

import { register } from "../handlers/auth";
import { del, get, list } from "../handlers/user";
import { canAccessUser, getCaller } from "../middleware/auth";

const ctx = {} as any;
const cb = () => undefined;
const USER_ID = "3f1c2a4e-8b7d-4c3a-9e2f-1a2b3c4d5e6f";

const withClaims = (claims: Record<string, string> | null, extra: any = {}) => ({
  ...extra,
  requestContext: claims ? { authorizer: { jwt: { claims } } } : {},
});

beforeEach(() => jest.clearAllMocks());

describe("getCaller / canAccessUser", () => {
  it("reads username and role from JWT claims", () => {
    const caller = getCaller(withClaims({ "cognito:username": "a@b.com", "custom:role": "patient" }));
    expect(caller).toEqual({ username: "a@b.com", role: "patient" });
  });

  it("returns null without authorizer claims", () => {
    expect(getCaller(withClaims(null))).toBeNull();
  });

  it("allows self and admin, denies others", () => {
    expect(canAccessUser({ username: USER_ID, role: "patient" }, USER_ID)).toBe(true);
    expect(canAccessUser({ username: "admin@x", role: "admin" }, USER_ID)).toBe(true);
    expect(canAccessUser({ username: "other", role: "doctor" }, USER_ID)).toBe(false);
    expect(canAccessUser(null, USER_ID)).toBe(false);
  });
});

describe("register", () => {
  const body = { email: "p@x.com", password: "a-long-password", firstName: "P", lastName: "X" };

  it("always creates a patient, ignoring any role in the body", async () => {
    createUser.mockResolvedValue({ id: "p@x.com" });
    createPatient.mockResolvedValue({ id: "profile-1" });

    const res: any = await register({ body: JSON.stringify({ ...body, role: "patient" }) } as any, ctx, cb);

    expect(res.statusCode).toBe(201);
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ role: "patient" }));
  });

  it.each(["doctor", "admin"])("refuses self-registration as %s", async (role) => {
    const res: any = await register({ body: JSON.stringify({ ...body, role }) } as any, ctx, cb);

    expect(res.statusCode).toBe(403);
    expect(createUser).not.toHaveBeenCalled();
  });
});

describe("/users handlers", () => {
  it("list is admin-only", async () => {
    const res: any = await list(withClaims({ "cognito:username": "p", "custom:role": "patient" }) as any, ctx, cb);
    expect(res.statusCode).toBe(403);
    expect(listUsers).not.toHaveBeenCalled();
  });

  it("delete is admin-only", async () => {
    const event = withClaims({ "cognito:username": "d", "custom:role": "doctor" }, { pathParameters: { id: USER_ID } });
    const res: any = await del(event as any, ctx, cb);
    expect(res.statusCode).toBe(403);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("get denies another user's record", async () => {
    const event = withClaims({ "cognito:username": "someone-else", "custom:role": "patient" }, { pathParameters: { id: USER_ID } });
    const res: any = await get(event as any, ctx, cb);
    expect(res.statusCode).toBe(403);
    expect(getUser).not.toHaveBeenCalled();
  });

  it("get allows the user's own record", async () => {
    getUser.mockResolvedValue({ id: USER_ID });
    const event = withClaims({ "cognito:username": USER_ID, "custom:role": "patient" }, { pathParameters: { id: USER_ID } });
    const res: any = await get(event as any, ctx, cb);
    expect(res.statusCode).toBe(200);
  });
});

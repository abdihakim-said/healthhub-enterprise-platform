// Caller identity from the API Gateway Cognito JWT authorizer (HTTP API payload v2).
// Roles come from the verified token, never from the request body.

export interface Caller {
  username: string;
  role: string;
}

export const getCaller = (event: any): Caller | null => {
  const claims = event?.requestContext?.authorizer?.jwt?.claims;
  if (!claims || !claims["cognito:username"]) {
    return null;
  }
  return {
    username: String(claims["cognito:username"]),
    role: String(claims["custom:role"] ?? ""),
  };
};

export const isAdmin = (caller: Caller | null): boolean => caller?.role === "admin";

// Users are keyed by their Cognito username, so "self" means the same username.
export const canAccessUser = (caller: Caller | null, userId: string): boolean =>
  !!caller && (isAdmin(caller) || caller.username === userId);

export const forbidden = () => ({
  statusCode: 403,
  body: JSON.stringify({ error: "Forbidden" }),
});

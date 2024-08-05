import {
  SessionStorage,
  createCookieSessionStorage,
  redirect,
} from "@remix-run/node";

const SESSION_NAME = "__auth_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

type CookieOptions = Exclude<
  Parameters<typeof createCookieSessionStorage>[0],
  undefined
>["cookie"];

const COOKIE_DEFAULTS: CookieOptions = {
  name: SESSION_NAME,
  secure: process.env.NODE_ENV === "production",
  secrets: undefined,
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE,
  httpOnly: true,
};

export class AuthSession<TSessionData extends Record<string, any>> {
  private storage: SessionStorage<{ data: TSessionData }>;

  constructor(cookieOptions?: Partial<CookieOptions>) {
    this.storage = createCookieSessionStorage<{ data: TSessionData }>({
      cookie: {
        ...COOKIE_DEFAULTS,
        ...cookieOptions,
      },
    });
  }
  createCookie = async (sessionData: TSessionData) => {
    const session = await this.storage.getSession();
    session.set("data", sessionData);
    let cookie = await this.storage.commitSession(session);
    return cookie;
  };
  create = async (sessionData: TSessionData, redirectTo = "/") => {
    return redirect(redirectTo, {
      headers: {
        "Set-Cookie": await this.createCookie(sessionData),
      },
    });
  };

  logout = async (request: Request, redirectTo = "/") => {
    const session = await this._getSession(request);
    return redirect(redirectTo, {
      headers: {
        "Set-Cookie": await this.storage.destroySession(session),
      },
    });
  };

  _getSession = (request: Request) => {
    return this.storage.getSession(request.headers.get("Cookie"));
  };

  get = async (request: Request) => {
    const session = await this._getSession(request);
    let data: TSessionData | undefined = session?.get?.("data");

    return data || null;
  };

  require = async (request: Request, returnTo: string = "") => {
    let { pathname, search } = new URL(request.url);
    if (!returnTo) returnTo = `${pathname}${search}`;
    let sessionData = await this.get(request);
    if (!sessionData) {
      const searchParams = new URLSearchParams([["returnTo", returnTo]]);
      throw redirect(`/login?${searchParams}`);
    }
    return sessionData;
  };
}

import type { AuthError } from '@supabase/supabase-js';

/**
 * Maps Supabase auth failures to messages a user can act on.
 *
 * Replaces the Firebase-era mapper, whose fallback read "An error occurred
 * during registration" even when it was reached from sign-in, logout, password
 * reset or profile update. The fallback here is deliberately generic.
 */
export function getAuthErrorMessage(error: unknown): string {
  let code =
    (error as AuthError | undefined)?.code ??
    (error as { error_code?: string } | undefined)?.error_code;
  let message = (error as { message?: string } | undefined)?.message ?? '';

  // Some auth endpoints surface the raw JSON body as the message
  // (e.g. `{"code":400,"error_code":"validation_failed","msg":"..."}`).
  // Never show that to a user — pull the real fields out of it.
  if (message.trim().startsWith('{')) {
    try {
      const body = JSON.parse(message);
      code = body.error_code ?? body.code ?? code;
      message = body.msg ?? body.message ?? message;
    } catch {
      /* not JSON after all — leave as-is */
    }
  }

  // A disabled provider comes back as validation_failed with this message,
  // which is indistinguishable by code from ordinary form-validation errors —
  // so match the text.
  if (/provider is not enabled|unsupported provider/i.test(message)) {
    return 'That sign-in method is not enabled yet. Please use email and password, or contact support.';
  }

  switch (code) {
    case 'invalid_credentials':
      return 'Incorrect email or password.';
    case 'email_not_confirmed':
      return 'Please confirm your email address first — check your inbox for the link.';
    case 'user_already_exists':
    case 'email_exists':
      return 'That email is already registered. Try logging in instead.';
    case 'weak_password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'validation_failed':
      return 'Please check the details you entered and try again.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Please wait a minute and try again.';
    case 'same_password':
      return 'Your new password must be different from your current one.';
    case 'session_not_found':
    case 'refresh_token_not_found':
      return 'Your session has expired. Please log in again.';
    case 'signup_disabled':
      return 'New sign-ups are currently disabled.';
    case 'provider_disabled':
      return 'That sign-in method is not enabled for this app.';
  }

  // Network failures surface as a TypeError from fetch with no code.
  if (message.toLowerCase().includes('fetch')) {
    return 'Network error. Please check your internet connection.';
  }

  return message || 'Something went wrong. Please try again.';
}

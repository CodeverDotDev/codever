import { describe, expect, it, vi } from 'vitest';
import { LoginRequiredDialogComponent } from './login-required-dialog.component';

const create = (data: Record<string, unknown>) => {
  const wrapper = { login: vi.fn() };
  const dialogRef = { close: vi.fn() };
  const component = new LoginRequiredDialogComponent(
    {} as never,
    wrapper as never,
    dialogRef as never,
    {} as never,
    data
  );
  return { component, wrapper, dialogRef };
};

describe('LoginRequiredDialogComponent', () => {
  it('passes the copy request to the login', () => {
    const { component, wrapper, dialogRef } = create({
      message: 'Log in to copy',
      copyAfterLogin: true,
    });

    component.login();

    expect(dialogRef.close).toHaveBeenCalledWith('LOGIN_CONFIRMED');
    expect(wrapper.login).toHaveBeenCalledWith({ copyAfterLogin: true });
  });

  it('logs in without a copy request by default', () => {
    const { component, wrapper } = create({});

    component.login();

    expect(component.message).toContain('logged in');
    expect(wrapper.login).toHaveBeenCalledWith({ copyAfterLogin: false });
  });
});

import type { onboarding as fa } from '../fa/onboarding';
import type { Strings } from '../types';

export const onboarding: Strings<typeof fa> = {
  progress: {
    step: 'Step {{step}} of 4',
    complete: 'Setup complete',
  },
  later: 'Later',
  welcome: {
    you: 'You',
    partner: 'Partner',
    dialUnit: 'Years',
    headline: 'Your shared time, always in view.',
    body: 'RelTime Mobile connects your phone to your relationship in Relationship OS, with a RelTime on the desk or without one.',
    language: 'Language',
    continue: 'Continue in English',
  },
  account: {
    title: 'Sign in to Relationship OS.',
    body: "If you don't have an account, we'll create one with this number.",
    phoneLabel: 'Mobile number',
    phonePlaceholder: '0912 345 6789',
    requestCode: 'Get sign-in code',
    codeLabel: 'Sign-in code',
    codeSentPrefix: 'We texted a 6-digit code to ',
    codeSentSuffix: '.',
    changeNumber: 'Change number',
    resend: 'Resend',
    resendIn: 'Resend · {{time}}',
    resent: 'A new code is on its way.',
    signIn: 'Sign in',
    errors: {
      phoneInvalid: "That number doesn't look right. Enter a mobile number like 0912 345 6789.",
      codeInvalid: "That code isn't right. Try again.",
      codeExpired: 'That code is no longer valid. Get a new one.',
      attemptsExceeded: 'Too many wrong codes. Get a new one.',
      rateLimited: 'Too many code requests. Try again in a little while.',
    },
  },
  name: {
    eyebrow: 'Account',
    title: 'What should your partner call you?',
    body: 'Your partner sees this name on shared screens.',
    label: 'Name',
    placeholder: 'e.g. Mohammad',
    continue: 'Continue',
    tooLong: 'Use at most 40 characters.',
  },
  ready: {
    headline: 'Connected.',
    subline: 'RelTime and this phone are ready.',
    headlinePhone: "You're all set.",
    sublinePhone: 'This phone is ready.',
    summary: 'Setup summary',
    action: 'See our time',
  },
};

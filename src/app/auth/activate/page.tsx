'use client';

import React from 'react';
import { AccountActivationView } from '@/components/AccountActivationView';

export default function ActivatePage() {
  return (
    <AccountActivationView
      onSuccessRedirect={(targetUrl) => {
        window.location.href = targetUrl;
      }}
    />
  );
}

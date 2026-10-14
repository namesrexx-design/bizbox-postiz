'use client';

import React from 'react';
import { SocialBrandSource } from '../ui/social-brand-source';

export const Logo = () => (
  <span className="mt-[8px]" style={{ width: 60, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
    <span role="img" aria-label="Social LYFE" title="Social LYFE"
      style={{ width: 60, height: 60, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src="/social-lyfe.png" alt="" aria-hidden="true" width={56} height={56} style={{ objectFit: 'contain' }} />
    </span>
    <SocialBrandSource />
  </span>
);

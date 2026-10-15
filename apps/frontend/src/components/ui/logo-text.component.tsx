import React from 'react';
import { SocialBrandSource } from './social-brand-source';

export const LogoTextComponent = () => (
  <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
    <span role="img" aria-label="Lyfe Social" className="inline-flex items-center gap-2 whitespace-nowrap">
      <img src="/social-lyfe.png" alt="" aria-hidden="true" width={48} height={48} style={{ objectFit: 'contain', flexShrink: 0 }} />
      <span style={{ fontSize: 20, fontWeight: 600 }}>Lyfe Social</span>
    </span>
    <SocialBrandSource />
  </span>
);

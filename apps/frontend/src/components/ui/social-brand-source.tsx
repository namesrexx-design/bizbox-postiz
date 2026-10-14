import React from 'react';

export const SocialBrandSource = () => (
  <a
    href={process.env.NEXT_PUBLIC_SOURCE_CODE_URL || 'https://github.com/namesrexx-design/bizbox-postiz/tree/fix/codex/social-bizbox-brand-20261012'}
    aria-label="Source code"
    title="Based on Postiz · AGPL-3.0 · Matching source"
    style={{ fontSize: 10, lineHeight: '16px', color: '#a3a3a3', textDecoration: 'underline' }}
  >
    Source
  </a>
);

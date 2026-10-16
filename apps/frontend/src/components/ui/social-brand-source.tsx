import React from 'react';
import styles from './social-brand-source.module.css';

export const SocialBrandSource = () => (
  <a
    href={process.env.NEXT_PUBLIC_SOURCE_CODE_URL || 'https://github.com/namesrexx-design/bizbox-postiz'}
    aria-label="Source code"
    title="Based on Postiz · AGPL-3.0 · Matching source"
    className={styles.source}
  >
    Source
  </a>
);

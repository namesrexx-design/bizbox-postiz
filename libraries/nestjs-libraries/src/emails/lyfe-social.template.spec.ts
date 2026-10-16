import { renderLyfeSocialEmail } from './lyfe-social.template';

describe('LYFE Social transactional email', () => {
  it('brands an account email and retains its activation link', () => {
    const body = '<a href="https://social.example/auth/activate/test-token">Activate</a>';
    const html = renderLyfeSocialEmail('Activate your LYFE Social account', body, 'https://social.example/');
    expect(html).toContain('LYFE Social');
    expect(html).toContain(body);
    expect(html).toContain('src="https://social.example/social-lyfe.png"');
    expect(html).toContain('href="https://social.example/settings"');
    expect(html).not.toContain('example//');
  });

  it('escapes subject text without escaping the transactional HTML', () => {
    const html = renderLyfeSocialEmail('<img src=x onerror="alert(1)"> & Updates', '<strong>Ready</strong>', 'https://social.example');
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; Updates');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('<strong>Ready</strong>');
  });

  it('escapes the configured asset and preferences URL in attributes', () => {
    const html = renderLyfeSocialEmail('Updates', 'Ready', 'https://social.example/"unsafe');
    expect(html).toContain('https://social.example/&quot;unsafe/settings');
    expect(html).not.toContain('/"unsafe');
  });
});

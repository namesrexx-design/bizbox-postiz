const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);

// Transactional content is already HTML; only surrounding text and URLs are escaped.
export const renderLyfeSocialEmail = (
  subject: string,
  html: string,
  frontendUrl: string
) => {
  const baseUrl = escapeHtml(frontendUrl.replace(/\/$/, ''));
  return `
    <div style="background:#e0f2fe;padding:24px 12px;font-family:Arial,sans-serif;color:#0c4a6e">
      <table role="presentation" style="width:100%;max-width:640px;margin:auto;background:#fff;border-radius:12px;border-top:4px solid #0284c7;border-spacing:0">
        <tr><td style="padding:24px">
          <img src="${baseUrl}/social-lyfe.png" alt="" width="56" height="56" style="display:block;object-fit:contain" />
          <p style="font-size:20px;font-weight:bold;margin:12px 0 24px">LYFE Social</p>
          <h1 style="font-size:24px;line-height:1.3;color:#0f172a">${escapeHtml(subject)}</h1>
          <div style="font-size:16px;line-height:1.6;color:#334155;overflow-wrap:anywhere">${html}</div>
          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.6;color:#475569">
            You can change your notification preferences in your <a href="${baseUrl}/settings" style="color:#0369a1">account settings</a>.
          </div>
        </td></tr>
      </table>
    </div>`;
};

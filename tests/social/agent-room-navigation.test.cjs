const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { loadTypeScript } = require('./load-typescript.cjs');
const ownerRoom = loadTypeScript('apps/frontend/src/components/agents/owner.social.room.ts');
const ownerRoomImport = '@gitroom/frontend/components/agents/owner.social.room';
let userRole = 'ADMIN';
const { MenuItem } = loadTypeScript('apps/frontend/src/components/new-layout/menu-item.tsx', {
  'next/navigation': { usePathname: () => '/launches' },
  'next/link': { default: ({ prefetch, children, ...props }) => React.createElement('a', props, children), __esModule: true },
});
const { TopMenu } = loadTypeScript('apps/frontend/src/components/layout/top.menu.tsx', {
  [ownerRoomImport]: ownerRoom,
  '@gitroom/frontend/components/layout/user.context': { useUser: () => ({ orgId: 'test-org', role: userRole, tier: 'PRO' }) },
  '@gitroom/react/helpers/variable.context': { useVariables: () => ({ isGeneral: true, billingEnabled: false }) },
  '@gitroom/react/translation/get.transation.service.client': { useT: () => (_key, fallback) => fallback },
  '@gitroom/frontend/components/new-layout/menu-item': { MenuItem },
  '@gitroom/frontend/components/layout/new-modal': { useModals: () => ({ openModal: () => {} }) },
  '@gitroom/frontend/components/layout/agent.media.modal': { AgentMediaModal: () => null },
});

test('rendered navigation offers Agent Room at the owner Social URL', () => {
  const html = renderToStaticMarkup(React.createElement(TopMenu));
  assert.match(html, /href="https:\/\/biz-box.io\/owner\/room\?room=social-media"/);
  assert.match(html, />Agent Room<\/div>/);
  assert.doesNotMatch(html, /href="\/agents/);
});

test('member navigation omits the owner-only Agent Room link', t => {
  userRole = 'USER';
  t.after(() => { userRole = 'ADMIN'; });
  const html = renderToStaticMarkup(React.createElement(TopMenu));
  assert.doesNotMatch(html, /owner\/room|Agent Room/);
  assert.match(html, /href="\/launches"/);
});

for (const route of ['layout.tsx', 'page.tsx', '[id]/page.tsx']) {
  test(`legacy agents/${route} redirects to the owner Social room`, async () => {
    let target;
    const page = loadTypeScript('apps/frontend/src/app/(app)/(site)/agents/' + route, {
      [ownerRoomImport]: ownerRoom,
      'next/navigation': { redirect: url => { target = url; throw new Error('NEXT_REDIRECT'); } },
    });
    await assert.rejects(page.default({ children: null }), /NEXT_REDIRECT/);
    assert.equal(target, 'https://biz-box.io/owner/room?room=social-media');
  });
}

module.exports = {
  rootDir: '../..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/libraries/nestjs-libraries/src/emails/lyfe-social.template.spec.ts'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { target: 'es2020', module: 'commonjs', esModuleInterop: true } }] },
};

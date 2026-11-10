// Testes de componentes (renderização real com Testing Library). Os testes de lógica
// continuam em `node --test` (tests/*.test.cjs); este executor só roda tests/components.
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/tests/components/setup.ts'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
  roots: ['<rootDir>/tests/components'],
  testMatch: ['**/*.test.tsx'],
  moduleNameMapper: {
    '^@/shared/(.*)$': '<rootDir>/../shared/$1',
    '^@/(.*)$': '<rootDir>/$1',
  },
};

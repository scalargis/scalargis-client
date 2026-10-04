import { loadComponentModule } from './componentModules';

describe('loadComponentModule', () => {
  it('resolves to null for a component the build does not hold', async () => {
    await expect(loadComponentModule('NoSuchComponent')).resolves.toBeNull();
  });
});

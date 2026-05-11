import {
  AttributesTable,
  TOC,
  UserLogin,
  i18n,
  utils,
  JsonForm,
  JsonFormDefaultRenderers,
  ProgressControl,
} from './components';

describe('Components barrel', () => {
  it('exports core component modules as namespaces', () => {
    expect(AttributesTable).toBeDefined();
    expect(TOC).toBeDefined();
    expect(UserLogin).toBeDefined();
  });

  it('exports utility namespaces', () => {
    expect(i18n).toBeDefined();
    expect(utils).toBeDefined();
    expect(typeof i18n).toBe('object');
    expect(typeof utils).toBe('object');
  });

  it('exports JsonForm components', () => {
    expect(JsonForm).toBeDefined();
    expect(JsonFormDefaultRenderers).toBeDefined();
  });

  it('exports ProgressControl as a component', () => {
    expect(ProgressControl).toBeDefined();
  });
});

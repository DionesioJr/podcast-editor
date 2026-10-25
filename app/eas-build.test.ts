import fs from 'fs';
import path from 'path';

const easJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'eas.json'), 'utf-8'),
);
const appJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'app.json'), 'utf-8'),
);

describe('eas.json (PDE-104)', () => {
  it('define a versão mínima da CLI do EAS', () => {
    expect(typeof easJson.cli.version).toBe('string');
    expect(easJson.cli.version.length).toBeGreaterThan(0);
  });

  it('define só os perfis development, preview e production', () => {
    expect(Object.keys(easJson.build).sort()).toEqual([
      'development',
      'preview',
      'production',
    ]);
  });

  it('perfil development builda para instalação interna com cliente de desenvolvimento', () => {
    const { development } = easJson.build;
    expect(development.developmentClient).toBe(true);
    expect(development.distribution).toBe('internal');
    expect(development.android.buildType).toBe('apk');
    expect(development.ios.buildType).toBe('simulator');
  });

  it('perfil preview builda para distribuição interna sem cliente de desenvolvimento', () => {
    const { preview } = easJson.build;
    expect(preview.developmentClient).not.toBe(true);
    expect(preview.distribution).toBe('internal');
    expect(preview.android.buildType).toBe('apk');
    expect(preview.ios.buildType).toBe('adhoc');
  });

  it('perfil production builda para as lojas', () => {
    const { production } = easJson.build;
    expect(production.distribution).toBe('store');
    expect(production.android.buildType).toBe('aab');
    expect(production.ios.buildType).toBe('release');
  });

  it('não versiona credencial real nas chaves de submit, só placeholder', () => {
    const { ios, android } = easJson.submit.production;
    expect(ios.appleId).toBe('APPLE_ID');
    expect(ios.appleTeamId).toBe('APPLE_TEAM_ID');
    expect(android.serviceAccount).not.toMatch(/^\{/);
    expect(path.extname(android.serviceAccount)).toBe('.json');
  });
});

describe('app.json (PDE-104)', () => {
  it('declara nome e identificadores de pacote em ambas as plataformas', () => {
    const { expo } = appJson;
    expect(expo.name).toBe('Podcast Editor');
    expect(expo.ios.bundleIdentifier).toMatch(/^[a-z0-9.]+$/);
    expect(expo.android.package).toMatch(/^[a-z0-9.]+$/);
  });

  it('declara ícone e splash screen', () => {
    const { expo } = appJson;
    expect(expo.icon).toBeTruthy();
    expect(expo.splash.image).toBeTruthy();
    expect(expo.android.adaptiveIcon.foregroundImage).toBeTruthy();
  });

  it('declara as duas permissões de galeria do iOS com texto em português', () => {
    const { infoPlist } = appJson.expo.ios;
    expect(infoPlist.NSPhotoLibraryUsageDescription.length).toBeGreaterThan(0);
    expect(infoPlist.NSPhotoLibraryAddUsageDescription.length).toBeGreaterThan(0);
    expect(infoPlist.NSPhotoLibraryUsageDescription).not.toBe(
      infoPlist.NSPhotoLibraryAddUsageDescription,
    );
  });

  it('declara as permissões de mídia do Android necessárias para a galeria', () => {
    const { permissions } = appJson.expo.android;
    expect(permissions).toContain('android.permission.READ_MEDIA_IMAGES');
    expect(permissions).toContain('android.permission.READ_MEDIA_VIDEO');
  });

  it('não declara permissão de galeria duplicada no Android', () => {
    const { permissions } = appJson.expo.android;
    expect(new Set(permissions).size).toBe(permissions.length);
  });
});

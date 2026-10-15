import { mediaUrl } from './media-url';
import { environment } from '../../../environments/environment';

describe('mediaUrl', () => {
  it('renvoie null pour une valeur absente', () => {
    expect(mediaUrl(null)).toBeNull();
    expect(mediaUrl(undefined)).toBeNull();
    expect(mediaUrl('')).toBeNull();
  });

  it('préfixe le chemin par la base de l’API', () => {
    expect(mediaUrl('/uploads/avatars/x.png')).toBe(`${environment.apiUrl}/uploads/avatars/x.png`);
  });

  it('laisse une URL absolue inchangée', () => {
    expect(mediaUrl('https://cdn.example.com/photo.jpg')).toBe('https://cdn.example.com/photo.jpg');
  });
});

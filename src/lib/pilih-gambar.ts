import * as ImagePicker from 'expo-image-picker';

export type GambarDipilih = {
  fileName: string;
  base64: string | null;
};

export async function pilihGambar(options?: { base64?: boolean }): Promise<GambarDipilih | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    base64: options?.base64 ?? false,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  return {
    fileName: asset.fileName ?? asset.uri.split('/').pop() ?? 'foto.jpg',
    base64: asset.base64 ?? null,
  };
}

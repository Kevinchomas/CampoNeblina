import * as FileSystem from 'expo-file-system/legacy';

export const uploadImageToCloudinary = async (uri: string): Promise<string> => {
  try {
    const uploadResult = await FileSystem.uploadAsync(
      'https://api.cloudinary.com/v1_1/pprrfnne/image/upload',
      uri,
      {
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        parameters: {
          upload_preset: 'preset_camponeblina',
        },
      }
    );

    if (uploadResult.status !== 200) {
      throw new Error(`Error en la subida a Cloudinary: ${uploadResult.body}`);
    }

    const data = JSON.parse(uploadResult.body);
    if (data.secure_url) {
      return data.secure_url;
    }

    throw new Error('No se obtuvo la URL de la imagen.');
  } catch (error: any) {
    console.error('Error en uploadImageToCloudinary:', error);
    throw new Error(error.message || 'Ocurrió un error al subir la imagen');
  }
};



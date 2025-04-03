/**
 * imageProcessor.js
 * 
 * Utilidades para procesar imágenes y convertirlas a representaciones ASCII
 */

import { Image } from 'image-js';

// Conjuntos de caracteres ASCII ordenados por densidad (de menos a más denso)
const ASCII_CHARS = {
  simple: ' .,:;i1tfLCG08@',
  standard: ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  blocks: ' ░▒▓█',
  custom: ' .:;+=xX$&@'
};

// Caché para almacenar imágenes procesadas
const imageCache = new Map();

/**
 * Carga una imagen desde una URL o ruta de archivo
 * @param {string} src - URL o ruta de la imagen
 * @returns {Promise<Image>} - Objeto Image de image-js
 */
export const loadImage = async (src) => {
  try {
    // Verificar si la imagen ya está en caché
    if (imageCache.has(src)) {
      return imageCache.get(src);
    }
    
    // Cargar la imagen
    const image = await Image.load(src);
    
    // Guardar en caché
    imageCache.set(src, image);
    
    return image;
  } catch (error) {
    console.error('Error al cargar la imagen:', error);
    throw new Error(`No se pudo cargar la imagen desde ${src}`);
  }
};

/**
 * Redimensiona una imagen manteniendo la proporción
 * @param {Image} image - Imagen a redimensionar
 * @param {number} maxWidth - Ancho máximo
 * @param {number} maxHeight - Alto máximo (opcional)
 * @returns {Image} - Imagen redimensionada
 */
export const resizeImage = (image, maxWidth, maxHeight = null) => {
  // Si no se especifica altura, calcularla manteniendo la proporción
  if (!maxHeight) {
    const ratio = image.width / image.height;
    maxHeight = Math.floor(maxWidth / ratio);
  }
  
  // Calcular nuevas dimensiones manteniendo la proporción
  let newWidth = maxWidth;
  let newHeight = Math.floor(image.height * (newWidth / image.width));
  
  // Si la altura excede el máximo, ajustar basado en la altura
  if (maxHeight && newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = Math.floor(image.width * (newHeight / image.height));
  }
  
  // Redimensionar la imagen
  return image.resize({ width: newWidth, height: newHeight });
};

/**
 * Ajusta el brillo y contraste de una imagen
 * @param {Image} image - Imagen a ajustar
 * @param {number} brightness - Ajuste de brillo (-1 a 1)
 * @param {number} contrast - Ajuste de contraste (-1 a 1)
 * @returns {Image} - Imagen ajustada
 */
export const adjustImage = (image, brightness = 0, contrast = 0) => {
  // Crear una copia de la imagen
  const adjusted = image.clone();
  
  // Aplicar ajustes de brillo y contraste
  for (let i = 0; i < adjusted.data.length; i += adjusted.channels) {
    for (let c = 0; c < 3; c++) { // Solo ajustar canales RGB
      let value = adjusted.data[i + c];
      
      // Aplicar brillo
      value += brightness * 255;
      
      // Aplicar contraste
      const factor = (259 * (contrast + 1)) / (255 * (1 - contrast));
      value = factor * (value - 128) + 128;
      
      // Asegurar que el valor esté en el rango [0, 255]
      adjusted.data[i + c] = Math.max(0, Math.min(255, Math.round(value)));
    }
  }
  
  return adjusted;
};

/**
 * Convierte un píxel a un carácter ASCII basado en su luminosidad
 * @param {number} r - Valor de rojo (0-255)
 * @param {number} g - Valor de verde (0-255)
 * @param {number} b - Valor de azul (0-255)
 * @param {string} charSet - Conjunto de caracteres a utilizar
 * @returns {string} - Carácter ASCII correspondiente
 */
export const pixelToAscii = (r, g, b, charSet = 'standard') => {
  // Calcular luminosidad (fórmula estándar)
  const luminosity = 0.299 * r + 0.587 * g + 0.114 * b;
  
  // Obtener el conjunto de caracteres
  const chars = ASCII_CHARS[charSet] || ASCII_CHARS.standard;
  
  // Mapear luminosidad a índice en el conjunto de caracteres
  const index = Math.floor((luminosity / 255) * (chars.length - 1));
  
  return chars[index];
};

/**
 * Mapea un color RGB a un color ANSI para terminal
 * @param {number} r - Valor de rojo (0-255)
 * @param {number} g - Valor de verde (0-255)
 * @param {number} b - Valor de azul (0-255)
 * @returns {string} - Código de color ANSI
 */
export const rgbToAnsi = (r, g, b) => {
  // Códigos de color ANSI de 8 bits (256 colores)
  return `\x1b[38;2;${r};${g};${b}m`;
};

/**
 * Convierte una imagen a representación ASCII
 * @param {Image} image - Imagen a convertir
 * @param {Object} options - Opciones de conversión
 * @returns {string} - Representación ASCII de la imagen
 */
export const imageToAscii = (image, options = {}) => {
  const {
    charSet = 'standard',
    colored = true,
    width = 80,
    height = null,
    brightness = 0,
    contrast = 0
  } = options;
  
  // Redimensionar la imagen
  const resized = resizeImage(image, width, height);
  
  // Ajustar brillo y contraste si es necesario
  const adjusted = (brightness !== 0 || contrast !== 0) 
    ? adjustImage(resized, brightness, contrast) 
    : resized;
  
  // Convertir a escala de grises para cálculos de luminosidad
  const grey = adjusted.grey();
  
  let asciiArt = '';
  const resetColor = '\x1b[0m';
  
  // Recorrer cada píxel y convertirlo a ASCII
  for (let y = 0; y < adjusted.height; y++) {
    for (let x = 0; x < adjusted.width; x++) {
      const idx = (y * adjusted.width + x);
      const r = adjusted.getValueXY(x, y, 0);
      const g = adjusted.getValueXY(x, y, 1);
      const b = adjusted.getValueXY(x, y, 2);
      
      // Obtener carácter ASCII basado en luminosidad
      const char = pixelToAscii(r, g, b, charSet);
      
      // Añadir color si está habilitado
      if (colored) {
        asciiArt += rgbToAnsi(r, g, b) + char + resetColor;
      } else {
        asciiArt += char;
      }
    }
    asciiArt += '\n';
  }
  
  return asciiArt;
};

/**
 * Convierte una imagen a HTML con caracteres ASCII coloreados
 * @param {Image} image - Imagen a convertir
 * @param {Object} options - Opciones de conversión
 * @returns {string} - HTML con la representación ASCII de la imagen
 */
export const imageToAsciiHtml = (image, options = {}) => {
  const {
    charSet = 'standard',
    colored = true,
    width = 80,
    height = null,
    brightness = 0,
    contrast = 0
  } = options;
  
  // Redimensionar la imagen
  const resized = resizeImage(image, width, height);
  
  // Ajustar brillo y contraste si es necesario
  const adjusted = (brightness !== 0 || contrast !== 0) 
    ? adjustImage(resized, brightness, contrast) 
    : resized;
  
  let html = '<div class="ascii-art">';
  
  // Recorrer cada píxel y convertirlo a ASCII con estilos CSS
  for (let y = 0; y < adjusted.height; y++) {
    for (let x = 0; x < adjusted.width; x++) {
      const r = adjusted.getValueXY(x, y, 0);
      const g = adjusted.getValueXY(x, y, 1);
      const b = adjusted.getValueXY(x, y, 2);
      
      // Obtener carácter ASCII basado en luminosidad
      const char = pixelToAscii(r, g, b, charSet);
      
      // Añadir span con color si está habilitado
      if (colored) {
        html += `<span style="color: rgb(${r},${g},${b})">${char}</span>`;
      } else {
        html += char;
      }
    }
    html += '<br/>';
  }
  
  html += '</div>';
  return html;
};

/**
 * Procesa una imagen y devuelve su representación ASCII
 * @param {string} src - URL o ruta de la imagen
 * @param {Object} options - Opciones de conversión
 * @returns {Promise<string>} - Representación ASCII de la imagen
 */
export const processImage = async (src, options = {}) => {
  try {
    const image = await loadImage(src);
    return imageToAscii(image, options);
  } catch (error) {
    console.error('Error al procesar la imagen:', error);
    return '[ Error al procesar la imagen ]';
  }
};

/**
 * Procesa una imagen y devuelve su representación ASCII en HTML
 * @param {string} src - URL o ruta de la imagen
 * @param {Object} options - Opciones de conversión
 * @returns {Promise<string>} - HTML con la representación ASCII de la imagen
 */
export const processImageToHtml = async (src, options = {}) => {
  try {
    const image = await loadImage(src);
    return imageToAsciiHtml(image, options);
  } catch (error) {
    console.error('Error al procesar la imagen:', error);
    return '<div class="ascii-error">[ Error al procesar la imagen ]</div>';
  }
};

// Exportar todas las funciones
export default {
  loadImage,
  resizeImage,
  adjustImage,
  pixelToAscii,
  rgbToAnsi,
  imageToAscii,
  imageToAsciiHtml,
  processImage,
  processImageToHtml
};

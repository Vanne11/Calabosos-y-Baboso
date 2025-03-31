#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Biblioteca para mostrar imágenes en la consola con ALTA RESOLUCIÓN.
Optimizada para mostrar imágenes de 200x200 con gran detalle.

Esta versión utiliza caracteres especiales Unicode y bloques de
cuarto de tamaño para lograr una resolución mucho mayor.
"""

import os
import sys
from rich.console import Console
from rich.text import Text
from rich.panel import Panel

# Intentar importar PIL (Pillow) para el procesamiento de imágenes
try:
    from PIL import Image
    PIL_DISPONIBLE = True
except ImportError:
    PIL_DISPONIBLE = False

# Consola Rich global
console = Console()

def verificar_pillow():
    """Verifica si Pillow está instalado."""
    if not PIL_DISPONIBLE:
        console.print("[bold red]Error:[/bold red] Necesitas instalar Pillow:")
        console.print("[cyan]pip install pillow[/cyan]")
        return False
    return True

def mostrar_imagen_hd(ruta_imagen, ancho=100, alto=None, aspect_ratio=0.5):
    """
    Muestra una imagen con alta resolución en la consola.
    Esta función utiliza caracteres Unicode de bloques para representar
    imágenes con hasta 4 veces más resolución que los métodos convencionales.
    
    Args:
        ruta_imagen: Ruta al archivo de imagen
        ancho: Ancho deseado en caracteres (por defecto 100)
        alto: Alto deseado en caracteres (opcional)
        aspect_ratio: Relación de aspecto de los caracteres en la terminal (ancho/alto)
                      Valores típicos: 0.5 (terminal estándar), 1.0 (cuadrado perfecto)
    
    Returns:
        bool: True si la imagen se mostró correctamente
    """
    if not verificar_pillow():
        return False
    
    try:
        # Cargar imagen
        imagen = Image.open(ruta_imagen)
        if imagen.mode != "RGB":
            imagen = imagen.convert("RGB")
        
        # Calcular dimensiones con corrección de aspecto
        ancho_original, alto_original = imagen.size
        if alto is None:
            # Ajustar altura considerando la relación de aspecto del carácter
            # Los caracteres suelen ser más altos que anchos (aprox. 1:2 → aspect_ratio=0.5)
            # Ajustamos para que la imagen se vea correctamente proporcionada
            alto = int(alto_original * ancho / ancho_original / aspect_ratio)
        
        # Redimensionar imagen con alta calidad
        # Aumentamos la resolución horizontal para compensar caracteres rectangulares
        imagen_ancho = ancho * 2  # 2 pixeles por carácter en horizontal
        imagen_alto = alto * 2    # 2 pixeles por carácter en vertical
        imagen = imagen.resize((imagen_ancho, imagen_alto), Image.LANCZOS)
        
        # Crear texto formateado
        texto = Text()
        
        # Método de bloques de cuadrícula avanzado
        for y in range(0, imagen_alto, 2):
            for x in range(0, imagen_ancho, 2):
                # Dividimos un bloque 2x2 de píxeles en 4 cuadrantes
                # Cada cuadrante puede estar encendido o apagado
                
                # Obtener colores para los 4 cuadrantes (2x2 píxeles)
                top_left = imagen.getpixel((x, y)) if x < imagen_ancho and y < imagen_alto else (0, 0, 0)
                top_right = imagen.getpixel((x+1, y)) if x+1 < imagen_ancho and y < imagen_alto else (0, 0, 0)
                bottom_left = imagen.getpixel((x, y+1)) if x < imagen_ancho and y+1 < imagen_alto else (0, 0, 0)
                bottom_right = imagen.getpixel((x+1, y+1)) if x+1 < imagen_ancho and y+1 < imagen_alto else (0, 0, 0)
                
                # Calcular color promedio para fondo
                r_bg = (top_left[0] + top_right[0] + bottom_left[0] + bottom_right[0]) // 4
                g_bg = (top_left[1] + top_right[1] + bottom_left[1] + bottom_right[1]) // 4
                b_bg = (top_left[2] + top_right[2] + bottom_left[2] + bottom_right[2]) // 4
                
                # Calcular brillo para cada cuadrante
                # Usamos ponderación estándar para convertir RGB a brillo perceptual
                def brillo(r, g, b):
                    return 0.299 * r + 0.587 * g + 0.114 * b
                
                tl_bright = brillo(top_left[0], top_left[1], top_left[2])
                tr_bright = brillo(top_right[0], top_right[1], top_right[2])
                bl_bright = brillo(bottom_left[0], bottom_left[1], bottom_left[2])
                br_bright = brillo(bottom_right[0], bottom_right[1], bottom_right[2])
                avg_bright = (tl_bright + tr_bright + bl_bright + br_bright) / 4
                
                # Determinar qué cuadrantes están "activos" basado en diferencia de brillo
                threshold = 20  # Valor menor = más sensible a cambios
                
                # Considerar cuadrantes como activos o inactivos según su brillo
                quadrant_pattern = 0
                if tl_bright > avg_bright + threshold or tl_bright < avg_bright - threshold:
                    quadrant_pattern |= 1  # Arriba izquierda
                if tr_bright > avg_bright + threshold or tr_bright < avg_bright - threshold:
                    quadrant_pattern |= 2  # Arriba derecha
                if bl_bright > avg_bright + threshold or bl_bright < avg_bright - threshold:
                    quadrant_pattern |= 4  # Abajo izquierda
                if br_bright > avg_bright + threshold or br_bright < avg_bright - threshold:
                    quadrant_pattern |= 8  # Abajo derecha
                
                # Mapear el patrón a un carácter de bloque Unicode
                block_chars = {
                    0: ' ',      # Ningún cuadrante
                    1: '▘',      # Arriba izquierda
                    2: '▝',      # Arriba derecha
                    3: '▀',      # Arriba completo
                    4: '▖',      # Abajo izquierda
                    5: '▌',      # Izquierda completo
                    6: '▞',      # Diagonal ↘
                    7: '▛',      # Todo excepto abajo derecha
                    8: '▗',      # Abajo derecha
                    9: '▚',      # Diagonal ↗
                    10: '▐',     # Derecha completo
                    11: '▜',     # Todo excepto abajo izquierda
                    12: '▄',     # Abajo completo
                    13: '▙',     # Todo excepto arriba derecha
                    14: '▟',     # Todo excepto arriba izquierda
                    15: '█'      # Todos los cuadrantes
                }
                
                character = block_chars[quadrant_pattern]
                
                # Determinar colores para primer plano y fondo
                if quadrant_pattern == 0:
                    # Espacio en blanco con color de fondo promedio
                    texto.append(' ', style=f"on rgb({r_bg},{g_bg},{b_bg})")
                elif quadrant_pattern == 15:
                    # Bloque completo
                    texto.append('█', style=f"rgb({r_bg},{g_bg},{b_bg})")
                else:
                    # Para cuadrantes parciales, necesitamos color de primer y segundo plano
                    # Agrupar colores según si están en cuadrantes activos o inactivos
                    active_colors = []
                    inactive_colors = []
                    
                    quads = [(top_left, 1), (top_right, 2), (bottom_left, 4), (bottom_right, 8)]
                    for color, mask in quads:
                        if quadrant_pattern & mask:
                            active_colors.append(color)
                        else:
                            inactive_colors.append(color)
                    
                    # Promediar colores para determinar primer plano y fondo
                    if active_colors:
                        r_fg = sum(c[0] for c in active_colors) // len(active_colors)
                        g_fg = sum(c[1] for c in active_colors) // len(active_colors)
                        b_fg = sum(c[2] for c in active_colors) // len(active_colors)
                    else:
                        r_fg, g_fg, b_fg = r_bg, g_bg, b_bg
                    
                    if inactive_colors:
                        r_bg = sum(c[0] for c in inactive_colors) // len(inactive_colors)
                        g_bg = sum(c[1] for c in inactive_colors) // len(inactive_colors)
                        b_bg = sum(c[2] for c in inactive_colors) // len(inactive_colors)
                    
                    # Aplicar el carácter con los colores calculados
                    texto.append(character, style=f"rgb({r_fg},{g_fg},{b_fg}) on rgb({r_bg},{g_bg},{b_bg})")
            
            texto.append('\n')
        
        # Mostrar en un panel
        nombre_archivo = os.path.basename(ruta_imagen)
        panel = Panel(
            texto,
            title=f"[bold cyan]{nombre_archivo}[/bold cyan]",
            border_style="blue"
        )
        
        console.print(panel)
        return True
        
    except Exception as e:
        console.print(f"[bold red]Error al procesar imagen HD: {str(e)}[/bold red]")
        return False
        
        
def mostrar_imagen_ansi(ruta_imagen, ancho=200, alto=None):
    """
    Muestra una imagen utilizando el modo ANSI de 256 colores para máxima compatibilidad.
    Este método ofrece alta resolución en terminales compatibles con ANSI.
    
    Args:
        ruta_imagen: Ruta al archivo de imagen
        ancho: Ancho deseado en caracteres (por defecto 200)
        alto: Alto deseado en caracteres (opcional)
    
    Returns:
        bool: True si la imagen se mostró correctamente
    """
    if not verificar_pillow():
        return False
    
    try:
        # Cargar imagen
        imagen = Image.open(ruta_imagen)
        if imagen.mode != "RGB":
            imagen = imagen.convert("RGB")
        
        # Calcular dimensiones
        ancho_original, alto_original = imagen.size
        if alto is None:
            # Calcular alto proporcional (2 píxeles por carácter)
            alto = int(alto_original * ancho / ancho_original // 2)
        
        # Redimensionar imagen
        imagen = imagen.resize((ancho, alto*2), Image.LANCZOS)
        
        # Función para convertir RGB a color ANSI de 256 colores
        def rgb_to_ansi_256(r, g, b):
            # Aproximar a los 216 colores estándar de la paleta de 256 colores
            r = (r * 5) // 255
            g = (g * 5) // 255
            b = (b * 5) // 255
            return 16 + (36 * r) + (6 * g) + b
        
        # Convertir la imagen a caracteres ANSI
        imagen_ansi = ""
        for y in range(0, alto*2, 2):  # Procesamos de 2 en 2 filas
            for x in range(ancho):
                # Píxel superior
                r1, g1, b1 = imagen.getpixel((x, y)) if y < alto*2 else (0, 0, 0)
                # Píxel inferior
                r2, g2, b2 = imagen.getpixel((x, y+1)) if y+1 < alto*2 else (0, 0, 0)
                
                # Convertir a colores ANSI
                color_sup = rgb_to_ansi_256(r1, g1, b1)
                color_inf = rgb_to_ansi_256(r2, g2, b2)
                
                # Usar bloque superior (▀) - fondo para píxel superior, primer plano para inferior
                imagen_ansi += f"\033[48;5;{color_sup}m\033[38;5;{color_inf}m▀\033[0m"
            
            imagen_ansi += "\n"
        
        # Imprimir directamente sin Rich para evitar interferencias
        print(f"\n--- {os.path.basename(ruta_imagen)} ---")
        print(imagen_ansi)
        return True
        
    except Exception as e:
        console.print(f"[bold red]Error al procesar imagen ANSI: {str(e)}[/bold red]")
        return False

def mostrar_imagen(ruta_imagen, modo="hd", ancho=None):
    """
    Función principal para mostrar una imagen con alta resolución.
    
    Args:
        ruta_imagen: Ruta al archivo de imagen
        modo: Método a usar: "hd" (bloques unicode) o "ansi" (256 colores)
        ancho: Ancho en caracteres (si es None, usa valores predeterminados)
    
    Returns:
        bool: True si la imagen se mostró correctamente
    """
    if not verificar_pillow():
        return False
    
    if not os.path.exists(ruta_imagen):
        console.print(f"[bold red]No se encuentra la imagen: {ruta_imagen}[/bold red]")
        return False
    
    # Establecer anchos predeterminados según el modo
    if ancho is None:
        if modo == "hd":
            ancho = 100  # Ancho predeterminado para modo HD
        elif modo == "ansi":
            ancho = 200  # Ancho predeterminado para modo ANSI
    
    # Mostrar según el modo seleccionado
    if modo == "hd":
        return mostrar_imagen_hd(ruta_imagen, ancho)
    elif modo == "ansi":
        return mostrar_imagen_ansi(ruta_imagen, ancho)
    else:
        console.print(f"[bold red]Modo desconocido: {modo}[/bold red]")
        console.print("Modos disponibles: 'hd' o 'ansi'")
        return False

# Función para probar la biblioteca
if __name__ == "__main__":
    console.print("[bold cyan]====== IMAGEN EN CONSOLA HD - PRUEBA ======[/bold cyan]")
    
    if not PIL_DISPONIBLE:
        console.print("[bold red]ERROR: Instala Pillow primero: pip install pillow[/bold red]")
        sys.exit(1)
    
    # Solicitar ruta de imagen para prueba
    console.print("[cyan]Ingresa la ruta de una imagen para probar:[/cyan]")
    ruta = input("> ").strip()
    
    if os.path.exists(ruta):
        # Mostrar con los diferentes modos
        console.print("\n[bold green]1. Mostrando en modo HD (bloques Unicode):[/bold green]")
        mostrar_imagen_hd(ruta, 50,50)
        
        #console.print("\n[bold green]2. Mostrando en modo ANSI (256 colores):[/bold green]")
        #mostrar_imagen_ansi(ruta, 200)
        
        console.print("\n[bold]¿Cuál modo te funciona mejor?[/bold]")
        console.print("El modo HD usa caracteres Unicode y colores RGB True Color.")
        console.print("El modo ANSI usa caracteres simples y colores ANSI de 256 colores.")
        console.print("Elige el que se vea mejor en tu terminal.")
    else:
        console.print(f"[bold red]No se encontró la imagen: {ruta}[/bold red]")

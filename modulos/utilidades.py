#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Módulo de utilidades para el juego de aventuras conversacional.
Proporciona funciones auxiliares utilizadas por los demás módulos.
"""

import time
import os
import json
from datetime import datetime
from rich.console import Console

# Importar módulo de estado para acceder a la configuración de depuración
from . import estado

# Inicializar consola para salida
console = Console()

def log_debug(mensaje):
    """
    Registra un mensaje de depuración si el modo debug está activado.
    
    Args:
        mensaje (str): El mensaje a registrar
    """
    if estado.obtener_debug():
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        console.print(f"[bold blue on white][{timestamp}] DEBUG: {mensaje}[/bold blue on white]")

def log_archivo(mensaje, tipo="INFO"):
    """
    Registra un mensaje en un archivo de registro.
    
    Args:
        mensaje (str): El mensaje a registrar
        tipo (str): El tipo de mensaje (INFO, ERROR, WARNING, etc.)
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Crear directorio de logs si no existe
    os.makedirs("logs", exist_ok=True)
    
    # Nombre del archivo de log basado en la fecha actual
    log_file = os.path.join("logs", f"{datetime.now().strftime('%Y-%m-%d')}.log")
    
    # Escribir mensaje en el archivo
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] [{tipo}] {mensaje}\n")

def log_operacion_archivo(accion, archivo, detalle=None):
    """
    Registra una operación de archivo específica con formato especial.
    
    Args:
        accion (str): La acción realizada (CARGA, BÚSQUEDA, ESCRITURA)
        archivo (str): La ruta del archivo
        detalle (str, optional): Detalles adicionales
    """
    if estado.obtener_debug():
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        mensaje = f"[{timestamp}] [{accion}] Archivo: {archivo}"
        if detalle:
            mensaje += f" | {detalle}"
        
        console.print(f"[bold cyan]{mensaje}[/bold cyan]")
        log_archivo(mensaje, tipo=accion)

def cargar_json_seguro(ruta_archivo):
    """
    Carga un archivo JSON de manera segura con manejo de errores.
    
    Args:
        ruta_archivo (str): Ruta al archivo JSON
        
    Returns:
        dict/list: Datos cargados o None si hay error
    """
    try:
        log_operacion_archivo("CARGA", ruta_archivo, "Iniciando lectura")
        with open(ruta_archivo, 'r', encoding='utf-8') as archivo:
            datos = json.load(archivo)
        log_operacion_archivo("CARGA", ruta_archivo, "Lectura exitosa")
        return datos
    except FileNotFoundError:
        log_operacion_archivo("ERROR", ruta_archivo, "Archivo no encontrado")
        console.print(f"[bold red]Error: No se encontró el archivo {ruta_archivo}[/bold red]")
        return None
    except json.JSONDecodeError:
        log_operacion_archivo("ERROR", ruta_archivo, "JSON inválido")
        console.print(f"[bold red]Error: El archivo {ruta_archivo} no contiene JSON válido[/bold red]")
        return None
    except Exception as e:
        log_operacion_archivo("ERROR", ruta_archivo, f"Error inesperado: {str(e)}")
        console.print(f"[bold red]Error al cargar {ruta_archivo}: {str(e)}[/bold red]")
        return None

def guardar_json_seguro(ruta_archivo, datos):
    """
    Guarda datos en un archivo JSON de manera segura.
    
    Args:
        ruta_archivo (str): Ruta donde guardar el archivo
        datos (dict/list): Datos a guardar
        
    Returns:
        bool: True si se guardó correctamente, False si hubo error
    """
    try:
        # Asegurar que el directorio existe
        os.makedirs(os.path.dirname(ruta_archivo), exist_ok=True)
        
        log_operacion_archivo("ESCRITURA", ruta_archivo, "Iniciando escritura")
        with open(ruta_archivo, 'w', encoding='utf-8') as archivo:
            json.dump(datos, archivo, indent=2, ensure_ascii=False)
        log_operacion_archivo("ESCRITURA", ruta_archivo, "Escritura exitosa")
        return True
    except Exception as e:
        log_operacion_archivo("ERROR", ruta_archivo, f"Error al guardar: {str(e)}")
        console.print(f"[bold red]Error al guardar {ruta_archivo}: {str(e)}[/bold red]")
        return False

def pausar(segundos=1):
    """
    Pausa la ejecución por un número determinado de segundos.
    Útil para efectos dramáticos o animaciones simples.
    
    Args:
        segundos (float): Tiempo de pausa en segundos
    """
    time.sleep(segundos)

def mostrar_progreso(actual, total, descripcion="Cargando", longitud=40):
    """
    Muestra una barra de progreso en la consola.
    
    Args:
        actual (int): Progreso actual
        total (int): Total a alcanzar
        descripcion (str): Texto descriptivo
        longitud (int): Longitud de la barra en caracteres
    """
    porcentaje = min(100, int(actual / total * 100))
    completado = int(longitud * porcentaje / 100)
    barra = f"[{'=' * completado}{' ' * (longitud - completado)}] {porcentaje}%"
    console.print(f"\r{descripcion}: {barra}", end="")
    
    if actual >= total:
        console.print()  # Nueva línea al completar

def formatear_tiempo(segundos):
    """
    Convierte segundos en formato de tiempo legible.
    
    Args:
        segundos (int): Tiempo en segundos
        
    Returns:
        str: Tiempo formateado (HH:MM:SS)
    """
    minutos, segundos = divmod(int(segundos), 60)
    horas, minutos = divmod(minutos, 60)
    return f"{horas:02d}:{minutos:02d}:{segundos:02d}"

def truncar_texto(texto, max_longitud=50):
    """
    Trunca un texto si excede una longitud máxima.
    
    Args:
        texto (str): Texto a truncar
        max_longitud (int): Longitud máxima
        
    Returns:
        str: Texto truncado con "..." si era más largo
    """
    if len(texto) <= max_longitud:
        return texto
    return texto[:max_longitud-3] + "..."

def generar_timestamp():
    """
    Genera un timestamp único para identificar guardados o logs.
    
    Returns:
        str: Timestamp en formato legible
    """
    return datetime.now().strftime("%Y%m%d_%H%M%S")

def normalizar_id(texto):
    """
    Normaliza un texto para usarlo como ID.
    Elimina espacios, caracteres especiales, etc.
    
    Args:
        texto (str): Texto a normalizar
        
    Returns:
        str: Texto normalizado como ID
    """
    # Convertir a minúsculas y reemplazar espacios por guiones bajos
    resultado = texto.lower().replace(" ", "_")
    # Eliminar caracteres no alfanuméricos ni guiones
    resultado = "".join(c for c in resultado if c.isalnum() or c == "_")
    return resultado
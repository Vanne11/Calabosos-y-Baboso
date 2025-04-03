#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Módulo de estado para el juego de aventuras conversacional.
Maneja el estado del juego, incluyendo estadísticas, inventario, progreso y opciones.
"""

import os
import json
import time
from datetime import datetime
from rich.console import Console

# Importar configuración
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import STATS_INICIAL, DIFICULTAD_ACTUAL, DIR_GUARDADO, EXTENSION_GUARDADO

# Inicializar consola para salida
console = Console()

# Variables de estado global
_estado_juego = {
    "stats": {},               # Estadísticas del jugador
    "inventario": [],          # Objetos en posesión
    "rutas_visitadas": [],     # Rutas ya recorridas
    "habilidades": [],         # Habilidades desbloqueadas
    "decisiones": {},          # Decisiones importantes tomadas
    "flags": {},               # Indicadores de estado (ej: "puerta_abierta")
    "variables": {},           # Variables dinámicas durante el juego
    "tiempo_juego": 0,         # Tiempo total jugado en segundos
    "ultima_ruta": None,       # Última ruta visitada
    "dificultad": None         # Configuración de dificultad
}

# Variables de configuración
_modo_debug = False  # Modo depuración

# Funciones para acceso y modificación del estado

def obtener_debug():
    """Obtiene el estado actual del modo depuración."""
    return _modo_debug

def establecer_debug(valor):
    """Establece el modo depuración."""
    global _modo_debug
    _modo_debug = valor

def inicializar_estado():
    """Inicializa el estado del juego con valores predeterminados."""
    global _estado_juego
    
    _estado_juego["stats"] = STATS_INICIAL.copy()
    _estado_juego["inventario"] = []
    _estado_juego["rutas_visitadas"] = []
    _estado_juego["habilidades"] = []
    _estado_juego["decisiones"] = {}
    _estado_juego["flags"] = {}
    _estado_juego["variables"] = {}
    _estado_juego["tiempo_juego"] = 0
    _estado_juego["ultima_ruta"] = None
    _estado_juego["dificultad"] = DIFICULTAD_ACTUAL
    
    if _modo_debug:
        console.print("[cyan]Estado del juego inicializado[/cyan]")

def reiniciar_estado():
    """Reinicia el estado del juego a valores predeterminados."""
    inicializar_estado()
    if _modo_debug:
        console.print("[cyan]Estado del juego reiniciado[/cyan]")

def obtener_estado_completo():
    """
    Obtiene una copia del estado completo del juego.
    
    Returns:
        dict: El estado actual del juego
    """
    return _estado_juego.copy()

def actualizar_tiempo_juego():
    """Actualiza el contador de tiempo jugado."""
    global _tiempo_inicio
    if '_tiempo_inicio' in globals():
        _estado_juego["tiempo_juego"] += time.time() - _tiempo_inicio
    _tiempo_inicio = time.time()

def obtener_tiempo_juego_formateado():
    """
    Obtiene el tiempo de juego en formato legible.
    
    Returns:
        str: Tiempo de juego formateado (HH:MM:SS)
    """
    segundos = _estado_juego["tiempo_juego"]
    minutos, segundos = divmod(int(segundos), 60)
    horas, minutos = divmod(minutos, 60)
    return f"{horas:02d}:{minutos:02d}:{segundos:02d}"

# Funciones específicas para estadísticas

def obtener_stats():
    """
    Obtiene las estadísticas actuales del jugador.
    
    Returns:
        dict: Las estadísticas del jugador
    """
    return _estado_juego["stats"].copy()

def obtener_stat(nombre_stat):
    """
    Obtiene el valor de una estadística específica.
    
    Args:
        nombre_stat (str): Nombre de la estadística
        
    Returns:
        int: Valor de la estadística o 0 si no existe
    """
    return _estado_juego["stats"].get(nombre_stat, 0)

def establecer_stat(nombre_stat, valor):
    """
    Establece el valor de una estadística.
    
    Args:
        nombre_stat (str): Nombre de la estadística
        valor (int): Nuevo valor
    """
    _estado_juego["stats"][nombre_stat] = max(0, min(100, valor))  # Limitar entre 0 y 100
    if _modo_debug:
        console.print(f"[cyan]Stat '{nombre_stat}' establecido a {valor}[/cyan]")

def modificar_stat(nombre_stat, modificador):
    """
    Modifica el valor de una estadística sumando o restando.
    
    Args:
        nombre_stat (str): Nombre de la estadística
        modificador (int): Cantidad a añadir (o restar si es negativo)
        
    Returns:
        int: El nuevo valor de la estadística
    """
    valor_actual = obtener_stat(nombre_stat)
    nuevo_valor = max(0, min(100, valor_actual + modificador))
    _estado_juego["stats"][nombre_stat] = nuevo_valor
    
    if _modo_debug:
        cambio = "aumentado" if modificador > 0 else "disminuido"
        console.print(f"[cyan]Stat '{nombre_stat}' {cambio} de {valor_actual} a {nuevo_valor}[/cyan]")
    
    return nuevo_valor

# Funciones para inventario

def obtener_inventario():
    """
    Obtiene el inventario actual del jugador.
    
    Returns:
        list: Lista de objetos en el inventario
    """
    return _estado_juego["inventario"].copy()

def tiene_objeto(nombre_objeto):
    """
    Verifica si el jugador tiene un objeto específico.
    
    Args:
        nombre_objeto (str): Nombre del objeto a buscar
        
    Returns:
        bool: True si tiene el objeto, False en caso contrario
    """
    return nombre_objeto in _estado_juego["inventario"]

def añadir_objeto(nombre_objeto):
    """
    Añade un objeto al inventario.
    
    Args:
        nombre_objeto (str): Nombre del objeto a añadir
        
    Returns:
        bool: True si se añadió correctamente
    """
    if nombre_objeto not in _estado_juego["inventario"]:
        _estado_juego["inventario"].append(nombre_objeto)
        if _modo_debug:
            console.print(f"[cyan]Objeto '{nombre_objeto}' añadido al inventario[/cyan]")
        return True
    return False

def quitar_objeto(nombre_objeto):
    """
    Quita un objeto del inventario.
    
    Args:
        nombre_objeto (str): Nombre del objeto a quitar
        
    Returns:
        bool: True si se quitó correctamente, False si no se encontró
    """
    if nombre_objeto in _estado_juego["inventario"]:
        _estado_juego["inventario"].remove(nombre_objeto)
        if _modo_debug:
            console.print(f"[cyan]Objeto '{nombre_objeto}' quitado del inventario[/cyan]")
        return True
    return False

# Funciones para rutas y progreso

def marcar_ruta_visitada(id_ruta):
    """
    Marca una ruta como visitada.
    
    Args:
        id_ruta (str): ID de la ruta
    """
    if id_ruta not in _estado_juego["rutas_visitadas"]:
        _estado_juego["rutas_visitadas"].append(id_ruta)
    
    _estado_juego["ultima_ruta"] = id_ruta
    
    if _modo_debug:
        console.print(f"[cyan]Ruta '{id_ruta}' marcada como visitada[/cyan]")

def ha_visitado_ruta(id_ruta):
    """
    Verifica si una ruta ha sido visitada.
    
    Args:
        id_ruta (str): ID de la ruta
        
    Returns:
        bool: True si la ruta ha sido visitada, False en caso contrario
    """
    return id_ruta in _estado_juego["rutas_visitadas"]

def obtener_ultima_ruta():
    """
    Obtiene la última ruta visitada.
    
    Returns:
        str: ID de la última ruta visitada o None
    """
    return _estado_juego["ultima_ruta"]

# Funciones para flags y variables de juego

def establecer_flag(nombre_flag, valor=True):
    """
    Establece un flag de juego.
    
    Args:
        nombre_flag (str): Nombre del flag
        valor (bool): Valor del flag (True por defecto)
    """
    _estado_juego["flags"][nombre_flag] = valor
    if _modo_debug:
        console.print(f"[cyan]Flag '{nombre_flag}' establecido a {valor}[/cyan]")

def obtener_flag(nombre_flag):
    """
    Obtiene el valor de un flag de juego.
    
    Args:
        nombre_flag (str): Nombre del flag
        
    Returns:
        bool: Valor del flag o False si no existe
    """
    return _estado_juego["flags"].get(nombre_flag, False)

def establecer_variable(nombre, valor):
    """
    Establece una variable de juego.
    
    Args:
        nombre (str): Nombre de la variable
        valor: Valor a guardar
    """
    _estado_juego["variables"][nombre] = valor
    if _modo_debug:
        console.print(f"[cyan]Variable '{nombre}' establecida[/cyan]")

def obtener_variable(nombre, valor_defecto=None):
    """
    Obtiene el valor de una variable de juego.
    
    Args:
        nombre (str): Nombre de la variable
        valor_defecto: Valor por defecto si no existe
        
    Returns:
        Valor de la variable o valor_defecto
    """
    return _estado_juego["variables"].get(nombre, valor_defecto)

# Funciones para guardar y cargar el estado

def guardar_perfil(nombre=None):
    """
    Guarda el estado actual del juego como un perfil.
    
    Args:
        nombre (str, optional): Nombre del perfil a guardar
            Si es None, usa un nombre basado en la fecha
            
    Returns:
        str: Ruta del archivo guardado o None si hubo error
    """
    # Actualizar tiempo de juego antes de guardar
    actualizar_tiempo_juego()
    
    # Crear el directorio de guardado si no existe
    os.makedirs(DIR_GUARDADO, exist_ok=True)
    
    # Si no se provee nombre, crear uno basado en fecha y hora
    if nombre is None:
        fecha_hora = datetime.now().strftime("%Y%m%d_%H%M%S")
        nombre = f"guardado_{fecha_hora}"
    
    # Asegurar que el nombre termine con la extensión correcta
    if not nombre.endswith(EXTENSION_GUARDADO):
        nombre = nombre + EXTENSION_GUARDADO
    
    # Construir ruta completa
    ruta_guardado = os.path.join(DIR_GUARDADO, nombre)
    
    # Preparar datos para guardar
    datos_guardado = {
        "estado_juego": _estado_juego,
        "fecha_guardado": datetime.now().isoformat(),
        "version": "1.0.0"  # Versión del formato de guardado
    }
    
    try:
        with open(ruta_guardado, 'w', encoding='utf-8') as archivo:
            json.dump(datos_guardado, archivo, indent=2, ensure_ascii=False)
        
        if _modo_debug:
            console.print(f"[green]Juego guardado exitosamente como '{nombre}'[/green]")
        else:
            console.print(f"[green]Juego guardado exitosamente[/green]")
        
        return ruta_guardado
    except Exception as e:
        console.print(f"[bold red]Error al guardar el juego: {str(e)}[/bold red]")
        return None

def cargar_perfil(nombre):
    """
    Carga un perfil de juego guardado.
    
    Args:
        nombre (str): Nombre del perfil a cargar
            
    Returns:
        bool: True si se cargó correctamente, False en caso contrario
    """
    global _estado_juego, _tiempo_inicio
    
    # Asegurar que el nombre termine con la extensión correcta
    if not nombre.endswith(EXTENSION_GUARDADO):
        nombre = nombre + EXTENSION_GUARDADO
    
    # Construir ruta completa
    ruta_guardado = os.path.join(DIR_GUARDADO, nombre)
    
    if not os.path.exists(ruta_guardado):
        console.print(f"[bold red]Error: El archivo de guardado '{nombre}' no existe[/bold red]")
        return False
    
    try:
        with open(ruta_guardado, 'r', encoding='utf-8') as archivo:
            datos_guardado = json.load(archivo)
        
        # Verificar versión del formato
        version = datos_guardado.get("version", "0.0.0")
        if version != "1.0.0":
            console.print(f"[yellow]Advertencia: El archivo de guardado usa una versión diferente ({version})[/yellow]")
        
        # Cargar estado del juego
        _estado_juego = datos_guardado.get("estado_juego", {})
        
        # Reiniciar contador de tiempo
        _tiempo_inicio = time.time()
        
        if _modo_debug:
            fecha_guardado = datos_guardado.get("fecha_guardado", "desconocida")
            console.print(f"[green]Perfil '{nombre}' cargado correctamente (guardado: {fecha_guardado})[/green]")
        else:
            console.print("[green]Perfil cargado correctamente[/green]")
        
        return True
    except json.JSONDecodeError:
        console.print(f"[bold red]Error: El archivo de guardado '{nombre}' está corrupto[/bold red]")
        return False
    except Exception as e:
        console.print(f"[bold red]Error al cargar el perfil: {str(e)}[/bold red]")
        return False

def listar_perfiles():
    """
    Lista todos los perfiles de guardado disponibles.
    
    Returns:
        list: Lista de diccionarios con información de los perfiles
    """
    # Crear el directorio de guardado si no existe
    os.makedirs(DIR_GUARDADO, exist_ok=True)
    
    perfiles = []
    
    # Obtener todos los archivos de guardado
    archivos = [f for f in os.listdir(DIR_GUARDADO) if f.endswith(EXTENSION_GUARDADO)]
    
    for archivo in archivos:
        ruta_completa = os.path.join(DIR_GUARDADO, archivo)
        try:
            with open(ruta_completa, 'r', encoding='utf-8') as f:
                datos = json.load(f)
                
            # Extraer información útil
            fecha = datos.get("fecha_guardado", "Desconocida")
            ultima_ruta = datos.get("estado_juego", {}).get("ultima_ruta", "Desconocida")
            tiempo = datos.get("estado_juego", {}).get("tiempo_juego", 0)
            
            # Formato más legible para el tiempo
            horas = int(tiempo // 3600)
            minutos = int((tiempo % 3600) // 60)
            
            perfiles.append({
                "nombre": archivo.replace(EXTENSION_GUARDADO, ""),
                "ruta_completa": ruta_completa,
                "fecha": fecha,
                "ultima_ruta": ultima_ruta,
                "tiempo_juego": tiempo,
                "tiempo_formato": f"{horas}h {minutos}m"
            })
        except Exception:
            # Ignorar archivos corruptos
            continue
    
    # Ordenar por fecha de guardado (más reciente primero)
    perfiles.sort(key=lambda x: x["fecha"], reverse=True)
    
    return perfiles

def eliminar_perfil(nombre):
    """
    Elimina un perfil de guardado.
    
    Args:
        nombre (str): Nombre del perfil a eliminar
            
    Returns:
        bool: True si se eliminó correctamente, False en caso contrario
    """
    # Asegurar que el nombre termine con la extensión correcta
    if not nombre.endswith(EXTENSION_GUARDADO):
        nombre = nombre + EXTENSION_GUARDADO
    
    # Construir ruta completa
    ruta_guardado = os.path.join(DIR_GUARDADO, nombre)
    
    if not os.path.exists(ruta_guardado):
        console.print(f"[bold red]Error: El archivo de guardado '{nombre}' no existe[/bold red]")
        return False
    
    try:
        os.remove(ruta_guardado)
        console.print(f"[green]Perfil '{nombre}' eliminado correctamente[/green]")
        return True
    except Exception as e:
        console.print(f"[bold red]Error al eliminar el perfil: {str(e)}[/bold red]")
        return False
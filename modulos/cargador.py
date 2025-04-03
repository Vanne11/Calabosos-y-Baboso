#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Módulo cargador para el juego de aventuras conversacional.
Gestiona la carga de todos los archivos de datos del juego.
"""

import os
import re
from rich.console import Console

# Importar módulos del juego
from . import estado
from . import utilidades

# Importar configuración
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import (
    ARCHIVO_RUTAS, 
    ARCHIVO_DIALOGOS,
    ARCHIVO_TIRADAS, 
    ARCHIVO_RELLENO
)

# Inicializar consola para salida
console = Console()

# Almacenamiento global para los datos cargados
_datos_rutas = None
_datos_dialogos = None
_datos_tiradas = None
_datos_relleno = None

def cargar_todos_datos():
    """
    Carga todos los archivos de datos necesarios para el juego.
    
    Returns:
        bool: True si todos los archivos se cargaron correctamente, False en caso contrario
    """
    global _datos_rutas, _datos_dialogos, _datos_tiradas, _datos_relleno
    
    utilidades.log_debug("Iniciando carga de todos los archivos de datos...")
    
    # Cargar rutas
    _datos_rutas = utilidades.cargar_json_seguro(ARCHIVO_RUTAS)
    if not _datos_rutas:
        console.print(f"[bold red]Error crítico: No se pudo cargar el archivo de rutas[/bold red]")
        return False
    
    # Cargar diálogos
    _datos_dialogos = utilidades.cargar_json_seguro(ARCHIVO_DIALOGOS)
    if not _datos_dialogos:
        console.print(f"[bold red]Error crítico: No se pudo cargar el archivo de diálogos[/bold red]")
        return False
    
    # Cargar tiradas
    _datos_tiradas = utilidades.cargar_json_seguro(ARCHIVO_TIRADAS)
    if not _datos_tiradas:
        console.print(f"[bold red]Error crítico: No se pudo cargar el archivo de tiradas[/bold red]")
        return False
    
    # Cargar relleno
    _datos_relleno = utilidades.cargar_json_seguro(ARCHIVO_RELLENO)
    if not _datos_relleno:
        console.print(f"[bold red]Error crítico: No se pudo cargar el archivo de relleno[/bold red]")
        return False
    
    utilidades.log_debug("Todos los archivos de datos cargados correctamente")
    return True

def obtener_ruta_inicial():
    """
    Obtiene el ID de la ruta inicial del juego.
    
    Returns:
        str: ID de la ruta inicial o None si no se encuentra
    """
    if not _datos_rutas:
        utilidades.log_debug("Error: No hay datos de rutas cargados")
        return None
    
    rutas = _datos_rutas.get("rutas", [])
    if not rutas:
        utilidades.log_debug("Error: No hay rutas definidas")
        return None
    
    # Buscar la ruta con ID "introduccion" primero
    for ruta in rutas:
        if ruta.get("id") == "introduccion":
            utilidades.log_debug(f"Ruta inicial encontrada por ID: introduccion")
            return "introduccion"
    
    # Si no hay ruta "introduccion", usar la primera ruta
    primera_ruta = rutas[0].get("id")
    utilidades.log_debug(f"Ruta inicial: primera ruta encontrada ({primera_ruta})")
    return primera_ruta

def buscar_ruta(ruta_id):
    """
    Busca una ruta específica por su ID.
    
    Args:
        ruta_id (str): ID de la ruta a buscar
        
    Returns:
        dict: Datos de la ruta o None si no se encuentra
    """
    if not _datos_rutas:
        utilidades.log_debug(f"Error en buscar_ruta: No hay datos de rutas cargados")
        return None
    
    utilidades.log_operacion_archivo("BÚSQUEDA", ARCHIVO_RUTAS, f"Buscando ruta: {ruta_id}")
    
    for ruta in _datos_rutas.get("rutas", []):
        if ruta.get("id") == ruta_id:
            utilidades.log_debug(f"Ruta encontrada: {ruta_id}")
            return ruta
    
    utilidades.log_debug(f"Ruta no encontrada: {ruta_id}")
    return None

def cargar_dialogo(id_dialogo):
    """
    Carga un diálogo específico por su ID.
    
    Args:
        id_dialogo (str): ID del diálogo a cargar
        
    Returns:
        dict: Datos del diálogo o None si no se encuentra
    """
    if not _datos_dialogos:
        utilidades.log_debug(f"Error en cargar_dialogo: No hay datos de diálogos cargados")
        return None
    
    utilidades.log_operacion_archivo("BÚSQUEDA", ARCHIVO_DIALOGOS, f"Buscando diálogo: {id_dialogo}")
    
    for dialogo in _datos_dialogos.get("dialogos", []):
        if dialogo.get("id") == id_dialogo:
            utilidades.log_debug(f"Diálogo encontrado: {id_dialogo}")
            return dialogo
    
    utilidades.log_debug(f"Diálogo no encontrado: {id_dialogo}")
    return None

def cargar_tirada(id_tirada):
    """
    Carga una tirada específica por su ID.
    
    Args:
        id_tirada (str): ID de la tirada a cargar
        
    Returns:
        dict: Datos de la tirada o None si no se encuentra
    """
    if not _datos_tiradas:
        utilidades.log_debug(f"Error en cargar_tirada: No hay datos de tiradas cargados")
        return None
    
    utilidades.log_operacion_archivo("BÚSQUEDA", ARCHIVO_TIRADAS, f"Buscando tirada: {id_tirada}")
    
    for tirada in _datos_tiradas.get("tiradas", []):
        if tirada.get("id") == id_tirada:
            utilidades.log_debug(f"Tirada encontrada: {id_tirada}")
            return tirada
    
    utilidades.log_debug(f"Tirada no encontrada: {id_tirada}")
    return None

def cargar_relleno(id_relleno):
    """
    Carga un fragmento de texto reutilizable por su ID.
    
    Args:
        id_relleno (str): ID del fragmento a cargar
        
    Returns:
        str: Texto del fragmento o cadena vacía si no se encuentra
    """
    if not _datos_relleno:
        utilidades.log_debug(f"Error en cargar_relleno: No hay datos de relleno cargados")
        return ""
    
    utilidades.log_operacion_archivo("BÚSQUEDA", ARCHIVO_RELLENO, f"Buscando fragmento: {id_relleno}")
    
    for fragmento in _datos_relleno.get("fragmentos", []):
        if fragmento.get("id") == id_relleno:
            utilidades.log_debug(f"Fragmento encontrado: {id_relleno}")
            return fragmento.get("texto", "")
    
    utilidades.log_debug(f"Fragmento no encontrado: {id_relleno}")
    return ""

def resolver_referencias(texto):
    """
    Resuelve las referencias a fragmentos de relleno dentro de un texto.
    
    Args:
        texto (str): Texto con referencias a resolver
        
    Returns:
        str: Texto con las referencias resueltas
    """
    if not texto:
        return texto
    
    # Busca patrones como ${relleno:id_del_fragmento} en el texto
    patron = r'\${([^:]+):([^}]+)}'
    
    # Función que se ejecuta por cada coincidencia encontrada
    def reemplazar(coincidencia):
        tipo = coincidencia.group(1)  # Obtiene el tipo de referencia (ej: "relleno")
        id_ref = coincidencia.group(2)  # Obtiene el ID del fragmento
        
        utilidades.log_debug(f"Resolviendo referencia - Tipo: {tipo}, ID: {id_ref}")
        
        # Actualmente solo soporta referencias de tipo "relleno"
        if tipo == "relleno":
            return cargar_relleno(id_ref)  # Reemplaza por el texto del fragmento
        else:
            return f"[ERROR: Referencia no encontrada {tipo}:{id_ref}]"
    
    # Aplica la función reemplazar a todas las coincidencias encontradas
    return re.sub(patron, reemplazar, texto)

def obtener_conexiones_ruta(ruta_id):
    """
    Obtiene las conexiones (rutas siguientes posibles) de una ruta específica.
    
    Args:
        ruta_id (str): ID de la ruta
        
    Returns:
        list: Lista de diccionarios con información de las conexiones
    """
    ruta = buscar_ruta(ruta_id)
    if not ruta:
        return []
    
    conexiones = []
    for conexion_id in ruta.get("conexiones", []):
        ruta_conexion = buscar_ruta(conexion_id)
        if ruta_conexion:
            conexiones.append({
                "id": conexion_id,
                "nombre": ruta_conexion.get("nombre", conexion_id),
                "descripcion": ruta_conexion.get("descripcion", "")
            })
    
    return conexiones

def obtener_opciones_dialogo(id_dialogo):
    """
    Obtiene las opciones disponibles de un diálogo específico.
    
    Args:
        id_dialogo (str): ID del diálogo
        
    Returns:
        list: Lista de opciones con sus rutas siguientes
    """
    dialogo = cargar_dialogo(id_dialogo)
    if not dialogo:
        return []
    
    return dialogo.get("opciones", [])

def verificar_condicion_tirada(tirada_id, condicion_nombre):
    """
    Verifica si se cumple una condición específica para una tirada.
    
    Args:
        tirada_id (str): ID de la tirada a verificar
        condicion_nombre (str): Nombre de la condición a verificar
        
    Returns:
        bool: True si se cumple la condición, False en caso contrario
    """
    tirada = cargar_tirada(tirada_id)
    if not tirada or "condicion" not in tirada:
        return True  # Si no hay condición, se considera cumplida
    
    condicion = tirada.get("condicion")
    
    # Diferentes tipos de condiciones
    if condicion == "tiene_sal" and condicion_nombre == "tiene_sal":
        return estado.tiene_objeto("Saco de sal")
    
    # Otras condiciones pueden implementarse aquí
    
    # Por defecto, si la condición no se reconoce, se considera no cumplida
    utilidades.log_debug(f"Condición no reconocida: {condicion}")
    return False

def hay_tirada_en_ruta(ruta_id):
    """
    Verifica si una ruta contiene una tirada de dados.
    
    Args:
        ruta_id (str): ID de la ruta a verificar
        
    Returns:
        bool: True si la ruta contiene una tirada, False en caso contrario
    """
    ruta = buscar_ruta(ruta_id)
    return ruta and "tirada" in ruta

def validar_integridad_datos():
    """
    Verifica la integridad de los datos cargados, buscando inconsistencias.
    
    Returns:
        list: Lista de problemas encontrados
    """
    problemas = []
    
    # Verificar que todas las rutas referenciadas existen
    if _datos_rutas:
        for ruta in _datos_rutas.get("rutas", []):
            ruta_id = ruta.get("id")
            
            # Verificar conexiones
            for conexion_id in ruta.get("conexiones", []):
                if not buscar_ruta(conexion_id):
                    problemas.append(f"La ruta '{ruta_id}' hace referencia a una conexión inexistente: '{conexion_id}'")
            
            # Verificar escenario
            escenario_id = ruta.get("escenario")
            if escenario_id and not cargar_dialogo(escenario_id):
                problemas.append(f"La ruta '{ruta_id}' hace referencia a un escenario inexistente: '{escenario_id}'")
    
    # Verificar que todos los diálogos sean correctos
    if _datos_dialogos:
        for dialogo in _datos_dialogos.get("dialogos", []):
            dialogo_id = dialogo.get("id")
            
            # Verificar opciones
            for opcion in dialogo.get("opciones", []):
                siguiente_ruta = opcion.get("siguiente_ruta")
                if siguiente_ruta and not buscar_ruta(siguiente_ruta):
                    problemas.append(f"El diálogo '{dialogo_id}' hace referencia a una ruta inexistente: '{siguiente_ruta}'")
    
    return problemas

def cargar_ascii_art(nombre):
    """
    Carga un archivo de arte ASCII.
    
    Args:
        nombre (str): Nombre del archivo sin extensión
        
    Returns:
        str: Contenido del archivo o None si no existe
    """
    # Construir ruta al archivo ASCII
    from config import DIR_RECURSOS
    ruta_ascii = os.path.join(DIR_RECURSOS, "ascii_art", f"{nombre}.txt")
    
    if not os.path.exists(ruta_ascii):
        utilidades.log_debug(f"Archivo ASCII no encontrado: {ruta_ascii}")
        return None
    
    try:
        with open(ruta_ascii, 'r', encoding='utf-8') as archivo:
            contenido = archivo.read()
        return contenido
    except Exception as e:
        utilidades.log_debug(f"Error al cargar ASCII art: {str(e)}")
        return None